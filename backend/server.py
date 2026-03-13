from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'rutajob_fallback_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str  # "company" or "driver"

class UserLogin(BaseModel):
    email: str
    password: str

class CompanyCreate(BaseModel):
    company_name: str
    cif_nif: str
    address: str
    city: str
    country: str
    phone: str
    email: str
    contact_person: str
    iban: str
    debit_authorized: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    iban: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    phone: str
    email: str
    city: str
    country: str
    experience_years: str
    truck_types: List[str] = []
    accepts_loading: bool = False
    availability: str = "inmediata"
    availability_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DriverUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    experience_years: Optional[str] = None
    truck_types: Optional[List[str]] = None
    accepts_loading: Optional[bool] = None
    availability: Optional[str] = None
    availability_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class JobCreate(BaseModel):
    location_type: str
    start_time: str
    salary: float
    job_type: str
    description: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ApplicationCreate(BaseModel):
    job_id: str

class EvaluationCreate(BaseModel):
    driver_id: str
    commitment: int
    responsibility: int
    document_accuracy: int
    punctuality: int

class SubscriptionCreate(BaseModel):
    iban: str

class DocumentUpload(BaseModel):
    driver_id: str
    doc_type: str
    data_base64: str
    filename: Optional[str] = ""

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    # Try JWT first
    try:
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    except HTTPException:
        pass
    # Try session token (Google Auth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sesión no válida")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesión expirada")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_jwt_token(user_id, data.role)
    return {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "role": data.role,
        "token": token
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_jwt_token(user["user_id"], user["role"])
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "token": token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return safe_user

@api_router.post("/auth/session")
async def exchange_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Sesión inválida")
        session_data = resp.json()
    email = session_data.get("email")
    name = session_data.get("name", "")
    picture = session_data.get("picture", "")
    session_token = session_data.get("session_token", "")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        role = existing_user["role"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = ""
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "password_hash": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "token": session_token
    }

@api_router.post("/auth/set-role")
async def set_role(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    role = body.get("role")
    if role not in ["company", "driver"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": role}})
    return {"message": "Rol actualizado", "role": role}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token")
    return {"message": "Sesión cerrada"}

# ==================== COMPANY ROUTES ====================

@api_router.post("/companies")
async def create_company(data: CompanyCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Solo empresas pueden crear perfil")
    existing = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="La empresa ya tiene perfil")
    company_id = f"comp_{uuid.uuid4().hex[:12]}"
    company_doc = {
        "company_id": company_id,
        "user_id": user["user_id"],
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(company_doc)
    # Auto-create subscription mock
    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    sub_doc = {
        "subscription_id": sub_id,
        "company_id": company_id,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "next_payment_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "amount": 7.35,
        "status": "active",
        "iban": data.iban,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(sub_doc)
    result = {k: v for k, v in company_doc.items() if k != "_id"}
    return result

@api_router.get("/companies/me")
async def get_my_company(request: Request):
    user = await get_current_user(request)
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Perfil de empresa no encontrado")
    return company

@api_router.put("/companies/me")
async def update_company(data: CompanyUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    await db.companies.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return company

# ==================== DRIVER ROUTES ====================

@api_router.post("/drivers")
async def create_driver(data: DriverCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver":
        raise HTTPException(status_code=403, detail="Solo conductores pueden crear perfil")
    existing = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El conductor ya tiene perfil")
    driver_id = f"drv_{uuid.uuid4().hex[:12]}"
    driver_doc = {
        "driver_id": driver_id,
        "user_id": user["user_id"],
        **data.dict(),
        "is_blocked": False,
        "negative_evaluations": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.drivers.insert_one(driver_doc)
    result = {k: v for k, v in driver_doc.items() if k != "_id"}
    return result

@api_router.get("/drivers/me")
async def get_my_driver(request: Request):
    user = await get_current_user(request)
    driver = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Perfil de conductor no encontrado")
    return driver

@api_router.put("/drivers/me")
async def update_driver(data: DriverUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    await db.drivers.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    driver = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return driver

@api_router.get("/drivers/{driver_id}")
async def get_driver_by_id(driver_id: str, request: Request):
    await get_current_user(request)
    driver = await db.drivers.find_one({"driver_id": driver_id}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    # Get evaluations
    evals = await db.evaluations.find({"driver_id": driver_id}, {"_id": 0}).to_list(100)
    # Get documents metadata (no base64)
    docs = await db.documents.find({"driver_id": driver_id}, {"_id": 0, "data_base64": 0}).to_list(20)
    driver["evaluations"] = evals
    driver["documents"] = docs
    return driver

@api_router.put("/drivers/location")
async def update_driver_location(data: LocationUpdate, request: Request):
    user = await get_current_user(request)
    await db.drivers.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"latitude": data.latitude, "longitude": data.longitude}}
    )
    return {"message": "Ubicación actualizada"}

# ==================== DOCUMENT ROUTES ====================

@api_router.post("/documents/upload")
async def upload_document(data: DocumentUpload, request: Request):
    user = await get_current_user(request)
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    doc_record = {
        "document_id": doc_id,
        "driver_id": data.driver_id,
        "user_id": user["user_id"],
        "doc_type": data.doc_type,
        "data_base64": data.data_base64,
        "filename": data.filename,
        "verified": False,
        "analysis_result": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc_record)
    return {"document_id": doc_id, "doc_type": data.doc_type, "message": "Documento subido correctamente"}

@api_router.get("/documents/driver/{driver_id}")
async def get_driver_documents(driver_id: str, request: Request):
    await get_current_user(request)
    docs = await db.documents.find({"driver_id": driver_id}, {"_id": 0}).to_list(20)
    # Remove base64 data for listing (too large)
    for doc in docs:
        if "data_base64" in doc:
            doc["has_data"] = True
            del doc["data_base64"]
    return docs

@api_router.post("/documents/analyze/{document_id}")
async def analyze_document(document_id: str, request: Request):
    await get_current_user(request)
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key no configurada")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"doc-analysis-{document_id}",
            system_message="Eres un experto en análisis de documentos de transporte. Analiza el documento proporcionado y extrae la información relevante como nombre, número de documento, fecha de vencimiento, categoría, y cualquier otro dato importante. Responde en español."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        image_content = ImageContent(image_base64=doc["data_base64"])
        doc_type_names = {
            "licencia": "carta de conducción",
            "cap": "certificado CAP",
            "tacografo": "tarjeta de tacógrafo",
            "dni_tie": "DNI o TIE"
        }
        doc_name = doc_type_names.get(doc["doc_type"], doc["doc_type"])
        user_message = UserMessage(
            text=f"Analiza este documento de tipo '{doc_name}'. Extrae toda la información relevante: nombre completo, número de documento, fecha de expedición, fecha de vencimiento, categoría (si aplica), y cualquier otro dato importante. Indica si el documento parece válido.",
            file_contents=[image_content]
        )
        response = await chat.send_message(user_message)
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {"analysis_result": response, "verified": True}}
        )
        return {"document_id": document_id, "analysis": response, "verified": True}
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al analizar documento: {str(e)}")

# ==================== JOB ROUTES ====================

@api_router.post("/jobs")
async def create_job(data: JobCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Solo empresas pueden publicar vacantes")
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Primero debe crear su perfil de empresa")
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    lat = data.latitude if data.latitude else company.get("latitude", 0)
    lon = data.longitude if data.longitude else company.get("longitude", 0)
    job_doc = {
        "job_id": job_id,
        "company_id": company["company_id"],
        "company_name": company["company_name"],
        "user_id": user["user_id"],
        "location_type": data.location_type,
        "start_time": data.start_time,
        "salary": data.salary,
        "job_type": data.job_type,
        "description": data.description or "",
        "latitude": lat,
        "longitude": lon,
        "radius": 25,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.jobs.insert_one(job_doc)
    result = {k: v for k, v in job_doc.items() if k != "_id"}
    return result

@api_router.get("/jobs")
async def get_my_jobs(request: Request):
    user = await get_current_user(request)
    jobs = await db.jobs.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return jobs

@api_router.get("/jobs/nearby")
async def get_nearby_jobs(request: Request, lat: float = 0, lon: float = 0):
    user = await get_current_user(request)
    if user.get("role") == "driver":
        driver = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if driver and driver.get("is_blocked"):
            raise HTTPException(status_code=403, detail="Tu cuenta está bloqueada")
    all_jobs = await db.jobs.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    if lat == 0 and lon == 0:
        return all_jobs
    nearby = []
    for job in all_jobs:
        job_lat = job.get("latitude", 0)
        job_lon = job.get("longitude", 0)
        if job_lat == 0 and job_lon == 0:
            nearby.append(job)
            continue
        distance = haversine_distance(lat, lon, job_lat, job_lon)
        if distance <= 25:
            job["distance_km"] = round(distance, 1)
            nearby.append(job)
    return nearby

@api_router.get("/jobs/all")
async def get_all_jobs(request: Request):
    await get_current_user(request)
    jobs = await db.jobs.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str, request: Request):
    await get_current_user(request)
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return job

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, request: Request):
    user = await get_current_user(request)
    job = await db.jobs.find_one({"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    await db.jobs.delete_one({"job_id": job_id})
    await db.applications.delete_many({"job_id": job_id})
    return {"message": "Vacante eliminada"}

# ==================== APPLICATION ROUTES ====================

@api_router.post("/applications")
async def apply_to_job(data: ApplicationCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver":
        raise HTTPException(status_code=403, detail="Solo conductores pueden aplicar")
    driver = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Primero debe crear su perfil de conductor")
    if driver.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Tu cuenta está bloqueada")
    existing = await db.applications.find_one(
        {"job_id": data.job_id, "driver_id": driver["driver_id"]}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya has aplicado a esta vacante")
    app_id = f"app_{uuid.uuid4().hex[:12]}"
    app_doc = {
        "application_id": app_id,
        "job_id": data.job_id,
        "driver_id": driver["driver_id"],
        "driver_name": f"{driver['first_name']} {driver['last_name']}",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(app_doc)
    return {k: v for k, v in app_doc.items() if k != "_id"}

@api_router.get("/applications/job/{job_id}")
async def get_job_applications(job_id: str, request: Request):
    user = await get_current_user(request)
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    for app in applications:
        driver = await db.drivers.find_one({"driver_id": app["driver_id"]}, {"_id": 0, "data_base64": 0})
        if driver:
            app["driver"] = driver
            evals = await db.evaluations.find({"driver_id": app["driver_id"]}, {"_id": 0}).to_list(100)
            avg_score = 0
            if evals:
                total = sum((e["commitment"] + e["responsibility"] + e["document_accuracy"] + e["punctuality"]) / 4 for e in evals)
                avg_score = round(total / len(evals), 1)
            app["driver"]["avg_score"] = avg_score
            app["driver"]["eval_count"] = len(evals)
    return applications

@api_router.get("/applications/driver")
async def get_driver_applications(request: Request):
    user = await get_current_user(request)
    driver = await db.drivers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not driver:
        return []
    applications = await db.applications.find({"driver_id": driver["driver_id"]}, {"_id": 0}).to_list(100)
    for app in applications:
        job = await db.jobs.find_one({"job_id": app["job_id"]}, {"_id": 0})
        if job:
            app["job"] = job
    return applications

@api_router.put("/applications/{application_id}/hire")
async def hire_driver(application_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Solo empresas pueden contratar")
    application = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    await db.applications.update_one(
        {"application_id": application_id},
        {"$set": {"status": "hired"}}
    )
    return {"message": "Conductor contratado", "application_id": application_id}

# ==================== EVALUATION ROUTES ====================

@api_router.post("/evaluations")
async def create_evaluation(data: EvaluationCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Solo empresas pueden evaluar")
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Perfil de empresa no encontrado")
    for field in [data.commitment, data.responsibility, data.document_accuracy, data.punctuality]:
        if not (0 <= field <= 10):
            raise HTTPException(status_code=400, detail="Las puntuaciones deben ser entre 0 y 10")
    eval_id = f"eval_{uuid.uuid4().hex[:12]}"
    avg = (data.commitment + data.responsibility + data.document_accuracy + data.punctuality) / 4
    is_negative = avg < 5
    eval_doc = {
        "evaluation_id": eval_id,
        "company_id": company["company_id"],
        "company_name": company["company_name"],
        "driver_id": data.driver_id,
        "commitment": data.commitment,
        "responsibility": data.responsibility,
        "document_accuracy": data.document_accuracy,
        "punctuality": data.punctuality,
        "average": round(avg, 1),
        "is_negative": is_negative,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.evaluations.insert_one(eval_doc)
    # Check auto-block
    if is_negative:
        neg_count = await db.evaluations.count_documents({"driver_id": data.driver_id, "is_negative": True})
        if neg_count >= 6:
            await db.drivers.update_one(
                {"driver_id": data.driver_id},
                {"$set": {"is_blocked": True, "negative_evaluations": neg_count}}
            )
            logger.info(f"Driver {data.driver_id} blocked after {neg_count} negative evaluations")
    return {k: v for k, v in eval_doc.items() if k != "_id"}

@api_router.get("/evaluations/driver/{driver_id}")
async def get_driver_evaluations(driver_id: str, request: Request):
    await get_current_user(request)
    evals = await db.evaluations.find({"driver_id": driver_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return evals

# ==================== SUBSCRIPTION ROUTES (MOCK) ====================

@api_router.get("/subscriptions/me")
async def get_my_subscription(request: Request):
    user = await get_current_user(request)
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    sub = await db.subscriptions.find_one({"company_id": company["company_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    return sub

@api_router.put("/subscriptions/cancel")
async def cancel_subscription(request: Request):
    user = await get_current_user(request)
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    await db.subscriptions.update_one(
        {"company_id": company["company_id"]},
        {"$set": {"status": "cancelled"}}
    )
    return {"message": "Suscripción cancelada"}

@api_router.put("/subscriptions/update-iban")
async def update_subscription_iban(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    new_iban = body.get("iban")
    if not new_iban:
        raise HTTPException(status_code=400, detail="IBAN requerido")
    company = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    await db.subscriptions.update_one(
        {"company_id": company["company_id"]},
        {"$set": {"iban": new_iban}}
    )
    await db.companies.update_one(
        {"company_id": company["company_id"]},
        {"$set": {"iban": new_iban}}
    )
    return {"message": "IBAN actualizado"}

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

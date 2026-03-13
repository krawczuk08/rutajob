import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserAndToken: (user: User, token: string) => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  setUserAndToken: async () => {},
  updateUserRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Verify token is still valid
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
          } else {
            await clearAuth();
          }
        } catch {
          // Network error, keep stored data
        }
      }
    } catch (e) {
      console.error('Error loading auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al iniciar sesión');
    }
    const data = await res.json();
    const userData: User = {
      user_id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    setUser(userData);
    setToken(data.token);
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al registrarse');
    }
    const data = await res.json();
    const userData: User = {
      user_id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    setUser(userData);
    setToken(data.token);
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch {}
    await clearAuth();
  };

  const setUserAndToken = async (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const updateUserRole = async (role: string) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, setUserAndToken, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

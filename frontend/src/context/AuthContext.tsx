import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (payload: { email: string; password: string; display_name: string; role: 'teacher' | 'student'; timezone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      if (res.access_token) {
        localStorage.setItem('teachmate_token', res.access_token);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('teachmate_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    setUser(res.user);
    if (res.access_token) {
      localStorage.setItem('teachmate_token', res.access_token);
    }
    return res.user;
  };

  const register = async (payload: { email: string; password: string; display_name: string; role: 'teacher' | 'student'; timezone?: string }) => {
    const res = await authApi.register(payload);
    setUser(res.user);
    if (res.access_token) {
      localStorage.setItem('teachmate_token', res.access_token);
    }
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('teachmate_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

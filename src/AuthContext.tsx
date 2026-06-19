import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface EchoTag {
  tag_name: string;
  intent_score: number;
}

interface User {
  user_id: string;
  username: string;
  privacy_level: string;
  profile_photo_url?: string;
  top_echoes?: EchoTag[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticate user on mount, or recover session silently using the refresh token
  const checkAuth = async () => {
    try {
      // 1. Attempt to call profile endpoint using active access cookie
      const res = await api.get('/users/me');
      setUser({
        user_id: res.data.user_id,
        username: res.data.username,
        privacy_level: res.data.privacy_level,
        profile_photo_url: res.data.profile_photo_url,
        top_echoes: res.data.top_echoes
      });
    } catch (err) {
      // 2. If access token is expired, attempt to refresh session silently
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data.token) {
          localStorage.setItem('echo_token', refreshRes.data.token);
        }
        setUser(refreshRes.data.user);
      } catch (refreshErr) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Silent background token refresh loop
  useEffect(() => {
    if (!user) return;

    // Refresh every 12 minutes (since JWT expires in 15 minutes)
    const interval = setInterval(async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.token) {
          localStorage.setItem('echo_token', res.data.token);
        }
      } catch (err) {
        console.error('Silent session refresh failed. Redirecting to login.', err);
        logout();
      }
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = (token: string, newUser: User) => {
    localStorage.setItem('echo_token', token);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed', err);
    }
    localStorage.removeItem('echo_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

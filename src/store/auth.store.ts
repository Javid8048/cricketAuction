import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  quickLogin: (email: string) => Promise<void>;
}

// Ensure clean migration from old localStorage if any residue exists
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('caa_token');
    localStorage.removeItem('caa_user');
  } catch (e) {
    // ignore
  }
}

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('caa_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('caa_token');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
  isLoading: false,
  error: null,

  login: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(email, pass);
      sessionStorage.setItem('caa_token', data.token);
      sessionStorage.setItem('caa_user', JSON.stringify(data.user));
      socketService.authenticate(data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  quickLogin: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const pass = email.includes('admin') ? 'admin123' : 'team123';
      const data = await api.login(email, pass);
      sessionStorage.setItem('caa_token', data.token);
      sessionStorage.setItem('caa_user', JSON.stringify(data.user));
      socketService.authenticate(data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    sessionStorage.removeItem('caa_token');
    sessionStorage.removeItem('caa_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('caa_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }
    try {
      const data = await api.getCurrentUser();
      sessionStorage.setItem('caa_user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, token });
    } catch (err) {
      sessionStorage.removeItem('caa_token');
      sessionStorage.removeItem('caa_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

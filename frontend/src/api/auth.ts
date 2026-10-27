import { apiRequest } from './client';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'teacher' | 'student';
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  register: (payload: { email: string; password: string; display_name: string; role: 'teacher' | 'student'; timezone?: string }) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiRequest<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    apiRequest<AuthResponse>('/auth/me', {
      method: 'GET',
    }),
};

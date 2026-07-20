import { create } from 'zustand';

const storedUser = (() => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.role ? parsed : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: storedUser,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

import { create } from 'zustand';

const storedUser = (() => {
  try {
    const item = localStorage.getItem('adminUser');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create((set) => ({
  user: storedUser,
  isAuthenticated: !!storedUser,
  isLoading: false,
  setAuth: (user) => {
    if (user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));

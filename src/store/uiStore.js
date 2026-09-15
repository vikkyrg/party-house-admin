import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isSidebarCollapsed: false,
  isMobileDrawerOpen: false,
  theme: 'light', // or 'dark'
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setMobileDrawerOpen: (isOpen) => set({ isMobileDrawerOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
}));

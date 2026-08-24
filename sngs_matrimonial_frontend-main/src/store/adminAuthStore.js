import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import adminClient from '@/lib/api/adminClient';

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isLoading: true,
      error: null,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await adminClient.post('/api/admin-auth/login', { email, password });
          const { token, admin } = response.data;

          localStorage.setItem('adminAuthToken', token);
          set({ admin, token, isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Initialize auth from localStorage
      initializeAuth: async () => {
        try {
          const storedToken = localStorage.getItem('adminAuthToken');
          if (storedToken) {
            set({ token: storedToken });
            try {
              const response = await adminClient.get('/api/admin-auth/me', {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              set({ admin: response.data.admin, isLoading: false });
            } catch (error) {
              localStorage.removeItem('adminAuthToken');
              set({ token: null, admin: null, isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('adminAuthToken');
        set({ admin: null, token: null });
      },

      // Get current admin
      getCurrentAdmin: async () => {
        try {
          const token = get().token || localStorage.getItem('adminAuthToken');
          const response = await adminClient.get('/api/admin-auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({ admin: response.data.admin });
          return response.data.admin;
        } catch (error) {
          set({ admin: null, token: null });
          return null;
        }
      },
    }),
    {
      name: 'admin-auth-store',
    }
  )
);

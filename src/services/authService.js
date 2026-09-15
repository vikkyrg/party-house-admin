import apiClient from '../lib/apiClient';

export const authService = {
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },
  
  logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },
  
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  }
};

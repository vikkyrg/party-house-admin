import apiClient from '../lib/apiClient';

export const authService = {
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    if (data?.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    if (data?.data?.refreshToken) {
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    if (data?.data?.user) {
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
    }
    return data;
  },
  
  logout: async () => {
    try {
      const { data } = await apiClient.post('/auth/logout');
      return data;
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminUser');
    }
  },
  
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  }
};

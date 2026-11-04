import apiClient from '../lib/apiClient';

export const settingService = {
  getSettings: async () => {
    const { data } = await apiClient.get('/settings');
    return data;
  },

  updateAdvancePayment: async (advancePaymentAmount) => {
    const { data } = await apiClient.put('/settings/advance-payment', { advancePaymentAmount });
    return data;
  },
};


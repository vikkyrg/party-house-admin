import apiClient from '../lib/apiClient';

export const eventTypeService = {
  getAll: async () => {
    const { data } = await apiClient.get(`/admin/event-types`);
    return data;
  },
};

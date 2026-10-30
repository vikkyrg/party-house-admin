import apiClient from '../lib/apiClient';

export const addonService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/addons?${params.toString()}`);
    return data;
  },

  reorder: async (ids) => {
    const { data } = await apiClient.put('/addons/reorder', { addOnIds: ids, orderedIds: ids });
    return data;
  },
};

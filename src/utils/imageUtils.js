export const getImageUrl = (img) => {
  if (!img) return null;
  const url = typeof img === 'string' ? img : (img.url || img.data);
  if (!url) return null;
  if (url.startsWith('/api/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const host = baseUrl.replace('/api/v1', '');
    return `${host}${url}`;
  }
  return url;
};

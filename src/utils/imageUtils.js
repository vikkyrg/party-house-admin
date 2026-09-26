export const DEFAULT_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23f1f5f9'><rect width='400' height='300' fill='%23f8fafc'/><path d='M160 110a20 20 0 100-40 20 20 0 000 40zM90 230l50-60 40 40 60-80 70 100H90z' fill='%23cbd5e1'/></svg>";

export const handleImageError = (e) => {
  if (e?.currentTarget) {
    e.currentTarget.src = DEFAULT_PLACEHOLDER;
    e.currentTarget.onerror = null;
  }
};

export const getImageUrl = (img) => {
  if (!img) return null;
  const url = typeof img === 'string' ? img : (img.url || img.data);
  if (!url) return null;

  if (url.startsWith('data:image')) {
    return url;
  }

  if (url.length > 100 && !url.startsWith('http') && !url.startsWith('/')) {
    const mimeType = url.startsWith('iVBORw0KGgo') ? 'image/png' : 
                     url.startsWith('/9j/') ? 'image/jpeg' : 
                     url.startsWith('R0lGOD') ? 'image/gif' : 
                     url.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
    return `data:${mimeType};base64,${url}`;
  }

  if (url.startsWith('/api/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const host = baseUrl.replace('/api/v1', '');
    return `${host}${url}`;
  }
  return url;
};


export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  dashboard: {
    stats: ['dashboard', 'stats'],
    charts: (filters) => ['dashboard', 'charts', filters],
    recent: ['dashboard', 'recent'],
  },
  bookings: {
    all: (filters) => ['bookings', filters],
    detail: (id) => ['bookings', id],
  },
  theaters: {
    all: (filters) => ['theaters', filters],
    detail: (id) => ['theaters', id],
  },
  cities: {
    all: (filters) => ['cities', filters],
    detail: (id) => ['cities', id],
  },
  locations: {
    all: (filters) => ['locations', filters],
    detail: (id) => ['locations', id],
  },
  eventTypes: {
    all: (filters) => ['eventTypes', filters],
    detail: (id) => ['eventTypes', id],
  },
  addOns: {
    all: (filters) => ['addOns', filters],
    detail: (id) => ['addOns', id],
  },
  cakes: {
    all: (filters) => ['cakes', filters],
    detail: (id) => ['cakes', id],
  },
  banners: {
    all: (filters) => ['banners', filters],
    detail: (id) => ['banners', id],
  },
  testimonials: {
    all: (filters) => ['testimonials', filters],
    detail: (id) => ['testimonials', id],
  },
  faqs: {
    all: (filters) => ['faqs', filters],
    detail: (id) => ['faqs', id],
  },
  reviews: {
    all: (filters) => ['reviews', filters],
    detail: (id) => ['reviews', id],
  },
  users: {
    all: (filters) => ['users', filters],
    detail: (id) => ['users', id],
  },
  auditLogs: {
    all: (filters) => ['auditLogs', filters],
  },
  reports: {
    revenue: (filters) => ['reports', 'revenue', filters],
  },
  services: {
    all: (filters) => ['services', filters],
    detail: (id) => ['services', id],
  },
  stories: {
    all: (filters) => ['stories', filters],
    detail: (id) => ['stories', id],
  },
  gallery: {
    all: (filters) => ['gallery', filters],
    detail: (id) => ['gallery', id],
  },
};

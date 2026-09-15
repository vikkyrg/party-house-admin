export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

const permissions = {
  [ROLES.SUPER_ADMIN]: [
    'view:dashboard',
    'manage:bookings',
    'manage:theaters',
    'manage:cities',
    'manage:locations',
    'manage:eventTypes',
    'manage:addOns',
    'manage:banners',
    'manage:testimonials',
    'manage:faqs',
    'manage:reviews',
    'manage:users',
    'view:reports',
    'view:auditLogs',
    'manage:settings',
  ],
  [ROLES.ADMIN]: [
    'view:dashboard',
    'manage:bookings',
    'manage:theaters',
    'manage:cities',
    'manage:locations',
    'manage:eventTypes',
    'manage:addOns',
    'manage:banners',
    'manage:testimonials',
    'manage:faqs',
    'manage:reviews',
    'view:reports',
    // Admins cannot manage users or settings, and cannot view audit logs
  ],
  [ROLES.CUSTOMER]: [],
};

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permissions[userRole]) return false;
  return permissions[userRole].includes(permission);
};

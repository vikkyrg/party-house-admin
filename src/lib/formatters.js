import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(typeof dateString === 'string' ? parseISO(dateString) : dateString, 'MMM d, yyyy');
  } catch (error) {
    return '-';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(
      typeof dateString === 'string' ? parseISO(dateString) : dateString,
      'MMM d, yyyy, h:mm a'
    );
  } catch (error) {
    return '-';
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  try {
    return formatDistanceToNow(
      typeof dateString === 'string' ? parseISO(dateString) : dateString,
      { addSuffix: true }
    );
  } catch (error) {
    return '-';
  }
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  // Mask all but last 4 digits if needed, or format nicely
  return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

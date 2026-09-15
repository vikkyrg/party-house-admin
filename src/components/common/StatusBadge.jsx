import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  // Booking Status
  pending: { label: 'Pending', colors: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', colors: 'bg-blue-100 text-blue-800' },
  'in-progress': { label: 'In Progress', colors: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', colors: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', colors: 'bg-red-100 text-red-800' },
  'no-show': { label: 'No Show', colors: 'bg-slate-100 text-slate-800' },
  
  // Payment Status
  paid: { label: 'Paid', colors: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Failed', colors: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', colors: 'bg-slate-100 text-slate-800' },
  partial: { label: 'Partial', colors: 'bg-amber-100 text-amber-800' },

  // General Boolean Status
  active: { label: 'Active', colors: 'bg-emerald-100 text-emerald-800' },
  inactive: { label: 'Inactive', colors: 'bg-slate-100 text-slate-800' },
  approved: { label: 'Approved', colors: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', colors: 'bg-red-100 text-red-800' },
  blocked: { label: 'Blocked', colors: 'bg-red-100 text-red-800' },
  active_user: { label: 'Active', colors: 'bg-emerald-100 text-emerald-800' },
};

export default function StatusBadge({ status, type = 'default', className }) {
  if (type === 'boolean') {
    status = status ? 'active' : 'inactive';
  } else if (type === 'approved') {
    status = status ? 'approved' : 'pending';
  } else if (type === 'blocked') {
    status = status ? 'blocked' : 'active_user';
  }

  const config = statusConfig[status?.toLowerCase()] || { 
    label: status || 'Unknown', 
    colors: 'bg-slate-100 text-slate-800' 
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.colors,
        className
      )}
    >
      {config.label}
    </span>
  );
}

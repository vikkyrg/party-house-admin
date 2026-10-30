import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  XCircle,
  CheckCircle2,
  DollarSign,
  Download,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Building,
  RotateCcw,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import PageHeader from '../components/layout/PageHeader';
import BookingNotificationBanner from '../components/booking/BookingNotificationBanner';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { bookingService } from '../services/bookingService';
import { dashboardService } from '../services/dashboardService';
import { useTheaters } from '../hooks/useTheaters';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { useBookingNotifications } from '../hooks/useBookingNotifications';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useBookingNotifications();

  // WhatsApp-style: Automatically clear unread badge count when admin navigates to /admin/bookings
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [theaterFilter, setTheaterFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Confirmation dialogs
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  // Fetch Dashboard Stats for the top cards
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: dashboardService.getStats,
  });

  const stats = statsData?.data || {};

  // Fetch Theaters for filter dropdown
  const { data: theatersData } = useTheaters({ limit: 100 });
  const theaters = theatersData?.data?.theaters || [];

  // Fetch Paginated Bookings
  const {
    data: bookingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'adminBookings',
      page,
      debouncedSearch,
      statusFilter,
      paymentStatusFilter,
      theaterFilter,
      dateFrom,
      dateTo,
      sortBy,
      order,
    ],
    queryFn: () =>
      bookingService.getAll({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        theater: theaterFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        order,
      }),
    keepPreviousData: true,
  });

  const bookings = bookingsData?.data?.bookings || [];
  const pagination = bookingsData?.data?.pagination || { currentPage: 1, totalPages: 1, total: 0 };

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.updateStatus(id, data),
    onSuccess: (_, variables) => {
      toast.success(
        variables.data.status === 'confirmed'
          ? 'Booking confirmed successfully!'
          : variables.data.status === 'completed'
          ? 'Booking marked as completed!'
          : 'Booking status updated successfully!'
      );
      queryClient.invalidateQueries(['adminBookings']);
      queryClient.invalidateQueries(['adminDashboardStats']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update booking status.');
    },
  });

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing CSV export...', { id: 'exportToast' });
      const blob = await bookingService.exportBookings({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        theater: theaterFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Bookings exported successfully!', { id: 'exportToast' });
    } catch (err) {
      toast.error('Failed to export bookings.', { id: 'exportToast' });
    }
  };

  // Quick Action Handlers
  const handleConfirmBooking = (booking) => {
    // If not paid, provide an action to mark advance payment as verified and confirm
    if (booking.payment?.status !== 'paid') {
      setConfirmModal({
        isOpen: true,
        title: 'Verify Advance & Confirm Booking',
        message: `Booking ${booking.bookingId} currently has payment status '${booking.payment?.status || 'pending'}'. Do you verify that advance payment of ₹${booking.pricing?.advanceAmount || 750} was received (via UPI / Cash / Online) and confirm this reservation?`,
        action: () =>
          updateStatusMutation.mutate({
            id: booking._id,
            data: { status: 'confirmed', paymentStatus: 'paid' },
          }),
        isDestructive: false,
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Confirm Booking',
        message: `Confirm booking ${booking.bookingId} for ${booking.customerDetails?.name}?`,
        action: () =>
          updateStatusMutation.mutate({
            id: booking._id,
            data: { status: 'confirmed' },
          }),
        isDestructive: false,
      });
    }
  };

  const handleCompleteBooking = (booking) => {
    setConfirmModal({
      isOpen: true,
      title: 'Mark Booking as Completed',
      message: `Mark booking ${booking.bookingId} as completed? Ensure the customer has finished their event and the remaining balance has been collected at the venue.`,
      action: () =>
        updateStatusMutation.mutate({
          id: booking._id,
          data: { status: 'completed' },
        }),
      isDestructive: false,
    });
  };

  const handleCancelBooking = (booking) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel booking ${booking.bookingId}? This slot will be released and marked as cancelled.`,
      action: () =>
        updateStatusMutation.mutate({
          id: booking._id,
          data: { status: 'cancelled', notes: 'Cancelled by admin from bookings page' },
        }),
      isDestructive: true,
    });
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      toast.loading('Generating invoice...', { id: 'invoiceToast' });
      const blob = await bookingService.downloadInvoice(bookingId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookingId}-invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!', { id: 'invoiceToast' });
    } catch (err) {
      toast.error('Failed to download invoice.', { id: 'invoiceToast' });
    }
  };

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        header: 'Booking Ref',
        key: 'bookingId',
        render: (row) => {
          const isPendingHold = ['pending', 'pending_payment'].includes(row.status) && ['pending', 'failed'].includes(row.payment?.status);
          const holdExpiry = row.holdExpiresAt || row.expiresAt;
          const remainingMinutes = holdExpiry ? Math.max(0, Math.ceil((new Date(holdExpiry).getTime() - Date.now()) / (60 * 1000))) : null;

          return (
            <div>
              <Link
                to={`/admin/bookings/${row._id}`}
                className="font-mono font-bold text-primary-700 hover:text-primary-900 underline text-xs"
              >
                {row.bookingId}
              </Link>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(row.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })} · {new Date(row.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {row.bulkBookingId && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800" title={`Bulk Group: ${row.bulkBookingId}`}>
                    Bulk: {row.bulkBookingId.split('-').pop()}
                  </span>
                </div>
              )}
              {isPendingHold && (
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    remainingMinutes > 0 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    {remainingMinutes > 0 ? `${remainingMinutes}m hold left` : 'Hold expired'}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: 'Customer',
        key: 'customer',
        render: (row) => (
          <div className="min-w-[130px]">
            <p className="font-semibold text-slate-800 text-xs truncate">
              {row.customerDetails?.name || row.user?.name || 'Guest'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {row.customerDetails?.phone || row.user?.phone || '—'}
            </p>
          </div>
        ),
      },
      {
        header: 'Theater & Room',
        key: 'theater',
        render: (row) => (
          <div className="min-w-[140px]">
            <p className="font-semibold text-slate-800 text-xs truncate">
              {row.theaterName || row.theater?.name || '—'}
            </p>
            <p className="text-[11px] text-amber-800 font-medium truncate">
              {row.roomName || row.room?.name || 'Room'}
            </p>
          </div>
        ),
      },
      {
        header: 'Booking Date & Slot',
        key: 'dateSlot',
        render: (row) => (
          <div className="min-w-[140px]">
            <p className="font-medium text-slate-800 text-xs">
              {new Date(row.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold truncate">{row.timeSlot}</p>
          </div>
        ),
      },
      {
        header: 'Occasion',
        key: 'occasion',
        render: (row) => (
          <span className="text-xs text-slate-700 font-medium">
            {row.eventTypeName || row.eventType?.name || 'Celebration'}
          </span>
        ),
      },
      {
        header: 'Financials',
        key: 'financials',
        render: (row) => {
          const total = row.pricing?.total || 0;
          const advance =
            row.payment?.status === 'paid'
              ? row.payment.amountPaid || row.pricing?.advanceAmount || 750
              : 0;
          const balance = total > advance ? total - advance : 0;
          return (
            <div className="text-xs min-w-[110px]">
              <p className="font-bold text-slate-900">Total: ₹{total}</p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                Adv: ₹{advance}
              </p>
              <p className="text-[11px] text-amber-800">
                Bal: ₹{balance}
              </p>
            </div>
          );
        },
      },
      {
        header: 'Payment Status',
        key: 'paymentStatus',
        width: 'w-[140px]',
        render: (row) => (
          <div className="flex items-center">
            <StatusBadge status={row.payment?.status || 'pending'} />
          </div>
        ),
      },
      {
        header: 'Booking Status',
        key: 'status',
        width: 'w-[150px]',
        render: (row) => (
          <div className="flex items-center">
            <StatusBadge status={row.status || 'pending'} />
          </div>
        ),
      },
      {
        header: 'Actions',
        key: 'actions',
        width: 'w-[170px]',
        render: (row) => (
          <div className="flex items-center gap-1.5 justify-end flex-nowrap shrink-0">
            <Link
              to={`/admin/bookings/${row._id}`}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-slate-100 transition shrink-0"
              title="View full booking details"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => handleDownloadInvoice(row.bookingId || row._id)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition shrink-0"
              title="Download Invoice PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {['pending', 'pending_payment', 'pending_verification'].includes(row.status) && (
              <button
                type="button"
                onClick={() => handleConfirmBooking(row)}
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition shrink-0"
                title="Verify Advance & Confirm"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            {row.status === 'confirmed' && (
              <button
                type="button"
                onClick={() => handleCompleteBooking(row)}
                className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition shrink-0"
                title="Mark Completed"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}

            {['pending', 'pending_payment', 'pending_verification', 'confirmed'].includes(row.status) && (
              <button
                type="button"
                onClick={() => handleCancelBooking(row)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition shrink-0"
                title="Cancel Booking"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Booking Notification Banner */}
      <BookingNotificationBanner />

      {/* Page Header */}
      <PageHeader
        title="Booking Management"
        description="Monitor reservations, verify advance payments, manage schedules, and process invoices."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </PageHeader>

      {/* A. Statistics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-slate-900">{stats.totalBookings || 0}</p>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">All reservations</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-100 text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-blue-900">{stats.confirmedBookings || 0}</p>
          <span className="text-[10px] sm:text-[11px] text-blue-600 font-medium line-clamp-1">Active reservations</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-amber-900">{stats.pendingBookings || 0}</p>
          <span className="text-[10px] sm:text-[11px] text-amber-600 font-medium line-clamp-1">Awaiting advance</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-emerald-900">{stats.completedBookings || 0}</p>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium line-clamp-1">Finished</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-50 text-red-700">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-red-900">{stats.cancelledBookings || 0}</p>
          <span className="text-[10px] sm:text-[11px] text-red-600 font-medium line-clamp-1">Cancelled/Expired</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 sm:p-4 shadow-sm border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">Verified Advance</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-600 text-white">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-emerald-900">
            {formatCurrency(stats.totalVerifiedAdvance || 0)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium line-clamp-1">Verified UPI / Gateway</span>
        </div>
      </div>

      {/* B. Search & Filter Bar */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, name, phone, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Booking Status Filter */}
            <div className="w-full">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-primary-500"
              >
                <option value="">All Booking Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="pending_verification">Awaiting Verification</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="w-full">
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-primary-500"
              >
                <option value="">All Payment Statuses</option>
                <option value="paid">Paid (Verified)</option>
                <option value="submitted">Submitted (UPI Ref)</option>
                <option value="pending">Pending Payment</option>
                <option value="failed">Failed / Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Theater Filter */}
            <div className="w-full">
              <select
                value={theaterFilter}
                onChange={(e) => {
                  setTheaterFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-primary-500"
              >
                <option value="">All Theaters</option>
                {theaters.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filters & Clear Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px] sm:text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Date:
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-xs w-[130px]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-xs w-[130px]"
            />
          </div>

          {(searchTerm || statusFilter || paymentStatusFilter || theaterFilter || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentStatusFilter('');
                setTheaterFilter('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* C. Responsive Mobile Cards View (Visible on Small Screens) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-bold text-slate-800">No bookings found</p>
            <p className="text-xs text-slate-500 mt-1">There are currently no customer bookings matching your criteria.</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const total = booking.pricing?.total || 0;
            const advance =
              booking.payment?.status === 'paid'
                ? booking.payment.amountPaid || booking.pricing?.advanceAmount || 750
                : 0;
            const balance = total > advance ? total - advance : 0;

            return (
              <div
                key={booking._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <Link
                      to={`/admin/bookings/${booking._id}`}
                      className="font-mono font-bold text-primary-700 hover:text-primary-900 underline text-sm"
                    >
                      #{booking.bookingId || booking._id}
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={booking.status || 'pending'} />
                    <StatusBadge status={booking.payment?.status || 'pending'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Customer</span>
                    <p className="font-semibold text-slate-900 text-xs truncate">
                      {booking.customerDetails?.name || booking.user?.name || 'Guest'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {booking.customerDetails?.phone || booking.user?.phone || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Theater & Room</span>
                    <p className="font-semibold text-slate-900 text-xs truncate">
                      {booking.theaterName || booking.theater?.name || '—'}
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium truncate">
                      {booking.roomName || booking.room?.name || 'Room'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Event Date & Slot</span>
                    <p className="font-bold text-slate-800 text-[11px]">
                      {new Date(booking.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium truncate">{booking.timeSlot}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Financials</span>
                    <p className="font-bold text-slate-900 text-[11px]">Total: ₹{total}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">Adv: ₹{advance} • Bal: ₹{balance}</p>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Link
                    to={`/admin/bookings/${booking._id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> Details
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(booking.bookingId || booking._id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 font-medium text-xs bg-emerald-50 hover:bg-emerald-100"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" /> Invoice
                  </button>

                  {['pending', 'pending_payment', 'pending_verification'].includes(booking.status) && (
                    <button
                      type="button"
                      onClick={() => handleConfirmBooking(booking)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}

                  {['pending', 'pending_payment', 'pending_verification', 'confirmed'].includes(booking.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                      title="Cancel Booking"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* D. Desktop Bookings Table (Hidden on Mobile, Visible on md+) */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={bookings}
          isLoading={isLoading}
          error={isError ? error : null}
          onRetry={refetch}
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          emptyStateProps={{
            title: 'No bookings found',
            description:
              searchTerm || statusFilter || paymentStatusFilter || theaterFilter || dateFrom
                ? 'No bookings matched your active filters. Try clearing some criteria.'
                : 'There are currently no customer bookings recorded in the system.',
          }}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (confirmModal.action) confirmModal.action();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}

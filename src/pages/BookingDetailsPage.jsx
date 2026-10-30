import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  DollarSign,
  Cake,
  Gift,
  Phone,
  Mail,
  User,
  ShieldCheck,
  RefreshCw,
  Send,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useEffect } from 'react';
import { useBookingNotifications } from '../hooks/useBookingNotifications';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [markPaymentPaid, setMarkPaymentPaid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Booking Details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-booking-detail', id],
    queryFn: () => bookingService.getById(id),
  });

  const booking = data?.data;
  const { markAsReadByBookingId } = useBookingNotifications();

  // Mark notification for this booking as read when opened
  useEffect(() => {
    if (booking?.bookingId || id) {
      markAsReadByBookingId(booking?.bookingId || id);
    }
  }, [booking?.bookingId, id, markAsReadByBookingId]);

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (payload) =>
      bookingService.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-booking-detail', id]);
      queryClient.invalidateQueries(['admin-bookings']);
      setConfirmModalOpen(false);
      setRejectModalOpen(false);
      setCancelModalOpen(false);
      setCompleteModalOpen(false);
      setActionReason('');
      setRejectionReason('');
      setSuccessMsg('Booking status updated successfully');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update status');
      setTimeout(() => setErrorMsg(''), 5000);
    },
  });

  const handleDownloadInvoice = async () => {
    try {
      const blob = await bookingService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${booking?.bookingId || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice. ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending':
      case 'pending_payment':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'pending_verification':
        return 'bg-cyan-50 text-cyan-800 border border-cyan-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'submitted':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'processing':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'failed':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'refunded':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The requested booking could not be loaded or does not exist.
        </p>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const customer = booking.customerDetails || {};
  const pricing = booking.pricing || {};
  const payment = booking.payment || {};
  const verifiedPaid = payment.amountPaid > 0 ? payment.amountPaid : (payment.status === 'paid' ? (pricing.advanceAmount || 750) : 0);
  const remainingDue = Math.max(0, (pricing.total || 0) - verifiedPaid);

  const isPendingStatus = ['pending', 'pending_payment', 'pending_verification'].includes(booking.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Feedback alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/bookings')}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Back to bookings"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 font-serif">
                Booking #{booking.bookingId || booking._id}
              </h1>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(booking.status)}`}>
                {booking.status}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentStatusBadge(payment.status)}`}>
                Payment: {payment.status || 'pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created on {new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
            title="Refresh details"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="px-3.5 py-2 border border-amber-300 text-amber-900 bg-amber-50 rounded-lg text-sm font-medium hover:bg-amber-100 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-amber-700" /> Invoice PDF
          </button>

          {isPendingStatus && (
            <>
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Verify & Confirm
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-3.5 py-2 border border-rose-300 text-rose-700 bg-rose-50 rounded-lg text-sm font-medium hover:bg-rose-100 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Payment
              </button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <button
              onClick={() => setCompleteModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Mark Completed
            </button>
          )}

          {[...['pending', 'pending_payment', 'pending_verification', 'confirmed']].includes(booking.status) && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-slate-50 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" /> {errorMsg}
        </div>
      )}

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" /> Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-800">{customer.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Phone Number</span>
                <a href={`tel:${customer.phone}`} className="font-semibold text-amber-700 hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone || 'N/A'}
                </a>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Email Address</span>
                <a href={`mailto:${customer.email}`} className="font-semibold text-amber-700 hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {customer.email || 'N/A'}
                </a>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Party Size</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-500" />
                  {customer.numberOfPeople || customer.members || 2} Members ({customer.numberOfKids || customer.kids || 0} Kids)
                </span>
              </div>
              {customer.specialRequests && (
                <div className="sm:col-span-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Customer Special Requests:</span>
                  <p className="text-slate-700 italic text-xs">{customer.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Theater & Room Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" /> Theater & Room Snapshot
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Theater</span>
                <span className="font-semibold text-slate-800">
                  {booking.theaterName || booking.theater?.name || 'Rio Party House'}
                </span>
                <span className="text-xs text-slate-500 block">
                  {booking.cityName || booking.city?.name || 'Bangalore'}
                  {booking.locationName ? ` • ${booking.locationName}` : ''}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Screen / Room</span>
                <span className="font-semibold text-slate-800">
                  {booking.roomName || booking.room?.name || 'VIP Room'}
                </span>
                {booking.room?.maximumMembers && (
                  <span className="text-xs text-slate-500 block">Max capacity: {booking.room.maximumMembers} persons</span>
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Booking Date</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  {new Date(booking.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Time Slot & Duration</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {booking.slot?.startTime || booking.startTime || booking.timeSlot}
                  <span className="text-xs text-slate-500">({booking.duration || 3} hrs)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Celebration Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" /> Celebration & Add-Ons
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-medium text-slate-900 block">Occasion</span>
                    <span className="text-xs text-slate-500">
                      {booking.eventTypeName || booking.eventType?.name || 'Celebration'}
                    </span>
                  </div>
                </div>
              </div>

              {booking.cake && booking.cake.name && (
                <div className="border border-slate-100 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-800 block">Cake: {booking.cake.name}</span>
                    <span className="text-xs text-slate-500">
                      Size: {booking.cake.size || booking.cake.sizeLabel || '500g'} {booking.cake.flavor ? `• Flavor: ${booking.cake.flavor}` : ''}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">₹{booking.cake.price || 0}</span>
                </div>
              )}

              {booking.addOns && booking.addOns.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-2">Selected Add-ons:</span>
                  <div className="space-y-2">
                    {booking.addOns.map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                        <span className="text-slate-700 font-medium">
                          {addon.name || addon.addOn?.name || 'Custom Addon'} {addon.quantity > 1 ? `x ${addon.quantity}` : ''}
                        </span>
                        <span className="font-semibold text-slate-800">₹{addon.price * (addon.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financials, Payment Verification & Timeline */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" /> Financial Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Room Charges</span>
                <span>₹{pricing.roomPrice || pricing.theaterPrice || 0}</span>
              </div>
              {pricing.cakePrice > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Cake</span>
                  <span>₹{pricing.cakePrice}</span>
                </div>
              )}
              {pricing.addOnsPrice > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Add-ons Total</span>
                  <span>₹{pricing.addOnsPrice}</span>
                </div>
              )}
              {pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{pricing.discount}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Booking Value</span>
                <span>₹{pricing.total || 0}</span>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-amber-900">
                  <span>Required Advance:</span>
                  <span>₹{pricing.advanceAmount || 750}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Advance Received:</span>
                  <span>₹{verifiedPaid}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-amber-200">
                  <span>Balance Due at Venue:</span>
                  <span className="text-amber-800">₹{remainingDue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" /> Payment Verification
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status</span>
                <span className={`px-2 py-0.5 rounded font-semibold capitalize ${getPaymentStatusBadge(payment.status)}`}>
                  {payment.status || 'pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-800 uppercase">{payment.provider || payment.method || 'UPI QR'}</span>
              </div>

              {/* UPI Transaction ID */}
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-1">
                <span className="text-slate-500 block text-[11px]">Customer UPI Reference / UTR:</span>
                <span className="font-mono text-sm font-bold text-[#8c5211] select-all block">
                  {payment.upiTransactionId || 'Not submitted yet'}
                </span>
                {payment.submittedAt && (
                  <span className="text-[10px] text-slate-400 block">
                    Submitted: {new Date(payment.submittedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
              </div>

              {payment.verifiedBy && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified By</span>
                  <span className="font-medium text-slate-800">{payment.verifiedBy?.name || 'Authorized Admin'}</span>
                </div>
              )}
              {payment.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Timestamp</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(payment.verifiedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )}
              {payment.rejectedReason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800">
                  <span className="font-bold block">Rejection Reason:</span>
                  <span>{payment.rejectedReason}</span>
                </div>
              )}
              {(booking.holdExpiresAt || booking.expiresAt) &&
                ['pending', 'pending_payment'].includes(booking.status) &&
                ['pending', 'failed'].includes(payment.status) && (
                <div className={`p-2.5 rounded border mt-2 ${
                  (new Date(booking.holdExpiresAt || booking.expiresAt) < new Date())
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-semibold block text-[11px]">Temporary 10-Minute Hold:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span>Expires: {new Date(booking.holdExpiresAt || booking.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="font-bold font-mono">
                      {new Date(booking.holdExpiresAt || booking.expiresAt) > new Date()
                        ? `${Math.max(0, Math.ceil((new Date(booking.holdExpiresAt || booking.expiresAt) - new Date()) / (60 * 1000)))}m left`
                        : 'Expired'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" /> Booking Timeline
            </h2>
            <div className="relative pl-6 space-y-4 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></div>
                <p className="font-semibold text-slate-800">Booking Created</p>
                <p className="text-slate-500">{new Date(booking.createdAt).toLocaleString('en-IN')}</p>
              </div>

              {payment.submittedAt && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white"></div>
                  <p className="font-semibold text-indigo-700">UPI Reference Submitted</p>
                  <p className="text-slate-500 font-mono text-[11px]">{payment.upiTransactionId}</p>
                </div>
              )}

              {payment.status === 'paid' && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <p className="font-semibold text-emerald-700">Advance Payment Verified (₹{verifiedPaid})</p>
                  <p className="text-slate-500">{payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString('en-IN') : 'Verified'}</p>
                </div>
              )}

              {booking.status === 'confirmed' && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                  <p className="font-semibold text-blue-700">Booking Confirmed</p>
                  <p className="text-slate-500">
                    {booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleString('en-IN') : 'Confirmed'}
                  </p>
                </div>
              )}

              {booking.status === 'completed' && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white"></div>
                  <p className="font-semibold text-emerald-800">Event Completed</p>
                </div>
              )}

              {booking.status === 'cancelled' && (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white"></div>
                  <p className="font-semibold text-rose-700">Booking Cancelled</p>
                  {booking.cancellationReason && (
                    <p className="text-slate-500 italic mt-0.5">Reason: {booking.cancellationReason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Verification Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Verify Payment & Confirm Booking
            </h3>
            <p className="text-sm text-slate-600">
              Confirm booking <b>#{booking.bookingId}</b> after checking the merchant bank account for ₹{pricing.advanceAmount || 750}.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                Customer UPI Ref: <span className="font-mono text-sm font-bold text-amber-950">{payment.upiTransactionId || 'None submitted'}</span>
              </p>
              <label className="flex items-start gap-2 cursor-pointer font-medium mt-2">
                <input
                  type="checkbox"
                  checked={markPaymentPaid}
                  onChange={(e) => setMarkPaymentPaid(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <span>I have checked the merchant UPI/bank account and confirmed credit of ₹{pricing.advanceAmount || 750}.</span>
              </label>
            </div>

            <textarea
              placeholder="Optional admin notes..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-amber-500"
              rows={2}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={payment.status !== 'paid' && !markPaymentPaid}
                onClick={() =>
                  updateStatusMutation.mutate({
                    action: 'verify',
                    status: 'confirmed',
                    notes: actionReason,
                    paymentStatus: 'paid',
                  })
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                Verify & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Reject Payment Reference
            </h3>
            <p className="text-sm text-slate-600">
              Rejecting payment will cancel this reservation and release the slot. Please enter a mandatory reason (e.g. "Transaction ID not found in bank statement").
            </p>
            <textarea
              placeholder="Reason for payment rejection (mandatory)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-rose-500"
              rows={3}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={() =>
                  updateStatusMutation.mutate({
                    action: 'reject',
                    rejectionReason: rejectionReason.trim(),
                  })
                }
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" /> Mark Event Completed
            </h3>
            <p className="text-sm text-slate-600">
              Marking this booking completed indicates that the customer has used the slot and all remaining balance has been collected at the venue.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: 'completed',
                    notes: 'Marked completed by admin',
                  })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Cancel Booking
            </h3>
            <p className="text-sm text-slate-600">
              Please enter the reason for cancellation. The slot will be freed immediately.
            </p>
            <textarea
              placeholder="Reason for cancellation..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-rose-500"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: 'cancelled',
                    notes: actionReason || 'Cancelled by admin',
                  })
                }
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

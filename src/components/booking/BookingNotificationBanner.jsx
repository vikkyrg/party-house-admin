import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useBookingNotifications, useBookingNotificationsList } from '../../hooks/useBookingNotifications';

export default function BookingNotificationBanner() {
  const { unreadCount, markAsRead, markAllAsRead } = useBookingNotifications();
  const { data: listData, isLoading } = useBookingNotificationsList({ unreadOnly: true, limit: 5 });

  const notifications = listData?.data || [];

  if (unreadCount === 0 || notifications.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/90 via-amber-50/50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-red-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
            <Bell className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900">
                New Booking Notifications
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black">
                {unreadCount > 99 ? '99+' : unreadCount} Unread
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Review new reservations and status updates requiring attention.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => markAllAsRead()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition"
        >
          <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Notifications list */}
      <div className="mt-3 divide-y divide-red-100/60">
        {notifications.map((notif) => {
          const isCancellation = notif.type === 'cancelled';
          const isPayment = notif.type === 'payment_submitted';
          const isConfirmed = notif.type === 'payment_verified';

          return (
            <div
              key={notif._id}
              className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCancellation
                      ? 'bg-rose-100 text-rose-700'
                      : isPayment
                      ? 'bg-amber-100 text-amber-800'
                      : isConfirmed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isCancellation ? '✕' : isConfirmed ? '✓' : '•'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="font-mono text-[11px] font-semibold text-[#8c5211] bg-amber-50/80 px-1.5 py-0.2 rounded border border-amber-200/50">
                      {notif.bookingId}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1 mt-0.5">{notif.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to={`/admin/bookings/${notif.booking?._id || notif.bookingId}`}
                  onClick={() => markAsRead(notif._id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#a9651c] hover:bg-[#8e5217] text-white text-[11px] font-bold shadow-2xs transition"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => markAsRead(notif._id)}
                  title="Mark as read"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

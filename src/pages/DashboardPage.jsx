import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import { useDashboardStats } from '../hooks/useDashboard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { formatCurrency } from '../lib/formatters';
import { CalendarDays, Film, Map, Users, TrendingUp, Clock, CheckCircle, XCircle, LayoutGrid, Cake, ShoppingBag, Sparkles, Image as ImageIcon } from 'lucide-react';


export default function DashboardPage() {
  const { data: statsData, isLoading, isError, error, refetch } = useDashboardStats();

  if (isLoading) return <LoadingState message="Loading dashboard statistics..." />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const stats = statsData?.data || {};

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      link: '/admin/reports',
    },
    {
      name: 'Total Bookings',
      value: stats.totalBookings || 0,
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/bookings',
    },
  ];

  const contentCards = [
    {
      name: 'Total Rooms',
      value: stats.totalRooms || 0,
      icon: LayoutGrid,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/admin/rooms',
    },
    {
      name: 'Event Types',
      value: stats.totalEventTypes || 0,
      icon: Sparkles,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-100',
      link: '/admin/event-types',
    },
    {
      name: 'Add-ons',
      value: stats.totalAddOns || 0,
      icon: ShoppingBag,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      link: '/admin/add-ons',
    },
    {
      name: 'Services',
      value: stats.totalServices || 0,
      icon: Map,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      link: '/admin/services',
    },
    {
      name: 'Gallery Items',
      value: stats.totalGallery || 0,
      icon: ImageIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      link: '/admin/gallery',
    },
  ];


  const bookingStats = [
    {
      name: 'Today\'s Bookings',
      value: stats.todayBookings || 0,
      icon: CalendarDays,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      link: '/admin/bookings',
    },
    {
      name: 'Pending',
      value: stats.pendingBookings || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/bookings?status=pending',
    },
    {
      name: 'Confirmed',
      value: stats.confirmedBookings || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/admin/bookings?status=confirmed',
    },
    {
      name: 'Cancelled',
      value: stats.cancelledBookings || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/admin/bookings?status=cancelled',
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        description="Overview of your business performance"
        showBreadcrumbs={false}
      />

      <h3 className="mb-4 text-lg font-medium text-slate-900">Key Metrics</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.link} className="card flex items-center p-6 hover:shadow-md transition-shadow">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <h3 className="mb-4 text-lg font-medium text-slate-900">Content Metrics</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {contentCards.map((stat) => (
          <Link key={stat.name} to={stat.link} className="card flex items-center p-4 hover:shadow-md transition-shadow">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-slate-500">{stat.name}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <h3 className="mb-4 text-lg font-medium text-slate-900">Booking Status</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bookingStats.map((stat) => (
          <Link key={stat.name} to={stat.link} className="card flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition-shadow">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
          </Link>
        ))}
      </div>

      {/* TODO: Add charts and recent activity tables here */}
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        Charts and Recent Activity sections will be implemented next.
      </div>
    </div>
  );
}

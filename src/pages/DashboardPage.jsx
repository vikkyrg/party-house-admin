import PageHeader from '../components/layout/PageHeader';
import { useDashboardStats } from '../hooks/useDashboard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { formatCurrency } from '../lib/formatters';
import { CalendarDays, Film, Map, Users, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

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
    },
    {
      name: 'Total Bookings',
      value: stats.totalBookings || 0,
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Theaters',
      value: stats.totalTheaters || 0,
      icon: Film,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Total Customers',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  const bookingStats = [
    {
      name: 'Today\'s Bookings',
      value: stats.todayBookings || 0,
      icon: CalendarDays,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Pending',
      value: stats.pendingBookings || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      name: 'Confirmed',
      value: stats.confirmedBookings || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      name: 'Cancelled',
      value: stats.cancelledBookings || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
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
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card flex items-center p-6">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-4 text-lg font-medium text-slate-900">Booking Status</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bookingStats.map((stat) => (
          <div key={stat.name} className="card flex flex-col items-center justify-center p-6 text-center">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* TODO: Add charts and recent activity tables here */}
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        Charts and Recent Activity sections will be implemented next.
      </div>
    </div>
  );
}

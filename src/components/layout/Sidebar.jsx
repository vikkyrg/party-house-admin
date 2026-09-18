import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { hasPermission } from '../../lib/permissions';
import {
  LayoutDashboard,
  CalendarDays,
  Film,
  MapPin,
  Map,
  Tag,
  PlusCircle,
  Image as ImageIcon,
  MessageSquareQuote,
  HelpCircle,
  Star,
  Users,
  BarChart3,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'view:dashboard' },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays, permission: 'manage:bookings' },
  { name: 'Theaters', path: '/admin/theaters', icon: Film, permission: 'manage:theaters' },
  { name: 'Cities', path: '/admin/cities', icon: Map, permission: 'manage:cities' },
  { name: 'Locations', path: '/admin/locations', icon: MapPin, permission: 'manage:locations' },
  { name: 'Event Types', path: '/admin/event-types', icon: Tag, permission: 'manage:eventTypes' },
  { name: 'Add-ons', path: '/admin/addons', icon: PlusCircle, permission: 'manage:addOns' },
  { name: 'Services', path: '/admin/services', icon: Tag, permission: 'manage:services' },
  { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon, permission: 'manage:gallery' },
  { name: 'Blogs', path: '/admin/stories', icon: MessageSquareQuote, permission: 'manage:stories' },
  { name: 'Banners', path: '/admin/banners', icon: ImageIcon, permission: 'manage:banners' },
  { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote, permission: 'manage:testimonials' },
  { name: 'FAQs', path: '/admin/faqs', icon: HelpCircle, permission: 'manage:faqs' },
  { name: 'Reviews', path: '/admin/reviews', icon: Star, permission: 'manage:reviews' },
  { name: 'Users', path: '/admin/users', icon: Users, permission: 'manage:users' },
  { name: 'Reports', path: '/admin/reports', icon: BarChart3, permission: 'view:reports' },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert, permission: 'view:auditLogs' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, permission: 'manage:settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  const filteredNavItems = navItems.filter(item => 
    hasPermission(user?.role, item.permission)
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out hidden md:flex ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        {!isSidebarCollapsed && (
          <Link to="/admin" className="text-xl font-bold text-primary-600 truncate">
            CS Cinemas
          </Link>
        )}
        {isSidebarCollapsed && (
          <Link to="/admin" className="mx-auto text-xl font-bold text-primary-600">
            CS
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-lg px-3 py-2.5 transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              <Icon className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
              {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <button
          onClick={toggleSidebar}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-3" />
              <span className="truncate">Collapse Sidebar</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => logout()}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
          title={isSidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
          {!isSidebarCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { hasPermission } from '../../lib/permissions';
import {
  LayoutDashboard,
  CalendarDays,
  Film,
  MapPin,
  Tag,
  Cake,
  PlusCircle,
  Image as ImageIcon,
  MessageSquareQuote,
  Mail,
  HelpCircle,
  Users,
  ShieldAlert,
  Settings,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'view:dashboard' },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays, permission: 'manage:bookings' },
  { name: 'Theaters', path: '/admin/theaters', icon: Film, permission: 'manage:theaters' },
  { name: 'Locations', path: '/admin/locations', icon: MapPin, permission: 'manage:locations' },
  { name: 'Event Types', path: '/admin/event-types', icon: Tag, permission: 'manage:eventTypes' },
  { name: 'Cakes', path: '/admin/cakes', icon: Cake, permission: 'manage:addOns' },
  { name: 'Add-ons', path: '/admin/addons', icon: PlusCircle, permission: 'manage:addOns' },
  { name: 'Services', path: '/admin/services', icon: Tag, permission: 'manage:services' },
  { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon, permission: 'manage:gallery' },
  { name: 'Blogs', path: '/admin/stories', icon: MessageSquareQuote, permission: 'manage:stories' },
  { name: 'Banners', path: '/admin/banners', icon: ImageIcon, permission: 'manage:banners' },
  { name: 'FAQs', path: '/admin/faqs', icon: HelpCircle, permission: 'manage:faqs' },
  { name: 'Contact Messages', path: '/admin/contact-messages', icon: Mail, permission: 'manage:contactMessages' },
  { name: 'Users', path: '/admin/users', icon: Users, permission: 'manage:users' },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert, permission: 'view:auditLogs' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, permission: 'manage:settings' },
];


import { useUnreadContactCount } from '../../hooks/useUnreadContactCount';

export default function MobileSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isMobileDrawerOpen, setMobileDrawerOpen } = useUiStore();
  const { data: unreadContactCount = 0 } = useUnreadContactCount();

  const filteredNavItems = navItems.filter(item => 
    hasPermission(user?.role, item.permission)
  );

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname, setMobileDrawerOpen]);

  if (!isMobileDrawerOpen) return null;

  return (
    <div className="relative z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={() => setMobileDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-[var(--color-surface)] shadow-xl">
        <div className="flex h-[78px] items-center justify-between px-4 border-b border-[var(--color-border)]">
          <Link to="/admin" className="flex items-center gap-0 group">
            <img src="/logo.png" alt="Rio Party House" className="h-[50px] w-[60px] object-contain transition-transform duration-300 group-hover:scale-105" />
            <div className="flex -ml-1 flex-col items-center justify-center">
              <img src="/party.png" alt="Rio Party House" className="h-[46px] object-contain" />
            </div>
          </Link>
          <button 
            onClick={() => setMobileDrawerOpen(false)}
            className="rounded-lg p-2 text-text-secondary hover:bg-[var(--color-surface-secondary)]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                            (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const isContactItem = item.path === '/admin/contact-messages';
            const badgeCount = isContactItem ? unreadContactCount : 0;
            const badgeText = badgeCount > 99 ? '99+' : badgeCount;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-text-primary font-semibold shadow-sm border border-[var(--color-border-hover)]'
                    : 'text-text-secondary hover:bg-[var(--color-surface-secondary)] hover:text-text-primary'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-primary-600' : 'text-text-muted'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {badgeCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/20">
                    {badgeText}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>


        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => logout()}
            className="flex w-full items-center rounded-lg px-3 py-1.5 text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

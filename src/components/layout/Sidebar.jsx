import { Link, useLocation } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'view:dashboard' },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays, permission: 'manage:bookings' },
  { name: 'Rooms', path: '/admin/rooms', icon: Film, permission: 'manage:theaters' },
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

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const { data: unreadContactCount = 0 } = useUnreadContactCount();

  const filteredNavItems = navItems.filter(item => 
    hasPermission(user?.role, item.permission)
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-[2px_0_12px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out hidden md:flex ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-[78px] items-center justify-center px-4 border-b border-[var(--color-border)] shrink-0">
        {!isSidebarCollapsed && (
          <Link to="/admin" className="flex items-center justify-center gap-0 group">
            <img src="/logo.png" alt="Rio Party House" className="h-[60px] w-[70px] object-contain transition-transform duration-300 group-hover:scale-105" />
            <div className="flex -ml-1 w-[110px] items-center justify-center">
              <img src="/party.png" alt="Rio Party House" className="h-[52px] object-contain" />
            </div>
          </Link>
        )}
        {isSidebarCollapsed && (
          <Link to="/admin" className="mx-auto flex justify-center group">
            <img src="/logo.png" alt="Rio Party House" className="h-[44px] w-[44px] object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-hide">
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
              className={`flex items-center rounded-xl px-3 py-1.5 transition-colors relative ${
                isActive
                  ? 'bg-primary-50 text-text-primary font-semibold shadow-sm border border-[var(--color-border-hover)]'
                  : 'text-text-secondary hover:bg-[var(--color-surface-secondary)] hover:text-text-primary'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? `${item.name}${badgeCount > 0 ? ` (${badgeText} unread)` : ''}` : undefined}
            >
              <div className="relative flex items-center">
                <Icon className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-primary-600' : 'text-text-muted'}`} />
                {isSidebarCollapsed && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {badgeText}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span className="truncate">{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/20 animate-in fade-in">
                      {badgeText}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>


      {/* Footer Controls */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-1 shrink-0">
        <button
          onClick={() => logout()}
          className={`flex w-full items-center rounded-lg px-3 py-1.5 text-danger-600 hover:bg-danger-50 transition-colors ${
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

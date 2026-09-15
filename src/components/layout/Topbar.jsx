import { Menu, Bell, Search, User } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export default function Topbar() {
  const { toggleMobileDrawer } = useUiStore();
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm z-10 sticky top-0">
      <div className="flex items-center">
        <button
          onClick={toggleMobileDrawer}
          className="mr-4 rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Global Search (Optional) */}
        <div className="hidden lg:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings, users..."
            className="h-9 w-64 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="hidden text-right text-sm md:block">
            <p className="font-medium text-slate-700">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</p>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

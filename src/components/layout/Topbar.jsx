import { Menu, Bell, Search, User } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export default function Topbar() {
  const { toggleMobileDrawer } = useUiStore();
  const { user } = useAuthStore();

  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 shadow-[0_2px_14px_rgba(36,28,74,0.02)] z-10 sticky top-0">
      <div className="flex items-center">
        <button
          onClick={toggleMobileDrawer}
          className="mr-4 rounded-md p-2 text-text-secondary hover:bg-[var(--color-surface-secondary)] md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Global Search (Optional) */}
        <div className="hidden lg:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search bookings, users..."
            className="h-10 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-10 pr-4 text-sm text-text-primary focus:border-primary-600 focus:bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-primary-600 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 border-l border-[var(--color-border)] pl-4">
          <div className="hidden text-right text-sm md:block">
            <p className="font-semibold text-text-primary">{user?.name || 'Admin User'}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold mt-0.5">{user?.role || 'Admin'}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors border border-[var(--color-primary-200)]">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

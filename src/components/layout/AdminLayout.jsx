import { Outlet } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileSidebar from './MobileSidebar';

export default function AdminLayout() {
  const { isSidebarCollapsed } = useUiStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)] relative font-sans">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04] z-0 flex items-center justify-center">
        <svg viewBox="0 0 1000 1000" className="w-[150vw] min-w-[1000px] text-primary-900" fill="currentColor" preserveAspectRatio="none">
           {/* Abstract cinema/film curve representation */}
           <path d="M0,500 C300,200 700,800 1000,500 L1000,0 L0,0 Z" />
        </svg>
      </div>
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar Overlay */}
      <MobileSidebar />

      {/* Main Content Wrapper */}
      <div 
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out relative z-10 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Topbar />
        
        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

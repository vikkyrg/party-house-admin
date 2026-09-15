import { Link } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  const { logout } = useAuthStore();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <ShieldAlert className="h-12 w-12 text-red-600" />
      </div>
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Access Denied</h1>
      <p className="mb-8 max-w-md text-slate-500">
        You don't have permission to access this area. Please contact an administrator if you believe this is a mistake.
      </p>
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={logout} leftIcon={LogOut}>
          Logout
        </Button>
        <Link to="/admin">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

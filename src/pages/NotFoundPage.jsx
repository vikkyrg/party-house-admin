import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="mb-8 text-9xl font-extrabold tracking-widest text-slate-200">
        404
      </div>
      <div className="absolute rounded bg-primary-600 px-2 text-sm text-white">
        Page Not Found
      </div>
      <div className="mt-8">
        <p className="mb-8 max-w-md text-slate-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/admin">
          <Button leftIcon={Home}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

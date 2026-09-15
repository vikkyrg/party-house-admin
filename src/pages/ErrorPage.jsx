import { useRouteError, Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-12 w-12 text-red-600" />
      </div>
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Oops! Something went wrong</h1>
      <p className="mb-8 max-w-md text-slate-500">
        We're sorry, but an unexpected error has occurred. Our team has been notified.
      </p>
      
      {error && (
        <div className="mb-8 max-w-2xl rounded-lg bg-slate-800 p-4 text-left text-sm text-red-400 overflow-auto">
          <code>
            {error.statusText || error.message}
          </code>
        </div>
      )}

      <Link to="/admin">
        <Button leftIcon={Home} size="lg">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}

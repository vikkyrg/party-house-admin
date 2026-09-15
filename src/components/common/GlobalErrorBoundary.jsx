import { useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function GlobalErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="flex max-w-md flex-col items-center rounded-lg border border-red-200 bg-white p-8 text-center shadow-lg">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Oops! Something went wrong.</h2>
        <p className="mb-6 text-sm text-slate-600">
          {error?.statusText || error?.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = '/admin'}>
            Go to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}

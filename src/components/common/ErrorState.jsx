import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading this data. Please try again.',
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle className="mb-4 h-8 w-8 text-red-500" />
      <h3 className="mb-2 text-sm font-semibold text-red-800">{title}</h3>
      <p className="mb-4 text-sm text-red-600">{message}</p>
      
      {onRetry && (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onRetry}
          leftIcon={RefreshCcw}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

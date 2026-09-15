import { FileSearch } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ 
  icon: Icon = FileSearch, 
  title = 'No data found', 
  description = "We couldn't find any records matching your criteria.", 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 text-sm text-slate-500 max-w-sm">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

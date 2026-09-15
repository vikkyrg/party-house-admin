import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="w-full flex justify-center py-12">{content}</div>;
}

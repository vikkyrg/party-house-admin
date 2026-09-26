

export default function LoadingState({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-4 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="h-12 w-16 bg-slate-200/70 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-1/3 bg-slate-200/70 rounded animate-pulse" />
            <div className="h-3 w-1/4 bg-slate-200/50 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-slate-200/70 rounded-full animate-pulse hidden sm:block" />
        </div>
      ))}
      {message && (
        <p className="text-center text-sm font-medium text-slate-400 mt-6 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="w-full flex justify-center py-6">{content}</div>;
}

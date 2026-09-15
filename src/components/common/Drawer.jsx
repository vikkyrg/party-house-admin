import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from './Button';

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md', // sm, md, lg, xl, full
}) {
  const slideAnimation = side === 'right' 
    ? 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right' 
    : 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left';

  const positionClass = side === 'right' ? 'right-0' : 'left-0';
  
  const sizeClass = {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-lg',
    xl: 'w-full sm:max-w-xl lg:max-w-3xl',
    full: 'w-screen',
  }[size];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className={cn(
            "fixed top-0 z-50 flex h-full flex-col border-slate-200 bg-white shadow-xl duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
            positionClass,
            slideAnimation,
            sizeClass,
            side === 'right' ? 'border-l' : 'border-r'
          )}
        >
          {/* Header */}
          <div className="flex flex-col space-y-1 p-6 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-slate-900">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </Dialog.Close>
            </div>
            {description && (
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                {description}
              </Dialog.Description>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

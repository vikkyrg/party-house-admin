import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import Button from './Button';

export default function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  maxWidth = 'max-w-lg', // or max-w-2xl, max-w-3xl, etc.
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className={`fixed left-[50%] top-[50%] z-50 w-full ${maxWidth} max-h-[90vh] translate-x-[-50%] translate-y-[-50%] border border-slate-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-200 shrink-0">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-slate-900">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-slate-500">
                {description}
              </Dialog.Description>
            )}
            
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>

          {/* Form Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>

          {/* Footer */}
          {onSubmit && (
            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 p-4 shrink-0 bg-slate-50 rounded-b-lg">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onClose(false)}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                isLoading={isLoading}
              >
                {submitLabel}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

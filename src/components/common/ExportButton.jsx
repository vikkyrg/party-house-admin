import { Download } from 'lucide-react';
import Button from './Button';

export default function ExportButton({ onExport, isExporting = false, label = 'Export CSV' }) {
  return (
    <Button
      variant="secondary"
      onClick={onExport}
      isLoading={isExporting}
      leftIcon={Download}
      size="sm"
    >
      {label}
    </Button>
  );
}

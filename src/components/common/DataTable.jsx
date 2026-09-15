import { useState } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export default function DataTable({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  pagination,
  onPageChange,
  sortConfig,
  onSort,
  emptyStateProps = {},
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm h-64 flex items-center justify-center">
        <LoadingState message="Loading data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4">
        <ErrorState message={error.message} onRetry={onRetry} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        <EmptyState {...emptyStateProps} />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, rowIndex) => (
              <tr key={row.id || row._id || rowIndex} className="hover:bg-slate-50 transition-colors">
                {columns.map((col, colIndex) => (
                  <td
                    key={`${row.id || rowIndex}-${col.key || colIndex}`}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage || pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

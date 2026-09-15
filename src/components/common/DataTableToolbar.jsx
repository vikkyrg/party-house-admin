import SearchInput from './SearchInput';

export default function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters, // Array of React components (e.g., custom selects)
  actions, // Array of React components (e.g., Add button)
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4">
        {onSearchChange && (
          <div className="w-full sm:max-w-xs">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter, index) => (
              <div key={index}>{filter}</div>
            ))}
          </div>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      )}
    </div>
  );
}

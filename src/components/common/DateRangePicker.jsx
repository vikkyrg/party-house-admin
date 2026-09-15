import { useState } from 'react';

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {label && <label className="text-sm font-medium text-slate-700 sm:mr-2">{label}</label>}
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-9 w-full sm:w-auto rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <span className="text-slate-500">to</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          className="h-9 w-full sm:w-auto rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}

import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export function useSortable<T extends string>(
  defaultField: T,
  defaultDirection: SortDirection = 'asc',
  fieldDefaults?: Partial<Record<T, SortDirection>>
) {
  const [sortField, setSortField] = useState<T>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = (field: T) => {
    if (field === sortField) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(fieldDefaults?.[field] ?? 'asc');
    }
  };

  return { sortField, sortDirection, handleSort };
}

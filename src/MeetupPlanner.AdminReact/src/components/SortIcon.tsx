import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { SortDirection } from '../hooks/useSortable';

interface SortIconProps<T extends string> {
  field: T;
  sortField: T;
  sortDirection: SortDirection;
}

export default function SortIcon<T extends string>({ field, sortField, sortDirection }: SortIconProps<T>) {
  if (field !== sortField) return null;
  return sortDirection === 'asc'
    ? <ChevronUpIcon className="inline w-3 h-3 ml-1" />
    : <ChevronDownIcon className="inline w-3 h-3 ml-1" />;
}

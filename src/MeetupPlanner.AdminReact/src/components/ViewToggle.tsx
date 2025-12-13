import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

interface ViewToggleProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group" aria-label="Toggle view mode">
      <button
        onClick={() => onViewModeChange('list')}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-l-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 ${
          viewMode === 'list' ? 'ring-1 ring-slate-300 ' : ''
        }`}
        aria-pressed={viewMode === 'list'}
        aria-label="List view"
        title="List view"
      >
        <ListBulletIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => onViewModeChange('grid')}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-r-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50  ${
          viewMode === 'grid' ? 'ring-1 ring-slate-300 ' : ''
        }`}
        aria-pressed={viewMode === 'grid'}
        aria-label="Grid view"
        title="Grid view"
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
    </div>
  );
}

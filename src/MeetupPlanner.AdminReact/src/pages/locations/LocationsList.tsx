import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { LocationsService } from '../../services/locationsService';
import type { LocationResponse } from '../../types';
import ViewToggle from '../../components/ViewToggle';
import SortIcon from '../../components/SortIcon';
import { useSortable } from '../../hooks/useSortable';

type SortField = 'name' | 'isActive' | 'maxCapacity';
const VIEW_MODE_STORAGE_KEY = 'locations:view-mode';

export default function LocationsList() {
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined') {
      return 'grid';
    }

    const savedViewMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return savedViewMode === 'list' || savedViewMode === 'grid' ? savedViewMode : 'grid';
  });
  const { sortField, sortDirection, handleSort } = useSortable<SortField>('name');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await LocationsService.getAllLocations();
        setLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      let cmp = 0;

      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'isActive') {
        cmp = Number(a.isActive) - Number(b.isActive);
      } else if (sortField === 'maxCapacity') {
        cmp = (a.maxCapacity ?? 0) - (b.maxCapacity ?? 0);
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [locations, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Locations</h1>
        <div className="flex gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <Link
            to="/locations/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Location
          </Link>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLocations.map((location) => (
            <Link
              key={location.locationId}
              to={`/locations/${location.locationId}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{location.name}</h3>
                {!location.isActive && (
                  <span className="mb-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    Name<SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('isActive')}
                  >
                    Active<SortIcon field="isActive" sortField={sortField} sortDirection={sortDirection} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('maxCapacity')}
                  >
                    Max Capacity<SortIcon field="maxCapacity" sortField={sortField} sortDirection={sortDirection} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedLocations.map((location) => (
                  <tr key={location.locationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/locations/${location.locationId}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {location.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{location.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {location.link ? (
                        <a
                          href={location.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Visit Site
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{location.maxCapacity ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

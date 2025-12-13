import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { LocationsService } from '../../services/locationsService';
import type { LocationResponse } from '../../types';

export default function LocationsList() {
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Link
          to="/locations/add"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Location
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Link
            key={location.locationId}
            to={`/locations/${location.locationId}`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{location.name}</h3>
            <p className="text-sm text-gray-600">{location.address}</p>
            <p className="text-sm text-gray-600">
              {location.city}, {location.state} {location.zipCode}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

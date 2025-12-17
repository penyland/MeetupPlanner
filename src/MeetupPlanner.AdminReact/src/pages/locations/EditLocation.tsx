import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LocationsService } from '../../services/locationsService';
import type { LocationDetailedResponse } from '../../types';

export default function EditLocation() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationDetailedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      if (!locationId) return;
      
      try {
        const data = await LocationsService.getLocationById(locationId);
        setLocation(data);
      } catch (error) {
        console.error('Failed to fetch location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [locationId]);

  const handleDelete = async () => {
    if (!locationId || !confirm('Are you sure you want to delete this location?')) return;

    try {
      await LocationsService.deleteLocation(locationId);
      navigate('/locations');
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Location not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Location Details</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{location.name}</h2>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Description</h3>
            <p className="text-gray-900">{location.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Address</h3>
            <p className="text-gray-900">{location.street}</p>
            <p className="text-gray-900">
              {location.postalCode} {location.city}
            </p>
            <p className="text-gray-900">{location.country}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/locations')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to List
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

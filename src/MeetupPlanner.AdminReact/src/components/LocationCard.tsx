import { MapPinIcon } from '@heroicons/react/24/outline';
import { FaGlobe } from 'react-icons/fa6';
import type { LocationDetailedResponse } from '../types';

interface LocationCardProps {
  location: LocationDetailedResponse;
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <div className='bg-white rounded-lg shadow p-6 w-full'>
      <div className='grid grid-cols-2 gap-6'>
        <div className='flex flex-col justify-center items-start'>
          <div className="flex items-center gap-3 mb-2">
            <MapPinIcon className="w-10 h-10 text-blue-600 shrink-0" />
            <h1 className="text-4xl font-bold">{location.name}</h1>
            {!location.isActive && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Inactive
              </span>
            )}
          </div>
          <div className="mt-2 text-gray-900 pl-13">
            <p>{location.street}</p>
            <p>{location.postalCode} {location.city}</p>
            <p>{location.country}</p>
            {location.maxCapacity != null && (
              <p className="mt-1 text-gray-600">Capacity: {location.maxCapacity}</p>
            )}
          </div>
        </div>

        <div className='flex flex-col justify-center items-start gap-4'>
          {location.description && (
            <p className="text-gray-900">{location.description}</p>
          )}
          {location.link && (
            <a
              href={location.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
              title="Website"
              aria-label="Website"
            >
              <FaGlobe className="w-5 h-5" />
              <span className="text-sm">{location.link}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

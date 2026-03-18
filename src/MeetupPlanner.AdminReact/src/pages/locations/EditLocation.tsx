import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { LocationsService } from '../../services/locationsService';
import { MeetupsService } from '../../services/meetupsService';
import type { LocationDetailedResponse, LocationRequest, MeetupResponse } from '../../types';
import LocationCard from '../../components/LocationCard';

export default function EditLocation() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationDetailedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetups, setMeetups] = useState<MeetupResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const [formData, setFormData] = useState<LocationRequest>({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    description: '',
    link: '',
    isActive: true,
  });
  const [originalFormData, setOriginalFormData] = useState<LocationRequest | null>(null);

  const shallowEqual = (a: LocationRequest, b: LocationRequest) =>
    a.name === b.name &&
    a.street === b.street &&
    a.city === b.city &&
    a.postalCode === b.postalCode &&
    a.country === b.country &&
    a.description === b.description &&
    a.link === b.link &&
    a.maxCapacity === b.maxCapacity &&
    a.isActive === b.isActive;

  const isDirty = originalFormData ? !shallowEqual(originalFormData, formData) : false;

  useEffect(() => {
    const fetchData = async () => {
      if (!locationId) return;

      try {
        const data = await LocationsService.getLocationById(locationId);
        setLocation(data);

        const initial: LocationRequest = {
          name: data.name ?? '',
          street: data.street ?? '',
          city: data.city ?? '',
          postalCode: data.postalCode ?? '',
          country: data.country ?? '',
          description: data.description ?? '',
          link: data.link ?? '',
          maxCapacity: data.maxCapacity,
          isActive: data.isActive,
        };
        setFormData(initial);
        setOriginalFormData(initial);

        const allMeetups = await MeetupsService.getAllMeetups();
        setMeetups(allMeetups.filter(m => m.location?.locationId === locationId));
      } catch (error) {
        console.error('Failed to fetch location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  const onSubmitLocationUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await LocationsService.updateLocation(locationId!, formData);
      setOriginalFormData(formData);
      setLocation(prev => prev ? { ...prev, ...formData } as LocationDetailedResponse : prev);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 5000);
      navigate('/locations/' + locationId);
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'maxCapacity') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>Locations / Edit Location</div>
          <div className="flex gap-3">
            <Link
              to="/locations/add"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Location
            </Link>
          </div>
        </div>

        <div className='flex justify-center w-full mb-8'>
          <div className='w-full max-w-7xl flex flex-col items-center gap-6 px-4'>
            {/* First row: single full-width card */}
            <LocationCard location={location} />

            {/* Edit form */}
            <div className='bg-white rounded-lg shadow p-6 w-full'>
              <form onSubmit={onSubmitLocationUpdate} className="space-y-6">
                <div className='grid grid-cols-2 gap-8'>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={onFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Street
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={onFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={onFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={onFormChange}
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={onFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={onFormChange}
                        rows={5}
                        maxLength={2048}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Website
                      </label>
                      <input
                        type="url"
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={onFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        id="maxCapacity"
                        name="maxCapacity"
                        value={formData.maxCapacity ?? ''}
                        onChange={onFormChange}
                        min={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={onFormChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Meetup Events Section */}
            <div className='bg-white rounded-lg shadow p-6 w-full'>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Meetup Events</h2>
              </div>

              <div className="space-y-4">
                {meetups.map((meetup) => (
                  <Link
                    key={meetup.meetupId}
                    to={`/meetups/${meetup.meetupId}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-md font-semibold text-gray-900">{meetup.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(meetup.startUtc).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meetup.status === 'Published'
                            ? 'bg-green-100 text-green-800'
                            : meetup.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {meetup.status}
                      </span>
                    </div>
                  </Link>
                ))}
                {meetups.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No meetup events have been hosted at this location yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
          <span>✓ Location saved successfully</span>
          <button
            onClick={() => setShowSaveToast(false)}
            className="text-white hover:text-gray-200 font-bold text-lg"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

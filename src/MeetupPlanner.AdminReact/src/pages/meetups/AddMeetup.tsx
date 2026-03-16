import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { LocationsService } from '../../services/locationsService';
import { MeetupsService } from '../../services/meetupsService';
import { PresentationsService } from '../../services/presentationsService';
import { SpeakersService } from '../../services/speakersService';
import type {
  LocationRequest,
  LocationResponse,
  MeetupRequest,
  PresentationRequest,
  PresentationResponse,
  SpeakerRequest,
  SpeakerResponse
} from '../../types';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

interface MeetupFormState {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
  locationId: string;
  totalSpots: number;
}

function Dialog({ title, onClose, children }: DialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close dialog"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function getStockholmDateTimeValue(hours: number, minutes: number): string {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find(part => part.type === 'year')?.value ?? '';
  const month = parts.find(part => part.type === 'month')?.value ?? '';
  const day = parts.find(part => part.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function addHoursToDateTimeLocalValue(value: string, hoursToAdd: number): string {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) {
    return value;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const nextDate = new Date(year, month - 1, day, hours, minutes);
  nextDate.setHours(nextDate.getHours() + hoursToAdd);

  return formatDateTimeLocalValue(nextDate);
}

export default function AddMeetup() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerResponse[]>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState('');
  const [agendaItems, setAgendaItems] = useState<PresentationResponse[]>([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showPresentationDialog, setShowPresentationDialog] = useState(false);
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false);

  const [formData, setFormData] = useState<MeetupFormState>({
    title: '',
    description: '',
    startUtc: getStockholmDateTimeValue(17, 30),
    endUtc: getStockholmDateTimeValue(20, 30),
    locationId: '',
    totalSpots: 45
  });

  const [locationForm, setLocationForm] = useState<LocationRequest>({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Sweden',
    description: '',
    link: '',
    maxCapacity: 45,
    isActive: true
  });

  const [presentationForm, setPresentationForm] = useState<PresentationRequest>({
    title: '',
    abstract: '',
    speakerId: ''
  });

  const [speakerForm, setSpeakerForm] = useState<SpeakerRequest>({
    fullName: '',
    email: '',
    company: '',
    linkedInUrl: '',
    twitterUrl: '',
    gitHubUrl: '',
    blogUrl: '',
    thumbnailUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loadedLocations, loadedPresentations, loadedSpeakers] = await Promise.all([
          LocationsService.getAllLocations(),
          PresentationsService.getAllPresentations(),
          SpeakersService.getAllSpeakers()
        ]);

        setLocations([...loadedLocations].sort((a, b) => a.name.localeCompare(b.name)));
        setPresentations([...loadedPresentations].sort((a, b) => a.title.localeCompare(b.title)));
        setSpeakers([...loadedSpeakers].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      } catch (error) {
        console.error('Failed to load meetup form data:', error);
        setErrorMessage('Failed to load locations, presentations, or speakers.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedLocation = useMemo(
    () => locations.find(location => location.locationId === formData.locationId) ?? null,
    [formData.locationId, locations]
  );

  const availablePresentations = useMemo(
    () => presentations.filter(presentation => !agendaItems.some(item => item.presentationId === presentation.presentationId)),
    [agendaItems, presentations]
  );

  const handleMeetupChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const next: MeetupFormState = {
        ...prev,
        [name]: name === 'totalSpots' ? Number(value) : value
      };

      if (name === 'locationId') {
        const nextLocation = locations.find(location => location.locationId === value);
        if (nextLocation?.maxCapacity) {
          next.totalSpots = nextLocation.maxCapacity;
        }
      }

      return next;
    });
  };

  const handleStartUtcChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    setFormData(prev => ({
      ...prev,
      startUtc: value,
      endUtc: addHoursToDateTimeLocalValue(value, 3)
    }));
  };

  const handleStartUtcInput = (e: FormEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    setFormData(prev => ({
      ...prev,
      startUtc: value,
      endUtc: addHoursToDateTimeLocalValue(value, 3)
    }));
  };

  const handleLocationFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({
      ...prev,
      [name]: name === 'maxCapacity' ? Number(value) : value
    }));
  };

  const handlePresentationFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPresentationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSpeakerFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSpeakerForm(prev => ({ ...prev, [name]: value }));
  };

  const addExistingPresentation = () => {
    if (!selectedPresentationId) {
      return;
    }

    const presentation = presentations.find(item => item.presentationId === selectedPresentationId);
    if (!presentation) {
      return;
    }

    setAgendaItems(prev => [...prev, presentation]);
    setSelectedPresentationId('');
  };

  const moveAgendaItem = (presentationId: string, direction: -1 | 1) => {
    setAgendaItems(prev => {
      const index = prev.findIndex(item => item.presentationId === presentationId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const removeAgendaItem = (presentationId: string) => {
    setAgendaItems(prev => prev.filter(item => item.presentationId !== presentationId));
  };

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const locationId = await LocationsService.addLocation(locationForm);
      const addedLocation: LocationResponse = {
        locationId,
        name: locationForm.name,
        maxCapacity: locationForm.maxCapacity,
        isActive: locationForm.isActive
      };

      setLocations(prev => [...prev, addedLocation].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({
        ...prev,
        locationId,
        totalSpots: locationForm.maxCapacity ?? prev.totalSpots
      }));
      setLocationForm({
        name: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'Sweden',
        description: '',
        link: '',
        maxCapacity: 45,
        isActive: true
      });
      setShowLocationDialog(false);
    } catch (error) {
      console.error('Failed to add location:', error);
      setErrorMessage('Failed to add the location.');
    }
  };

  const handleAddSpeaker = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const speakerId = await SpeakersService.addSpeaker(speakerForm);
      const addedSpeaker: SpeakerResponse = {
        speakerId,
        fullName: speakerForm.fullName,
        company: speakerForm.company ?? '',
        email: speakerForm.email,
        twitterUrl: speakerForm.twitterUrl ?? '',
        gitHubUrl: speakerForm.gitHubUrl ?? '',
        linkedInUrl: speakerForm.linkedInUrl ?? '',
        blogUrl: speakerForm.blogUrl ?? '',
        thumbnailUrl: speakerForm.thumbnailUrl ?? '',
        bio: ''
      };

      setSpeakers(prev => [...prev, addedSpeaker].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setPresentationForm(prev => ({ ...prev, speakerId }));
      setSpeakerForm({
        fullName: '',
        email: '',
        company: '',
        linkedInUrl: '',
        twitterUrl: '',
        gitHubUrl: '',
        blogUrl: '',
        thumbnailUrl: ''
      });
      setShowSpeakerDialog(false);
    } catch (error) {
      console.error('Failed to add speaker:', error);
      setErrorMessage('Failed to add the speaker.');
    }
  };

  const handleAddPresentation = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const presentationId = await PresentationsService.addPresentation(presentationForm);
      const selectedSpeaker = speakers.find(speaker => speaker.speakerId === presentationForm.speakerId);

      if (!selectedSpeaker) {
        setErrorMessage('The selected speaker could not be found.');
        return;
      }

      const addedPresentation: PresentationResponse = {
        presentationId,
        title: presentationForm.title,
        abstract: presentationForm.abstract,
        speakers: [selectedSpeaker]
      };

      setPresentations(prev => [...prev, addedPresentation].sort((a, b) => a.title.localeCompare(b.title)));
      setAgendaItems(prev => [...prev, addedPresentation]);
      setPresentationForm({
        title: '',
        abstract: '',
        speakerId: ''
      });
      setShowPresentationDialog(false);
    } catch (error) {
      console.error('Failed to add presentation:', error);
      setErrorMessage('Failed to add the presentation.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (!selectedLocation) {
        throw new Error('Please select a location.');
      }

      const request: MeetupRequest = {
        title: formData.title,
        description: formData.description,
        startUtc: new Date(formData.startUtc).toISOString(),
        endUtc: new Date(formData.endUtc).toISOString(),
        totalSpots: formData.totalSpots,
        status: 'Scheduled',
        locationName: selectedLocation.name,
        presentationIds: agendaItems.map(item => item.presentationId)
      };

      await MeetupsService.addMeetup(request);
      navigate('/meetups');
    } catch (error) {
      console.error('Failed to add meetup:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to add meetup.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>Events / Add Event</div>
      </div>

      <div className="flex justify-center w-full mb-8">
        <div className="w-full max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Add Meetup</h1>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleMeetupChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleMeetupChange}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="startUtc" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="startUtc"
                name="startUtc"
                value={formData.startUtc}
                onChange={handleStartUtcChange}
                onInput={handleStartUtcInput}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endUtc" className="block text-sm font-medium text-gray-700 mb-1">
                End Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="endUtc"
                name="endUtc"
                value={formData.endUtc}
                onChange={handleMeetupChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleMeetupChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowLocationDialog(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                <PlusIcon className="h-5 w-5" />
                Add Location
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="totalSpots" className="block text-sm font-medium text-gray-700 mb-1">
              Total Spots <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="totalSpots"
              name="totalSpots"
              min={1}
              value={formData.totalSpots}
              onChange={handleMeetupChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label htmlFor="presentationId" className="block text-sm font-medium text-gray-700 mb-1">
                  Agenda Presentations
                </label>
                <select
                  id="presentationId"
                  value={selectedPresentationId}
                  onChange={e => setSelectedPresentationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an existing presentation</option>
                  {availablePresentations.map(presentation => (
                    <option key={presentation.presentationId} value={presentation.presentationId}>
                      {presentation.title} - {presentation.speakers.map(speaker => speaker.fullName).join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addExistingPresentation}
                  disabled={!selectedPresentationId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresentationDialog(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Presentation
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-medium text-gray-700">Agenda Order</h2>
              {agendaItems.length === 0 ? (
                <p className="text-sm text-gray-500">No presentations added yet.</p>
              ) : (
                <ol className="space-y-3">
                  {agendaItems.map((presentation, index) => (
                    <li
                      key={presentation.presentationId}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {index + 1}. {presentation.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {presentation.speakers.map(speaker => speaker.fullName).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveAgendaItem(presentation.presentationId, -1)}
                          disabled={index === 0}
                          className="rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Move ${presentation.title} up`}
                        >
                          <ChevronUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAgendaItem(presentation.presentationId, 1)}
                          disabled={index === agendaItems.length - 1}
                          className="rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Move ${presentation.title} down`}
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(presentation.presentationId)}
                          className="rounded-md border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Meetup'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/meetups')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {showLocationDialog && (
        <Dialog title="Add Location" onClose={() => setShowLocationDialog(false)}>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div>
              <label htmlFor="location-name" className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="location-name"
                name="name"
                value={locationForm.name}
                onChange={handleLocationFormChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="location-street" className="mb-1 block text-sm font-medium text-gray-700">
                Street
              </label>
              <input
                id="location-street"
                name="street"
                value={locationForm.street}
                onChange={handleLocationFormChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="location-city" className="mb-1 block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="location-city"
                  name="city"
                  value={locationForm.city}
                  onChange={handleLocationFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location-postalCode" className="mb-1 block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  id="location-postalCode"
                  name="postalCode"
                  value={locationForm.postalCode}
                  onChange={handleLocationFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="location-country" className="mb-1 block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  id="location-country"
                  name="country"
                  value={locationForm.country}
                  onChange={handleLocationFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location-maxCapacity" className="mb-1 block text-sm font-medium text-gray-700">
                  Max Capacity
                </label>
                <input
                  id="location-maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min={1}
                  value={locationForm.maxCapacity ?? 0}
                  onChange={handleLocationFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="location-link" className="mb-1 block text-sm font-medium text-gray-700">
                Link
              </label>
              <input
                id="location-link"
                name="link"
                type="url"
                value={locationForm.link}
                onChange={handleLocationFormChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="location-description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="location-description"
                name="description"
                value={locationForm.description}
                onChange={handleLocationFormChange}
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Save Location
              </button>
              <button
                type="button"
                onClick={() => setShowLocationDialog(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {showPresentationDialog && (
        <Dialog title="Add Presentation" onClose={() => setShowPresentationDialog(false)}>
          <form onSubmit={handleAddPresentation} className="space-y-4">
            <div>
              <label htmlFor="presentation-title" className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="presentation-title"
                name="title"
                value={presentationForm.title}
                onChange={handlePresentationFormChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="presentation-speakerId" className="mb-1 block text-sm font-medium text-gray-700">
                  Speaker
                </label>
                <select
                  id="presentation-speakerId"
                  name="speakerId"
                  value={presentationForm.speakerId}
                  onChange={handlePresentationFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a speaker</option>
                  {speakers.map(speaker => (
                    <option key={speaker.speakerId} value={speaker.speakerId}>
                      {speaker.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowSpeakerDialog(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Speaker
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="presentation-abstract" className="mb-1 block text-sm font-medium text-gray-700">
                Abstract
              </label>
              <textarea
                id="presentation-abstract"
                name="abstract"
                value={presentationForm.abstract}
                onChange={handlePresentationFormChange}
                rows={6}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Save Presentation
              </button>
              <button
                type="button"
                onClick={() => setShowPresentationDialog(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {showSpeakerDialog && (
        <Dialog title="Add Speaker" onClose={() => setShowSpeakerDialog(false)}>
          <form onSubmit={handleAddSpeaker} className="space-y-4">
            <div>
              <label htmlFor="speaker-fullName" className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="speaker-fullName"
                name="fullName"
                value={speakerForm.fullName}
                onChange={handleSpeakerFormChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="speaker-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="speaker-email"
                  name="email"
                  type="email"
                  value={speakerForm.email}
                  onChange={handleSpeakerFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="speaker-company" className="mb-1 block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  id="speaker-company"
                  name="company"
                  value={speakerForm.company}
                  onChange={handleSpeakerFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="speaker-linkedInUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  id="speaker-linkedInUrl"
                  name="linkedInUrl"
                  type="url"
                  value={speakerForm.linkedInUrl}
                  onChange={handleSpeakerFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="speaker-twitterUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  Twitter URL
                </label>
                <input
                  id="speaker-twitterUrl"
                  name="twitterUrl"
                  type="url"
                  value={speakerForm.twitterUrl}
                  onChange={handleSpeakerFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="speaker-gitHubUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  GitHub URL
                </label>
                <input
                  id="speaker-gitHubUrl"
                  name="gitHubUrl"
                  type="url"
                  value={speakerForm.gitHubUrl}
                  onChange={handleSpeakerFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="speaker-blogUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  Blog URL
                </label>
                <input
                  id="speaker-blogUrl"
                  name="blogUrl"
                  type="url"
                  value={speakerForm.blogUrl}
                  onChange={handleSpeakerFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="speaker-thumbnailUrl" className="mb-1 block text-sm font-medium text-gray-700">
                Thumbnail URL
              </label>
              <input
                id="speaker-thumbnailUrl"
                name="thumbnailUrl"
                type="url"
                value={speakerForm.thumbnailUrl}
                onChange={handleSpeakerFormChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Save Speaker
              </button>
              <button
                type="button"
                onClick={() => setShowSpeakerDialog(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog>
      )}
        </div>
      </div>
    </div>
  );
}

import { type ChangeEvent, type SubmitEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MeetupsService } from '../../services/meetupsService';
import { PresentationsService } from '../../services/presentationsService';
import { LocationsService } from '../../services/locationsService';
import type { LocationResponse, MeetupRequest, MeetupResponse, PresentationResponse, UpdateRsvpRequest } from '../../types';

interface MeetupEditFormState {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
  locationId: string;
  rsvpYesCount: number;
  rsvpNoCount: number;
  rsvpWaitlistCount: number;
  attendanceCount: number;
  totalSpots: number;
  status: 'Scheduled' | 'Cancelled' | 'Completed';
}

function toDateTimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function addHoursToDateTimeLocalValue(value: string, hoursToAdd: number): string {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return value;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const nextDate = new Date(year, month - 1, day, hours, minutes);
  nextDate.setHours(nextDate.getHours() + hoursToAdd);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}T${String(nextDate.getHours()).padStart(2, '0')}:${String(nextDate.getMinutes()).padStart(2, '0')}`;
}

export default function EditMeetup() {
  const { meetupId } = useParams<{ meetupId: string }>();
  const navigate = useNavigate();
  const [meetup, setMeetup] = useState<MeetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [agendaItems, setAgendaItems] = useState<PresentationResponse[]>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState('');
  const [formData, setFormData] = useState<MeetupEditFormState>({
    title: '',
    description: '',
    startUtc: '',
    endUtc: '',
    locationId: '',
    rsvpYesCount: 0,
    rsvpNoCount: 0,
    rsvpWaitlistCount: 0,
    attendanceCount: 0,
    totalSpots: 0,
    status: 'Scheduled'
  });
  const [originalFormData, setOriginalFormData] = useState<MeetupEditFormState | null>(null);
  const [originalAgendaIds, setOriginalAgendaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAgenda, setIsSubmittingAgenda] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showAgendaSaveToast, setShowAgendaSaveToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agendaErrorMessage, setAgendaErrorMessage] = useState('');

  const isAgendaDirty = useMemo(() => {
    return JSON.stringify(agendaItems.map(i => i.presentationId)) !== JSON.stringify(originalAgendaIds);
  }, [agendaItems, originalAgendaIds]);

  const isDirty = useMemo(() => {
    if (!originalFormData) return false;
    const formChanged = (Object.keys(originalFormData) as (keyof MeetupEditFormState)[]).some(
      key => originalFormData[key] !== formData[key]
    );
    return formChanged;
  }, [originalFormData, formData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!meetupId) return;
      try {
        const [data, loadedLocations, loadedPresentations] = await Promise.all([
          MeetupsService.getMeetupById(meetupId),
          LocationsService.getAllLocations(),
          PresentationsService.getAllPresentations()
        ]);

        setMeetup(data);
        setLocations([...loadedLocations].sort((a, b) => a.name.localeCompare(b.name)));
        setPresentations([...loadedPresentations].sort((a, b) => a.title.localeCompare(b.title)));

        const statusValue = (['Scheduled', 'Cancelled', 'Completed'].includes(data.status)
          ? data.status
          : 'Scheduled') as MeetupEditFormState['status'];

        const initialFormData: MeetupEditFormState = {
          title: data.title,
          description: data.description,
          startUtc: toDateTimeLocalValue(data.startUtc),
          endUtc: toDateTimeLocalValue(data.endUtc),
          locationId: data.location.locationId,
          rsvpYesCount: data.rsvp.rsvpYesCount,
          rsvpNoCount: data.rsvp.rsvpNoCount,
          rsvpWaitlistCount: data.rsvp.rsvpWaitlistCount,
          attendanceCount: data.rsvp.attendanceCount,
          totalSpots: data.rsvp.totalSpots,
          status: statusValue
        };

        setFormData(initialFormData);
        setOriginalFormData(initialFormData);

        const currentAgenda = data.presentations ?? [];
        setAgendaItems(currentAgenda);
        setOriginalAgendaIds(currentAgenda.map(p => p.presentationId));
      } catch (error) {
        console.error('Failed to fetch meetup data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meetupId]);

  const availablePresentations = useMemo(
    () => presentations.filter(p => !agendaItems.some(item => item.presentationId === p.presentationId)),
    [agendaItems, presentations]
  );

  const selectedLocation = useMemo(
    () => locations.find(l => l.locationId === formData.locationId) ?? null,
    [formData.locationId, locations]
  );

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['rsvpYesCount', 'rsvpNoCount', 'rsvpWaitlistCount', 'attendanceCount', 'totalSpots'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
  };

  const handleStartUtcChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      startUtc: value,
      endUtc: addHoursToDateTimeLocalValue(value, 3)
    }));
  };

  const addExistingPresentation = () => {
    if (!selectedPresentationId) return;
    const presentation = presentations.find(p => p.presentationId === selectedPresentationId);
    if (!presentation) return;
    setAgendaItems(prev => [...prev, presentation]);
    setSelectedPresentationId('');
  };

  const moveAgendaItem = (presentationId: string, direction: -1 | 1) => {
    setAgendaItems(prev => {
      const index = prev.findIndex(item => item.presentationId === presentationId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const removeAgendaItem = (presentationId: string) => {
    setAgendaItems(prev => prev.filter(item => item.presentationId !== presentationId));
  };

  const handleDelete = async () => {
    if (!meetupId || !confirm('Are you sure you want to delete this meetup?')) return;
    try {
      await MeetupsService.deleteMeetup(meetupId);
      navigate('/meetups');
    } catch (error) {
      console.error('Failed to delete meetup:', error);
    }
  };

  const onSubmitAgenda = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAgendaDirty || isSubmittingAgenda) return;
    setIsSubmittingAgenda(true);
    setAgendaErrorMessage('');
    try {
      await MeetupsService.updateMeetupAgenda(meetupId!, agendaItems.map(item => item.presentationId));
      setOriginalAgendaIds(agendaItems.map(i => i.presentationId));
      setShowAgendaSaveToast(true);
      setTimeout(() => setShowAgendaSaveToast(false), 5000);
    } catch (error) {
      console.error('Failed to update agenda:', error);
      setAgendaErrorMessage(error instanceof Error ? error.message : 'Failed to update agenda.');
    } finally {
      setIsSubmittingAgenda(false);
    }
  };

  const onSubmitUpdate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (!selectedLocation) throw new Error('Please select a location.');

      const request: MeetupRequest = {
        title: formData.title,
        description: formData.description,
        startUtc: new Date(formData.startUtc).toISOString(),
        endUtc: new Date(formData.endUtc).toISOString(),
        status: formData.status,
        totalSpots: formData.totalSpots,
        locationId: selectedLocation.locationId
      };

      const rsvpRequest: UpdateRsvpRequest = {
        totalSpots: formData.totalSpots,
        rsvpYesCount: formData.rsvpYesCount,
        rsvpNoCount: formData.rsvpNoCount,
        rsvpWaitlistCount: formData.rsvpWaitlistCount,
        attendanceCount: formData.attendanceCount
      };

      await MeetupsService.updateMeetup(meetupId!, request);
      await MeetupsService.updateMeetupRsvps(meetupId!, rsvpRequest);
      
      if (meetup) {
        setMeetup({
          ...meetup,
          title: formData.title,
          description: formData.description,
          startUtc: new Date(formData.startUtc).toISOString(),
          endUtc: new Date(formData.endUtc).toISOString(),
          status: formData.status,
          location: selectedLocation || meetup.location,
          rsvp: {
            totalSpots: formData.totalSpots,
            rsvpYesCount: formData.rsvpYesCount,
            rsvpNoCount: formData.rsvpNoCount,
            rsvpWaitlistCount: formData.rsvpWaitlistCount,
            attendanceCount: formData.attendanceCount
          }
        });
      }
      
      setOriginalFormData(formData);
      setOriginalAgendaIds(agendaItems.map(i => i.presentationId));
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 5000);
    } catch (error) {
      console.error('Failed to update meetup:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update meetup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Meetup not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>Meetups / Edit Meetup</div>
        <div className="flex gap-3">
          <Link
            to="/meetups/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Meetup
          </Link>
        </div>
      </div>

      <div className='flex justify-center w-full mb-8'>
        <div className='w-full max-w-7xl flex flex-col items-center gap-6 px-4'>

          <div className="bg-white rounded-lg shadow p-6 w-full">
            <div className="space-y-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">{meetup.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Start:</span> {new Date(meetup.startUtc).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">End:</span> {new Date(meetup.endUtc).toLocaleString()}
                </div>
              </div>

              <div>
                <span className="font-medium">Location:</span> {meetup.location.name}
                <p className="text-sm text-gray-600">
                  {/* {meetup.location.address}, {meetup.location.city}, {meetup.location.state} {meetup.location.zipCode} */}
                </p>
              </div>

              <div>
                <span className="font-medium">RSVPs:</span> {meetup.rsvp.rsvpYesCount} Yes, {meetup.rsvp.rsvpNoCount} No, {meetup.rsvp.rsvpWaitlistCount} Waitlist
              </div>

            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6 w-full'>
            {errorMessage && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {errorMessage}
              </div>
            )}
            <form onSubmit={onSubmitUpdate} className="space-y-6">
              <div className='grid grid-cols-2 gap-8'>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="startUtc" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Start Date/Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="startUtc"
                      name="startUtc"
                      value={formData.startUtc}
                      onChange={handleStartUtcChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleFormChange}
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

                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="endUtc" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      End Date/Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="endUtc"
                      name="endUtc"
                      value={formData.endUtc}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <label htmlFor="rsvpYesCount" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    RSVP Yes
                  </label>
                  <input
                    type="number"
                    id="rsvpYesCount"
                    name="rsvpYesCount"
                    min={0}
                    value={formData.rsvpYesCount}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="rsvpNoCount" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    RSVP No
                  </label>
                  <input
                    type="number"
                    id="rsvpNoCount"
                    name="rsvpNoCount"
                    min={0}
                    value={formData.rsvpNoCount}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="rsvpWaitlistCount" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Waitlist
                  </label>
                  <input
                    type="number"
                    id="rsvpWaitlistCount"
                    name="rsvpWaitlistCount"
                    min={0}
                    value={formData.rsvpWaitlistCount}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="attendanceCount" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Attendance
                  </label>
                  <input
                    type="number"
                    id="attendanceCount"
                    name="attendanceCount"
                    min={0}
                    value={formData.attendanceCount}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="totalSpots" className="block text-sm font-medium text-gray-600 mb-1 text-left">
                    Total Spots
                  </label>
                  <input
                    type="number"
                    id="totalSpots"
                    name="totalSpots"
                    min={1}
                    value={formData.totalSpots}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Meetup
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Presentations</h2>
            </div>

            <div className="space-y-3 mb-6">
              {agendaItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No presentations in agenda. Add one from below.
                </p>
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
                          {presentation.speakers.map(s => s.fullName).join(', ')}
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
                          className="rounded-md p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Delete ${presentation.title}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {agendaErrorMessage && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {agendaErrorMessage}
              </div>
            )}

            <form onSubmit={onSubmitAgenda} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <label htmlFor="presentationId" className="block text-sm font-medium text-gray-700 mb-1">
                    Add Presentation to Agenda
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
                        {presentation.title} – {presentation.speakers.map(s => s.fullName).join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addExistingPresentation}
                  disabled={!selectedPresentationId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to Agenda
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!isAgendaDirty || isSubmittingAgenda}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
                >
                  {isSubmittingAgenda ? 'Saving...' : 'Save Agenda'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
          <span>✓ Meetup saved successfully</span>
          <button
            onClick={() => setShowSaveToast(false)}
            className="text-white hover:text-gray-200 font-bold text-lg"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      {showAgendaSaveToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
          <span>✓ Agenda saved successfully</span>
          <button
            onClick={() => setShowAgendaSaveToast(false)}
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



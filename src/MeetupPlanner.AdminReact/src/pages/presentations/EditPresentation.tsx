import { type ChangeEvent, type SubmitEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PresentationsService } from '../../services/presentationsService';
import { SpeakersService } from '../../services/speakersService';
import type { PresentationResponse, SpeakerResponse, PresentationRequest } from '../../types';

interface PresentationEditFormState {
  title: string;
  abstract: string;
  speakerIds: string[];
}

export default function EditPresentation() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<PresentationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allSpeakers, setAllSpeakers] = useState<SpeakerResponse[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');

  const [formData, setFormData] = useState<PresentationEditFormState>({
    title: '',
    abstract: '',
    speakerIds: []
  });
  const [originalFormData, setOriginalFormData] = useState<PresentationEditFormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isDirty = useMemo(() => {
    if (!originalFormData) return false;
    return (
      originalFormData.title !== formData.title ||
      originalFormData.abstract !== formData.abstract ||
      JSON.stringify(originalFormData.speakerIds.sort()) !== JSON.stringify(formData.speakerIds.sort())
    );
  }, [originalFormData, formData]);

  const availableSpeakers = useMemo(() => {
    return allSpeakers.filter(
      speaker => !formData.speakerIds.includes(speaker.speakerId)
    );
  }, [allSpeakers, formData.speakerIds]);

  const selectedSpeakers = useMemo(() => {
    return allSpeakers.filter(speaker => formData.speakerIds.includes(speaker.speakerId));
  }, [allSpeakers, formData.speakerIds]);

  useEffect(() => {
    const fetchData = async () => {
      if (!presentationId) return;
      try {
        const [data, speakers] = await Promise.all([
          PresentationsService.getPresentationById(presentationId),
          SpeakersService.getAllSpeakers()
        ]);

        setPresentation(data);
        setAllSpeakers(speakers.sort((a, b) => a.fullName.localeCompare(b.fullName)));

        const initialFormData: PresentationEditFormState = {
          title: data.title,
          abstract: data.abstract,
          speakerIds: data.speakers.map(s => s.speakerId)
        };

        setFormData(initialFormData);
        setOriginalFormData(initialFormData);
      } catch (error) {
        console.error('Failed to fetch presentation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presentationId]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSpeaker = () => {
    if (!selectedSpeakerId) return;
    setFormData(prev => ({
      ...prev,
      speakerIds: [...prev.speakerIds, selectedSpeakerId]
    }));
    setSelectedSpeakerId('');
  };

  const removeSpeaker = (speakerId: string) => {
    setFormData(prev => ({
      ...prev,
      speakerIds: prev.speakerIds.filter(id => id !== speakerId)
    }));
  };

  const handleDelete = async () => {
    if (!presentationId || !confirm('Are you sure you want to delete this presentation? All scheduled slots will be removed.')) return;
    try {
      await PresentationsService.deletePresentation(presentationId);
      navigate('/presentations');
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete presentation.');
    }
  };

  const onSubmitUpdate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (formData.speakerIds.length === 0) {
        throw new Error('Please add at least one speaker.');
      }

      // For now, send the first speaker ID as the primary speaker
      // In the future, the backend might be updated to support multiple speakers
      const request: PresentationRequest = {
        title: formData.title,
        abstract: formData.abstract,
        speakerIds: formData.speakerIds
      };

      await PresentationsService.updatePresentation(presentationId!, request);

      if (presentation) {
        setPresentation({
          ...presentation,
          title: formData.title,
          abstract: formData.abstract,
          speakers: selectedSpeakers
        });
      }

      setOriginalFormData(formData);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 5000);
    } catch (error) {
      console.error('Failed to update presentation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update presentation.');
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

  if (!presentation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Presentation not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>Presentations / Edit Presentation</div>
        <div className="flex gap-3">
          <Link
            to="/presentations/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Presentation
          </Link>
        </div>
      </div>

      <div className="flex justify-center w-full mb-8">
        <div className="w-full max-w-4xl flex flex-col items-center gap-6 px-4">
          {/* Presentation Details Card */}
          <div className="bg-white rounded-lg shadow p-6 w-full">
            <div className="space-y-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">{presentation.title}</h2>
              </div>

              <div>
                <span className="font-medium">Speakers:</span> {presentation.speakers.map(s => s.fullName).join(', ')}
              </div>

              <div>
                <span className="font-medium">Abstract:</span>
                <p className="text-sm text-gray-600 mt-1">{presentation.abstract}</p>
              </div>
            </div>
          </div>

          {/* Edit Form Card */}
          <div className="bg-white rounded-lg shadow p-6 w-full">
            {errorMessage && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {errorMessage}
              </div>
            )}
            <form onSubmit={onSubmitUpdate} className="space-y-6">
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
                <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Abstract <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="abstract"
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleFormChange}
                  required
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
                  Delete Presentation
                </button>
              </div>
            </form>
          </div>

          {/* Speakers Section */}
          <div className="bg-white rounded-lg shadow p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Speakers</h2>
            </div>

            <div className="space-y-3 mb-6">
              {selectedSpeakers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No speakers assigned. Add one below.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedSpeakers.map(speaker => (
                    <li
                      key={speaker.speakerId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{speaker.fullName}</div>
                        <div className="text-sm text-gray-500">{speaker.company}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpeaker(speaker.speakerId)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Remove ${speaker.fullName}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addSpeaker(); }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <label htmlFor="speakerId" className="block text-sm font-medium text-gray-700 mb-1">
                    Add Speaker
                  </label>
                  <select
                    id="speakerId"
                    value={selectedSpeakerId}
                    onChange={e => setSelectedSpeakerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a speaker</option>
                    {availableSpeakers.map(speaker => (
                      <option key={speaker.speakerId} value={speaker.speakerId}>
                          {speaker.fullName} - {speaker.email || speaker.company || 'No contact info'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!selectedSpeakerId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add Speaker
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
          <span>✓ Presentation saved successfully</span>
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

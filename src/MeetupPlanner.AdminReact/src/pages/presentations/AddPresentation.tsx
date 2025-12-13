import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresentationsService } from '../../services/presentationsService';
import { SpeakersService } from '../../services/speakersService';
import type { PresentationRequest, SpeakerResponse } from '../../types';

export default function AddPresentation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speakers, setSpeakers] = useState<SpeakerResponse[]>([]);
  const [formData, setFormData] = useState<PresentationRequest>({
    title: '',
    description: '',
    speakerId: '',
  });

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const data = await SpeakersService.getAllSpeakers();
        setSpeakers(data);
      } catch (error) {
        console.error('Failed to fetch speakers:', error);
      }
    };

    fetchSpeakers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await PresentationsService.addPresentation(formData);
      navigate('/presentations');
    } catch (error) {
      console.error('Failed to add presentation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add Presentation</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
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
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="speakerId" className="block text-sm font-medium text-gray-700 mb-1">
              Speaker <span className="text-red-500">*</span>
            </label>
            <select
              id="speakerId"
              name="speakerId"
              value={formData.speakerId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a speaker</option>
              {speakers.map((speaker) => (
                <option key={speaker.speakerId} value={speaker.speakerId}>
                  {speaker.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Presentation'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/presentations')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

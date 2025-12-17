import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PresentationsService } from '../../services/presentationsService';
import type { PresentationResponse } from '../../types';

export default function EditPresentation() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<PresentationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresentation = async () => {
      if (!presentationId) return;
      
      try {
        const data = await PresentationsService.getPresentationById(presentationId);
        setPresentation(data);
      } catch (error) {
        console.error('Failed to fetch presentation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentation();
  }, [presentationId]);

  const handleDelete = async () => {
    if (!presentationId || !confirm('Are you sure you want to delete this presentation?')) return;

    try {
      await PresentationsService.deletePresentation(presentationId);
      navigate('/presentations');
    } catch (error) {
      console.error('Failed to delete presentation:', error);
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
      <h1 className="text-3xl font-bold mb-6">Presentation Details</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{presentation.title}</h2>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Speakers</h3>
            <p className="text-gray-900">{presentation.speakers.map(speaker => speaker.name).join(', ')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Description</h3>
            <p className="text-gray-900">{presentation.abstract}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/presentations')}
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

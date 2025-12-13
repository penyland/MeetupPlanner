import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PresentationsService } from '../../services/presentationsService';
import type { PresentationResponse } from '../../types';

export default function PresentationsList() {
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const data = await PresentationsService.getAllPresentations();
        setPresentations(data);
      } catch (error) {
        console.error('Failed to fetch presentations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
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
        <h1 className="text-3xl font-bold">Presentations</h1>
        <Link
          to="/presentations/add"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Presentation
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {presentations.map((presentation) => (
          <Link
            key={presentation.presentationId}
            to={`/presentations/${presentation.presentationId}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {presentation.title}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {presentation.speakers.map((speaker) => (
                <span
                  key={speaker.speakerId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {speaker.name}
                </span>
              ))}
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-3 mt-auto">
              {presentation.abstract}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

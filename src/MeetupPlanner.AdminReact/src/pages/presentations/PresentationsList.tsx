import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PresentationsService } from '../../services/presentationsService';
import type { PresentationResponse } from '../../types';
import ViewToggle from '../../components/ViewToggle';

export default function PresentationsList() {
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        <div className="flex gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <Link
            to="/presentations/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Presentation
          </Link>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                  <Link
                    key={speaker.speakerId}
                    to={`/speakers/${speaker.speakerId}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {speaker.name}
                  </Link>
                ))}
              </div>

              <p className="text-gray-600 text-sm line-clamp-3 mt-auto">
                {presentation.abstract}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speakers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abstract
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {presentations.map((presentation) => (
                  <tr key={presentation.presentationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/presentations/${presentation.presentationId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {presentation.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-700">
                      <div className="flex flex-wrap gap-2">
                        {presentation.speakers.map((speaker) => (
                          <Link
                            key={speaker.speakerId}
                            to={`/speakers/${speaker.speakerId}`}
                            className="hover:underline"
                          >
                            {speaker.name}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p className="line-clamp-2">{presentation.abstract}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

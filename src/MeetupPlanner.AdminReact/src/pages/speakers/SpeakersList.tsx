import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SpeakersService } from '../../services/speakersService';
import type { SpeakerResponse } from '../../types';

export default function SpeakersList() {
  const [speakers, setSpeakers] = useState<SpeakerResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const data = await SpeakersService.getAllSpeakers();
        setSpeakers(data);
      } catch (error) {
        console.error('Failed to fetch speakers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
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
        <h1 className="text-3xl font-bold">Speakers</h1>
        <Link
          to="/speakers/add"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Speaker
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {speakers.map((speaker) => (
          <Link
            key={speaker.speakerId}
            to={`/speakers/${speaker.speakerId}`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              {speaker.thumbnailUrl ? (
                <img
                  src={speaker.thumbnailUrl}
                  alt={speaker.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">{speaker.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{speaker.name}</h3>
                <p className="text-sm text-gray-500">{speaker.company}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{speaker.bio}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

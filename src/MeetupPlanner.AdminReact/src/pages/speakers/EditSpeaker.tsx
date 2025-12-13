import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SpeakersService } from '../../services/speakersService';
import type { SpeakerResponse } from '../../types';

export default function EditSpeaker() {
  const { speakerId } = useParams<{ speakerId: string }>();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<SpeakerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpeaker = async () => {
      if (!speakerId) return;
      
      try {
        const data = await SpeakersService.getSpeakerById(speakerId);
        setSpeaker(data);
      } catch (error) {
        console.error('Failed to fetch speaker:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeaker();
  }, [speakerId]);

  const handleDelete = async () => {
    if (!speakerId || !confirm('Are you sure you want to delete this speaker?')) return;

    try {
      await SpeakersService.deleteSpeaker(speakerId);
      navigate('/speakers');
    } catch (error) {
      console.error('Failed to delete speaker:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Speaker not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Speaker Details</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-start space-x-6 mb-6">
          {speaker.thumbnailUrl ? (
            <img
              src={speaker.thumbnailUrl}
              alt={speaker.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-500">{speaker.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{speaker.name}</h2>
            <p className="text-gray-600">{speaker.company}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Email</h3>
            <p className="text-gray-900">{speaker.email}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Bio</h3>
            <p className="text-gray-900">{speaker.bio}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Social Links</h3>
            <div className="space-y-1">
              {speaker.linkedInUrl && (
                <p><a href={speaker.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a></p>
              )}
              {speaker.twitterUrl && (
                <p><a href={speaker.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twitter</a></p>
              )}
              {speaker.gitHubUrl && (
                <p><a href={speaker.gitHubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a></p>
              )}
              {speaker.blogUrl && (
                <p><a href={speaker.blogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Blog</a></p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/speakers')}
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

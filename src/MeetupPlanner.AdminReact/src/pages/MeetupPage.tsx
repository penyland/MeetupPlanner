import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MeetupsService } from '../services/meetupsService';
import type { MeetupResponse } from '../types';

export default function MeetupPage() {
  const { meetupId } = useParams<{ meetupId: string }>();
  const [meetup, setMeetup] = useState<MeetupResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetup = async () => {
      if (!meetupId) return;
      
      try {
        const data = await MeetupsService.getMeetupById(meetupId);
        setMeetup(data);
      } catch (error) {
        console.error('Failed to fetch meetup:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetup();
  }, [meetupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Loading meetup...</p>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Meetup not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{meetup.title}</h1>
      <p className="text-lg text-gray-700">Meetup Title: {meetup.title}</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MeetupsService } from '../../services/meetupsService';
import type { MeetupResponse } from '../../types';

export default function EditMeetup() {
  const { meetupId } = useParams<{ meetupId: string }>();
  const navigate = useNavigate();
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

  const handleDelete = async () => {
    if (!meetupId || !confirm('Are you sure you want to delete this meetup?')) return;

    try {
      await MeetupsService.deleteMeetup(meetupId);
      navigate('/meetups');
    } catch (error) {
      console.error('Failed to delete meetup:', error);
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
      <h1 className="text-3xl font-bold mb-6">Edit Meetup</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">{meetup.title}</h2>
            <p className="text-gray-600 mt-2">{meetup.description}</p>
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
              {meetup.location.address}, {meetup.location.city}, {meetup.location.state} {meetup.location.zipCode}
            </p>
          </div>

          <div>
            <span className="font-medium">RSVPs:</span> {meetup.rsvp.rsvpYesCount} Yes, {meetup.rsvp.rsvpNoCount} No, {meetup.rsvp.rsvpWaitlistCount} Waitlist
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/meetups')}
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

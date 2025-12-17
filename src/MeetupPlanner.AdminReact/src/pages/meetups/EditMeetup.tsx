import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MeetupsService } from '../../services/meetupsService';
import type { MeetupResponse } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlusIcon } from '@heroicons/react/24/outline';

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

        console.log(data.startUtc);
        console.log(data.endUtc);

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

  function handleEdit(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>Breadcrumb / Edit Meetup</div>
        <div className="flex gap-3">
          <Link
            to="/meetups/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
          <div className="w-full max-w-7xl bg-white rounded-lg shadow p-6">
            <div className="mt-6 mb-6">

              <div className="text-gray-700 mt-8 prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{meetup.description}</ReactMarkdown>
              </div>
              <div>
                <div className='font-bold text-lg mt-6'>Agenda:</div>
                <ul className="list-disc list-inside mt-2">
                  {meetup.presentations && meetup.presentations.length > 0 ? (
                    meetup.presentations.map(presentation => (
                      <li key={presentation.presentationId} className="mt-4">
                        <span className="font-bold">{presentation.title}</span>
                        <div className="text-gray-600">
                          ({presentation.speakers.map(s => s.fullName).join(', ')})
                        </div>
                        <div className="text-gray-700 mt-1">
                          {presentation.abstract}
                        </div>
                      </li>
                    ))) : (
                    <li className="text-gray-600">No presentations scheduled.</li>
                  )}
                </ul>
              </div>
            </div>

            <div>
              <div className='font-bold text-lg mt-6'>About the speakers:</div>
              {meetup.presentations && meetup.presentations.length > 0 ? (
                meetup.presentations.map(presentation => (
                  <div key={presentation.presentationId} className="mt-4">
                    {presentation.speakers.map(speaker => (
                      <div key={speaker.speakerId} className="mb-4">
                        <div className="font-semibold">{speaker.fullName}</div>
                        <div className="text-gray-700 mt-1">
                          {speaker.bio}
                        </div>
                      </div>
                    ))}
                  </div>
                ))) : (
                <div className="text-gray-600">No speaker information available.</div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => navigate('/meetups')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to List
              </button>
              <button
                onClick={handleEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'>
                Generate Meetup.com text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

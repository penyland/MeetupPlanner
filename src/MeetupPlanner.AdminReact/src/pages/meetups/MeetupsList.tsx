import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { MeetupsService } from '../../services/meetupsService';
import type { MeetupResponse } from '../../types';

export default function MeetupsList() {
  const [meetups, setMeetups] = useState<MeetupResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        const data = await MeetupsService.getAllMeetups();
        setMeetups(data);
      } catch (error) {
        console.error('Failed to fetch meetups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetups();
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
        <h1 className="text-3xl font-bold">Meetups</h1>
        <Link
          to="/meetups/add"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Meetup
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RSVPs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {meetups.map((meetup) => (
                <tr key={meetup.meetupId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/meetups/${meetup.meetupId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {meetup.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(meetup.startUtc).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {meetup.location.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {meetup.rsvp.rsvpYesCount} / {meetup.rsvp.totalSpots}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MeetupsService } from '../services/meetupsService';
import type { MeetupResponse, RsvpResponse } from '../types';

export default function Home() {
  const [meetups, setMeetups] = useState<MeetupResponse[]>([]);
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetupsData, rsvpsData] = await Promise.all([
          MeetupsService.getScheduledMeetups(),
          MeetupsService.getRsvps(),
        ]);
        setMeetups(meetupsData);
        setRsvps(rsvpsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = rsvps.map(rsvp => ({
    date: new Date(rsvp.startUtc).toLocaleDateString(),
    Yes: rsvp.rsvpYesCount,
    No: rsvp.rsvpNoCount,
    Waitlist: rsvp.rsvpWaitlistCount,
    'Total Spots': rsvp.totalSpots,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Overview</h2>

      <div className='grid lg:grid-cols-4 sm:grid-cols-2 gap-6 mb-8'>

        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <h3 className="text-lg font-bold mb-4">Meetups</h3>
          <p className="text-3xl font-semibold text-gray-900">{meetups.length}</p>
        </div>

        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <h3 className="text-xl font-bold mb-4">Speakers</h3>
          <p className="text-3xl font-semibold text-gray-900">42</p>
        </div>

        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <h3 className="text-xl font-bold mb-4">Visitors</h3>
          <p className="text-3xl font-semibold text-gray-900">142</p>
        </div>

        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <h3 className="text-xl font-bold mb-4">Presentations</h3>
          <p className="text-3xl font-semibold text-gray-900">12</p>
        </div>

      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Upcoming Meetups</h3>
        <div className="space-y-3">
          {meetups.map((meetup) => (
            <Link
              key={meetup.meetupId}
              to={`/meetups/${meetup.meetupId}`}
              className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <p className="text-lg font-medium">
                {meetup.title} - {new Date(meetup.startUtc).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-12">
        <h3 className="text-2xl font-semibold mb-4">Meetup RSVPs</h3>
        <ResponsiveContainer width="100%" height={400} className="mt-16">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Yes" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="No" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="Waitlist" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="Total Spots" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { FaGithub, FaGlobe, FaLinkedin, FaTwitter } from 'react-icons/fa6';
import { SpeakersService } from '../../services/speakersService';
import type { SpeakerResponse } from '../../types';
import ViewToggle from '../../components/ViewToggle';
import ErrorBoundary from '../../components/ErrorBoundary';
import SortIcon from '../../components/SortIcon';
import { useSortable } from '../../hooks/useSortable';

type SortField = 'name' | 'email' | 'company';

export default function SpeakersList() {
  const [speakers, setSpeakers] = useState<SpeakerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const { sortField, sortDirection, handleSort } = useSortable<SortField>('name');

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

  const sortedSpeakers = useMemo(() => {
    return [...speakers].sort((a, b) => {
      const cmp = sortField === 'company'
        ? (a.company ?? '').localeCompare(b.company ?? '')
        : sortField === 'email'
          ? (a.email ?? '').localeCompare(b.email ?? '')
          : a.fullName.localeCompare(b.fullName);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [speakers, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary title="Unable to load speakers">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Speakers</h1>
          <div className="flex gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Link
              to="/speakers/add"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Speaker
            </Link>
          </div>
        </div>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSpeakers.map((speaker) => (
              <Link
                key={speaker.speakerId}
                to={`/speakers/${speaker.speakerId}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {speaker.thumbnailUrl ? (
                    <img
                      src={speaker.thumbnailUrl}
                      alt={speaker.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-500">{speaker.fullName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{speaker.fullName}</h3>
                    <p className="text-sm text-gray-500">{speaker.company}</p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{speaker.bio}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('name')}
                    >
                      Name<SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('email')}
                    >
                      Email<SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('company')}
                    >
                      Company<SortIcon field="company" sortField={sortField} sortDirection={sortDirection} />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedSpeakers.map((speaker) => (
                    <tr key={speaker.speakerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link to={`/speakers/${speaker.speakerId}`} className="flex items-center gap-3 text-blue-600 hover:text-blue-800 font-medium">
                          {speaker.thumbnailUrl ? (
                            <img
                              src={speaker.thumbnailUrl}
                              alt={speaker.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {speaker.fullName.charAt(0)}
                            </div>
                          )}
                          <span>{speaker.fullName}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{speaker.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{speaker.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          {speaker.linkedInUrl && (
                            <a
                              href={speaker.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-blue-600"
                              title="LinkedIn"
                              aria-label={`${speaker.fullName} LinkedIn`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaLinkedin />
                            </a>
                          )}
                          {speaker.twitterUrl && (
                            <a
                              href={speaker.twitterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-blue-400"
                              title="Twitter"
                              aria-label={`${speaker.fullName} Twitter`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaTwitter />
                            </a>
                          )}
                          {speaker.gitHubUrl && (
                            <a
                              href={speaker.gitHubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-gray-900"
                              title="GitHub"
                              aria-label={`${speaker.fullName} GitHub`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaGithub />
                            </a>
                          )}
                          {speaker.blogUrl && (
                            <a
                              href={speaker.blogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-green-600"
                              title="Blog"
                              aria-label={`${speaker.fullName} Blog`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaGlobe />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

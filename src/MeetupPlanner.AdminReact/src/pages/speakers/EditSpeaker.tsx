import { FormEvent, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { SpeakersService } from '../../services/speakersService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaGithub, FaGlobe, FaLinkedin, FaTwitter } from "react-icons/fa6";
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { SpeakerResponse, BiographyResponse } from '../../types';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function EditSpeaker() {
  const { speakerId } = useParams<{ speakerId: string }>();
  //const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<SpeakerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [biographies, setBiographies] = useState<BiographyResponse[]>([]);
  const [newBio, setNewBio] = useState('');
  const [showAddBio, setShowAddBio] = useState(false);

  useEffect(() => {
    const fetchSpeaker = async () => {
      if (!speakerId) return;

      try {
        const data = await SpeakersService.getSpeakerById(speakerId);
        setSpeaker(data);

        const biographiesData = await SpeakersService.getSpeakerBiographies(speakerId);
        if (biographiesData && biographiesData.length > 0) {
          setBiographies(biographiesData);
        }
      } catch (error) {
        console.error('Failed to fetch speaker:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeaker();
  }, [speakerId]);

  // const handleDelete = async () => {
  //   if (!speakerId || !confirm('Are you sure you want to delete this speaker?')) return;

  //   try {
  //     await SpeakersService.deleteSpeaker(speakerId);
  //     navigate('/speakers');
  //   } catch (error) {
  //     console.error('Failed to delete speaker:', error);
  //   }
  // };

  const handleAddBiography = () => {
    if (!newBio.trim()) return;

    const newBiography: BiographyResponse = {
      speakerBiographyId: uuidv4(),
      biography:newBio,
      isPrimary: biographies.length === 0,
    };

    setBiographies([...biographies, newBiography]);
    setNewBio('');
    setShowAddBio(false);
  };

  const handleSetPrimary = (bioId: string) => {
    setBiographies(biographies.map(bio => ({
      ...bio,
      isPrimary: bio.speakerBiographyId === bioId
    })));
  };

  const handleDeleteBiography = (bioId: string) => {
    if (biographies.length === 1) {
      alert('Cannot delete the only biography');
      return;
    }
    setBiographies(biographies.filter(bio => bio.speakerBiographyId !== bioId));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>Breadcrumb / Edit Speaker</div>
          <div className="flex gap-3">
            <Link
              to="/speakers/add"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Speaker
            </Link>
          </div>
        </div>

        <div className='flex justify-center w-full mb-8'>
          <div className='w-full max-w-7xl flex flex-col items-center gap-6 px-4'>
            {/* First row: single full-width card */}
            <div className='bg-white rounded-lg shadow p-6 w-full'>

              <div className='grid grid-cols-2 gap-6'>

                <div className='flex justify-center items-center'>
                  {speaker.thumbnailUrl ? (
                    <img
                      src={speaker.thumbnailUrl}
                      alt={speaker.fullName}
                      className="w-64 h-64 rounded-full object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-500">{speaker.fullName.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className='flex flex-col justify-center items-start'>
                  {/* Speaker Name and Company */}
                  <h1 className="text-4xl font-bold mb-2">{speaker.fullName}</h1>
                  <p className="text-gray-600">{speaker.company}</p>
                  <p className="text-gray-900 mt-4">{speaker.bio}</p>

                  <div className="flex gap-4 mt-6">
                    {speaker.linkedInUrl && (
                      <a href={speaker.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600" title="LinkedIn" aria-label="LinkedIn">
                        {/* <FontAwesomeIcon icon={faLinkedin} className="w-24 h-12" /> */}
                        <FaLinkedin></FaLinkedin>
                      </a>
                    )}
                    {speaker.twitterUrl && (
                      <a href={speaker.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-400" title="Twitter" aria-label="Twitter">
                        <FaTwitter />
                      </a>
                    )}
                    {speaker.gitHubUrl && (
                      <a href={speaker.gitHubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900" title="GitHub" aria-label="GitHub">
                        <FaGithub />
                      </a>
                    )}
                    {speaker.blogUrl && (
                      <a href={speaker.blogUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-600" title="Blog" aria-label="Blog">
                        <FaGlobe />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Second row: two cards filling the row */}
            <div className='grid grid-cols-2 gap-8 w-full'>
              <div className='bg-white rounded-lg shadow p-6 w-full'>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={speaker.fullName}
                      // onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={speaker.company}
                      // onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={speaker.email}
                      //onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button type="submit" className="mt-auto self-start px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save
                  </button>

                </form>

              </div>
              <div>
                <div className='bg-white rounded-lg shadow p-6 w-full'>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="linkedInUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaLinkedin/>
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        id="linkedInUrl"
                        name="linkedInUrl"
                        value={speaker.linkedInUrl}
                        //onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="twitterUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaTwitter />
                        Twitter URL
                      </label>
                      <input
                        type="url"
                        id="twitterUrl"
                        name="twitterUrl"
                        value={speaker.twitterUrl}
                        //onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="gitHubUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaGithub />
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        id="gitHubUrl"
                        name="gitHubUrl"
                        value={speaker.gitHubUrl}
                        //onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="blogUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FontAwesomeIcon icon={faGlobe} className="w-5 h-5" />
                        Blog URL
                      </label>
                      <input
                        type="url"
                        id="blogUrl"
                        name="blogUrl"
                        value={speaker.blogUrl}
                        //onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        id="thumbnailUrl"
                        name="thumbnailUrl"
                        value={speaker.thumbnailUrl}
                        //onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save
                    </button>

                  </form>
                </div>
              </div>

              {/* Biography Management Section */}
              <div className='col-span-2'>
                <div className="bg-white rounded-lg shadow p-6 w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Biographies</h2>
                    <button
                      onClick={() => setShowAddBio(!showAddBio)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Biography
                    </button>
                  </div>

                  {showAddBio && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <label htmlFor="newBio" className="block text-sm font-medium text-gray-700 mb-2">
                        New Biography
                      </label>
                      <textarea
                        id="newBio"
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter biography text..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleAddBiography}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Biography
                        </button>
                        <button
                          onClick={() => { setShowAddBio(false); setNewBio(''); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {biographies.map((bio) => (
                      <div
                        key={bio.speakerBiographyId}
                        className={`p-4 rounded-lg border-2 ${bio.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {bio.isPrimary && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                PRIMARY
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {/* {new Date(bio.createdAt).toLocaleDateString()} */}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {!bio.isPrimary && (
                              <button
                                onClick={() => handleSetPrimary(bio.speakerBiographyId)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Set as Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBiography(bio.speakerBiographyId)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                              disabled={biographies.length === 1}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{bio.biography}</p>
                      </div>
                    ))}
                    {biographies.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No biographies yet. Click "Add Biography" to create one.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='col-span-2'>
                <div className="bg-white rounded-lg shadow p-6 w-full">
                  <div className="flex items-start space-x-6 mb-6">

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

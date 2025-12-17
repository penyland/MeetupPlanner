import { FormEvent, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { SpeakersService } from '../../services/speakersService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { SpeakerResponse, BiographyResponse, PresentationResponse } from '../../types';
import { PlusIcon } from '@heroicons/react/24/outline';
import SpeakerCard from '../../components/SpeakerCard';

export default function EditSpeaker() {
  const { speakerId } = useParams<{ speakerId: string }>();
  //const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<SpeakerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [biographies, setBiographies] = useState<BiographyResponse[]>([]);
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [newBio, setNewBio] = useState('');
  const [newBioTitle, setNewBioTitle] = useState('');
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

        const presentationsData = await SpeakersService.getSpeakerPresentations(speakerId);
        if (presentationsData && presentationsData.length > 0) {
          setPresentations(presentationsData);
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
      title: newBioTitle.trim() || undefined,
      biography: newBio,
      isPrimary: biographies.length === 0,
    };

    setBiographies([...biographies, newBiography]);
    setNewBio('');
    setNewBioTitle('');
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
          <div>Speakers / Edit Speaker</div>
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
            <SpeakerCard speaker={speaker} />

            {/* OPTION 1: One form with two cards */}
            {/* <form onSubmit={handleSubmit} className="w-full">
              <div className='grid grid-cols-2 gap-8 w-full'>
                <div className='bg-white rounded-lg shadow p-6 w-full'>
                  <div className="flex flex-col gap-6 h-full">
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
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow p-6 w-full'>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="linkedInUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaLinkedin />
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
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </form> */}

            {/* OPTION 2: One card with two-column form */}
            <div className='bg-white rounded-lg shadow p-6 w-full'>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className='grid grid-cols-2 gap-8'>
                  <div className="space-y-6">
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
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="linkedInUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaLinkedin />
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
                  </div>
                </div>

                <div className="flex">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </form>
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
                    <div className="mb-4">
                      <label htmlFor="newBioTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Optional)
                      </label>
                      <input
                        type="text"
                        id="newBioTitle"
                        value={newBioTitle}
                        onChange={(e) => setNewBioTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Short Bio, Technical Bio, Executive Summary..."
                      />
                    </div>
                    <div>
                      <label htmlFor="newBio" className="block text-sm font-medium text-gray-700 mb-2">
                        Biography <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="newBio"
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter biography text..."
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddBiography}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Biography
                      </button>
                      <button
                        onClick={() => { setShowAddBio(false); setNewBio(''); setNewBioTitle(''); }}
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
                          {bio.title && (
                            <h3 className="text-lg font-semibold text-gray-900">{bio.title}</h3>
                          )}
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
                      <p className="text-gray-900 whitespace-pre-wrap mt-2">{bio.biography}</p>
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Presentations</h2>
                </div>

                <div className="space-y-4">
                  {presentations.map((presentation) => (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{presentation.title}</h3>
                      <p className="text-gray-900 whitespace-pre-wrap mt-2">{presentation.abstract}</p>
                    </div>
                  ))}
                  {presentations.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No presentations available for this speaker.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

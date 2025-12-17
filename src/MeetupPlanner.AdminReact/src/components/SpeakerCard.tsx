import { FaGithub, FaGlobe, FaLinkedin, FaTwitter } from "react-icons/fa6";
import type { SpeakerResponse } from '../types';

interface SpeakerCardProps {
  speaker: SpeakerResponse;
}

export default function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
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
  );
}

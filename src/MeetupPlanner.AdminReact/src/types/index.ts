export interface MeetupResponse {
  meetupId: string;
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
  rsvp: Rsvp;
  location: LocationResponse;
  presentations?: PresentationResponse[];
}

export interface Rsvp {
  totalSpots: number;
  rsvpYesCount: number;
  rsvpNoCount: number;
  rsvpWaitlistCount: number;
  attendanceCount: number;
}

export interface LocationResponse {
  locationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LocationRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AddLocationResponse {
  locationId: string;
}

export interface PresentationResponse {
  presentationId: string;
  title: string;
  abstract: string;
  speakers: SpeakerResponse[];
}

export interface PresentationRequest {
  title: string;
  description: string;
  speakerId: string;
}

export interface AddPresentationResponse {
  presentationId: string;
}

export interface SpeakerResponse {
  speakerId: string;
  name: string;
  company: string;
  email: string;
  twitterUrl: string;
  gitHubUrl: string;
  linkedInUrl: string;
  blogUrl: string;
  thumbnailUrl: string;
  bio: string;
}

export interface RsvpResponse {
  meetupId: string;
  startUtc: string;
  rsvpYesCount: number;
  rsvpNoCount: number;
  rsvpWaitlistCount: number;
  totalSpots: number;
}

export interface SpeakerRequest {
  fullName: string;
  company?: string;
  email: string;
  twitterUrl?: string;
  gitHubUrl?: string;
  linkedInUrl?: string;
  blogUrl?: string;
  thumbnailUrl?: string;
  bio?: string;
  isPrimaryBiography?: boolean;
}

export interface AddSpeakerResponse {
  speakerId: string;
}

export interface MeetupResponse {
  meetupId: string;
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
  status: string;
  rsvp: Rsvp;
  location: LocationResponse;
  presentations?: PresentationResponse[];
}

export interface MeetupRequest {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
  status: 'Scheduled' | 'Published' | 'Cancelled' | 'Completed';
  totalSpots: number;
  locationId: string;
}

export interface AddMeetupResponse {
  meetupId: string;
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
  maxCapacity?: number;
  isActive: boolean;
}

export interface LocationDetailedResponse extends LocationResponse {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  description: string;
  link: string;  
}

export interface LocationRequest {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  description: string;
  link: string;
  maxCapacity?: number;
  isActive: boolean;
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
  abstract: string;
  speakerId: string;
}

export interface AddPresentationResponse {
  presentationId: string;
}

export interface Biography {
  biographyId: string;
  content: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface BiographyResponse {
  speakerBiographyId: string;
  title?: string;
  biography: string;
  isPrimary: boolean;
}

export interface SpeakerResponse {
  speakerId: string;
  fullName: string;
  company: string;
  email: string;
  twitterUrl: string;
  gitHubUrl: string;
  linkedInUrl: string;
  blogUrl: string;
  thumbnailUrl: string;
  bio: string;
  biographies?: Biography[];
}

export interface RsvpResponse {
  meetupId: string;
  startUtc: string;
  rsvpYesCount: number;
  rsvpNoCount: number;
  rsvpWaitlistCount: number;
  totalSpots: number;
}

export interface UpdateRsvpRequest {
  totalSpots: number;
  rsvpYesCount: number;
  rsvpNoCount: number;
  rsvpWaitlistCount: number;
  attendanceCount: number;
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
  // bio?: string;
  // isPrimaryBiography?: boolean;
}

export interface BiographyRequest {
  title?: string;
  biography: string;
  isPrimary: boolean;
}

export interface AddSpeakerResponse {
  speakerId: string;
}

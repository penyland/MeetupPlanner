import type { MeetupResponse, RsvpResponse } from '../types';
import { apiClient } from './apiClient';

export class MeetupsService {
  static async getAllMeetups(): Promise<MeetupResponse[]> {
    const response = await apiClient.get<MeetupResponse[]>('/api/meetupplanner/meetups');
    return response.data;
  }

  static async getScheduledMeetups(): Promise<MeetupResponse[]> {
    const response = await apiClient.get<MeetupResponse[]>('/api/meetupplanner/meetups?status=scheduled');
    return response.data;
  }

  static async getMeetupById(meetupId: string): Promise<MeetupResponse> {
    const response = await apiClient.get<MeetupResponse>(`/api/meetupplanner/meetups/${meetupId}`);
    return response.data;
  }

  static async getRsvps(): Promise<RsvpResponse[]> {
    const response = await apiClient.get<RsvpResponse[]>('/api/meetupplanner/meetups/rsvps');
    return response.data;
  }

  static async deleteMeetup(meetupId: string): Promise<void> {
    await apiClient.delete(`/api/meetupplanner/meetups/${meetupId}`);
  }
}

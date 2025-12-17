import { apiClient } from './apiClient';
import type { SpeakerResponse, SpeakerRequest, AddSpeakerResponse, BiographyResponse, PresentationResponse } from '../types';

export class SpeakersService {
  static async getAllSpeakers(): Promise<SpeakerResponse[]> {
    const response = await apiClient.get<SpeakerResponse[]>('/api/meetupplanner/speakers');
    return response.data;
  }

  static async getSpeakerById(speakerId: string): Promise<SpeakerResponse> {
    const response = await apiClient.get<SpeakerResponse>(`/api/meetupplanner/speakers/${speakerId}`);
    return response.data;
  }

  static async addSpeaker(speaker: SpeakerRequest): Promise<string> {
    const response = await apiClient.post<AddSpeakerResponse>('/api/meetupplanner/speakers', speaker);
    return response.data.speakerId;
  }

  static async updateSpeaker(speakerId: string, speaker: SpeakerRequest): Promise<void> {
    await apiClient.put(`/api/meetupplanner/speakers/${speakerId}`, speaker);
  }

  static async deleteSpeaker(speakerId: string): Promise<void> {
    await apiClient.delete(`/api/meetupplanner/speakers/${speakerId}`);
  }

  static async getSpeakerBiographies(speakerId: string): Promise<BiographyResponse[]> {
    const response = await apiClient.get<BiographyResponse[]>(`/api/meetupplanner/speakers/${speakerId}/biographies`);
    return response.data;
  }

  static async getSpeakerPresentations(speakerId: string): Promise<PresentationResponse[]> {
    const response = await apiClient.get<PresentationResponse[]>(`/api/meetupplanner/speakers/${speakerId}/presentations`);
    return response.data;
  }
}

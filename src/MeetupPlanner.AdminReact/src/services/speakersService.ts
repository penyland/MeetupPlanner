import { apiClient } from './apiClient';
import type { SpeakerResponse, SpeakerRequest, AddSpeakerResponse } from '../types';

export class SpeakersService {
  static async getAllSpeakers(): Promise<SpeakerResponse[]> {
    const response = await apiClient.get<SpeakerResponse[]>('/meetupplanner/speakers');
    return response.data;
  }

  static async addSpeaker(speaker: SpeakerRequest): Promise<string> {
    const response = await apiClient.post<AddSpeakerResponse>('/meetupplanner/speakers', speaker);
    return response.data.speakerId;
  }
}

import { apiClient } from './apiClient';
import type { PresentationResponse, PresentationRequest, AddPresentationResponse } from '../types';

export class PresentationsService {
  static async getAllPresentations(): Promise<PresentationResponse[]> {
    const response = await apiClient.get<PresentationResponse[]>('/api/meetupplanner/presentations');
    return response.data;
  }

  static async getPresentationById(presentationId: string): Promise<PresentationResponse> {
    const response = await apiClient.get<PresentationResponse>(`/api/meetupplanner/presentations/${presentationId}`);
    return response.data;
  }

  static async addPresentation(presentation: PresentationRequest): Promise<string> {
    const response = await apiClient.post<AddPresentationResponse>('/api/meetupplanner/presentations', presentation);
    return response.data.presentationId;
  }

  static async updatePresentation(presentationId: string, presentation: PresentationRequest): Promise<void> {
    await apiClient.put(`/api/meetupplanner/presentations/${presentationId}`, presentation);
  }

  static async deletePresentation(presentationId: string): Promise<void> {
    await apiClient.delete(`/api/meetupplanner/presentations/${presentationId}`);
  }
}

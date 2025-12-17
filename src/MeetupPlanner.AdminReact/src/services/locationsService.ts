import { apiClient } from './apiClient';
import type { LocationResponse, LocationRequest, AddLocationResponse, LocationDetailedResponse } from '../types';

export class LocationsService {
  static async getAllLocations(): Promise<LocationResponse[]> {
    const response = await apiClient.get<LocationResponse[]>('/api/meetupplanner/locations');
    return response.data;
  }

  static async getLocationById(locationId: string): Promise<LocationDetailedResponse> {
    const response = await apiClient.get<LocationDetailedResponse>(`/api/meetupplanner/locations/${locationId}`);
    return response.data;
  }

  static async addLocation(location: LocationRequest): Promise<string> {
    const response = await apiClient.post<AddLocationResponse>('/api/meetupplanner/locations', location);
    return response.data.locationId;
  }

  static async updateLocation(locationId: string, location: LocationRequest): Promise<void> {
    await apiClient.put(`/api/meetupplanner/locations/${locationId}`, location);
  }

  static async deleteLocation(locationId: string): Promise<void> {
    await apiClient.delete(`/api/meetupplanner/locations/${locationId}`);
  }
}

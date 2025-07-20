import { apiClient } from './base';
import { CGMDataResponse, CurrentGlucose } from '@/types';

export class CGMApi {
  // Get current glucose reading with trend information
  async getCurrentGlucose(): Promise<CurrentGlucose> {
    return apiClient.get<CurrentGlucose>('/api/cgm/current');
  }

  // Get historical CGM data for specified time period
  async getCGMData(hours: number = 24): Promise<CGMDataResponse> {
    // Validate hours parameter
    if (hours < 1 || hours > 168) {
      throw new Error('Hours must be between 1 and 168 (1 week)');
    }

    return apiClient.get<CGMDataResponse>(`/api/cgm/data?hours=${hours}`);
  }

  // Get connection status and data availability
  async getStatus(): Promise<{
    status: 'connected' | 'no_recent_data' | 'error';
    last_reading_count: number;
    message: string;
  }> {
    return apiClient.get('/api/cgm/status');
  }

  // Get analysis data for specific period
  async getAnalysis(period: '24h' | 'week' | 'month'): Promise<any> {
    return apiClient.get(`/api/cgm/analysis/${period}`);
  }

  // Test CGM data connection
  async testConnection(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.status === 'connected';
    } catch (error) {
      console.error('❌ CGM connection test failed:', error);
      return false;
    }
  }

  // Get recent readings for quick status check
  async getRecentReadings(limit: number = 10): Promise<CGMDataResponse> {
    // Get last hour of data, which should contain recent readings
    const data = await this.getCGMData(1);
    
    // Limit the results if requested
    if (data.data.length > limit) {
      data.data = data.data.slice(-limit);
    }
    
    return data;
  }
}

// Export singleton instance
export const cgmApi = new CGMApi();
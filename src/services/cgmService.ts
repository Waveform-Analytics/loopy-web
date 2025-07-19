/**
 * CGM data service layer
 * 
 * Handles all CGM-related API calls with proper error handling and data transformation
 */

import { ApiClient } from './apiClient';
import { 
  CGMReading, 
  CurrentGlucose, 
  CGMDataResponse, 
  CGMAnalysis,
  AppError,
  createAppError 
} from '../types';

/**
 * CGM service options
 */
export interface CGMServiceOptions {
  /** Hours of historical data to fetch */
  hours?: number;
  /** Include analysis data */
  includeAnalysis?: boolean;
  /** Data source filter */
  device?: string;
}

/**
 * Health status response
 */
export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  version?: string;
  uptime?: number;
}

/**
 * CGM Service class for managing glucose data
 */
export class CGMService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get current glucose reading
   */
  async getCurrentGlucose(): Promise<CurrentGlucose> {
    try {
      const response = await this.apiClient.get<CurrentGlucose>('/api/cgm/current');
      
      // Validate response data
      if (!this.isValidCurrentGlucose(response)) {
        throw createAppError(
          'INVALID_DATA',
          'Invalid current glucose data received from API',
          'CGMService.getCurrentGlucose',
          { response }
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError from apiClient
      }
      
      throw createAppError(
        'FETCH_ERROR',
        'Failed to fetch current glucose data',
        'CGMService.getCurrentGlucose',
        { originalError: error }
      );
    }
  }

  /**
   * Get historical CGM data
   */
  async getCGMData(options: CGMServiceOptions = {}): Promise<CGMDataResponse> {
    const { hours = 24, includeAnalysis = true, device } = options;
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        hours: hours.toString(),
      });
      
      if (device) {
        params.append('device', device);
      }
      
      if (includeAnalysis) {
        params.append('analysis', 'true');
      }

      const url = `/api/cgm/data?${params.toString()}`;
      const response = await this.apiClient.get<CGMDataResponse>(url);
      
      // Validate and process response data
      if (!this.isValidCGMDataResponse(response)) {
        throw createAppError(
          'INVALID_DATA',
          'Invalid CGM data received from API',
          'CGMService.getCGMData',
          { response, options }
        );
      }

      // Sort data by timestamp (oldest first)
      response.data = response.data.sort((a, b) => {
        const dateA = new Date(a.dateString || a.datetime);
        const dateB = new Date(b.dateString || b.datetime);
        return dateA.getTime() - dateB.getTime();
      });

      // Filter out invalid readings
      response.data = response.data.filter(reading => 
        this.isValidGlucoseReading(reading.sgv)
      );

      return response;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError from apiClient
      }
      
      throw createAppError(
        'FETCH_ERROR',
        'Failed to fetch CGM data',
        'CGMService.getCGMData',
        { originalError: error, options }
      );
    }
  }

  /**
   * Get CGM analysis for a specific time period
   */
  async getCGMAnalysis(hours: number = 24): Promise<CGMAnalysis> {
    try {
      const response = await this.apiClient.get<CGMAnalysis>(`/api/cgm/analysis/${hours}`);
      return response;
    } catch (error) {
      // If analysis endpoint doesn't exist, calculate from data
      if (error instanceof Error && 'code' in error && error.code === 'NOT_FOUND') {
        console.warn('⚠️ Analysis endpoint not found, calculating from data...');
        return this.calculateAnalysisFromData(hours);
      }
      
      throw createAppError(
        'FETCH_ERROR',
        'Failed to fetch CGM analysis',
        'CGMService.getCGMAnalysis',
        { originalError: error, hours }
      );
    }
  }

  /**
   * Test API connection and service status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await this.apiClient.get<HealthStatus>('/api/health');
      return response;
    } catch (error) {
      throw createAppError(
        'HEALTH_CHECK_FAILED',
        'Failed to check service health',
        'CGMService.getHealthStatus',
        { originalError: error }
      );
    }
  }

  /**
   * Get latest data timestamp
   */
  async getLastUpdateTime(): Promise<Date> {
    try {
      const current = await this.getCurrentGlucose();
      return new Date(current.timestamp);
    } catch (error) {
      throw createAppError(
        'FETCH_ERROR',
        'Failed to get last update time',
        'CGMService.getLastUpdateTime',
        { originalError: error }
      );
    }
  }

  /**
   * Calculate analysis from raw CGM data (fallback)
   */
  private async calculateAnalysisFromData(hours: number): Promise<CGMAnalysis> {
    try {
      const { data } = await this.getCGMData({ hours, includeAnalysis: false });
      
      if (data.length === 0) {
        return {
          time_in_range: { in_range: 0, above_range: 0, below_range: 0 },
          average_glucose: 0,
          glucose_variability: 0,
        };
      }

      const glucoseValues = data.map(reading => reading.sgv);
      const totalReadings = glucoseValues.length;
      
      // Calculate time in range
      const inRange = glucoseValues.filter(g => g >= 70 && g <= 180).length;
      const aboveRange = glucoseValues.filter(g => g > 180).length;
      const belowRange = glucoseValues.filter(g => g < 70).length;
      
      // Calculate average
      const average = glucoseValues.reduce((sum, g) => sum + g, 0) / totalReadings;
      
      // Calculate standard deviation (glucose variability)
      const variance = glucoseValues.reduce((sum, g) => sum + Math.pow(g - average, 2), 0) / totalReadings;
      const stdDev = Math.sqrt(variance);
      
      return {
        time_in_range: {
          in_range: Math.round((inRange / totalReadings) * 100),
          above_range: Math.round((aboveRange / totalReadings) * 100),
          below_range: Math.round((belowRange / totalReadings) * 100),
        },
        average_glucose: Math.round(average),
        glucose_variability: Math.round(stdDev),
        standard_deviation: stdDev,
        coefficient_of_variation: Math.round((stdDev / average) * 100),
      };
    } catch (error) {
      throw createAppError(
        'CALCULATION_ERROR',
        'Failed to calculate CGM analysis',
        'CGMService.calculateAnalysisFromData',
        { originalError: error, hours }
      );
    }
  }

  /**
   * Validate current glucose data
   */
  private isValidCurrentGlucose(data: any): data is CurrentGlucose {
    return (
      data &&
      typeof data === 'object' &&
      (data.current_glucose === null || typeof data.current_glucose === 'number') &&
      typeof data.direction === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.minutes_ago === 'number'
    );
  }

  /**
   * Validate CGM data response
   */
  private isValidCGMDataResponse(data: any): data is CGMDataResponse {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.data) &&
      typeof data.last_updated === 'string' &&
      data.data.every((reading: any) => this.isValidCGMReading(reading))
    );
  }

  /**
   * Validate individual CGM reading
   */
  private isValidCGMReading(reading: any): reading is CGMReading {
    return (
      reading &&
      typeof reading === 'object' &&
      (typeof reading.datetime === 'string' || typeof reading.dateString === 'string') &&
      typeof reading.sgv === 'number' &&
      typeof reading.direction === 'string' &&
      this.isValidGlucoseReading(reading.sgv)
    );
  }

  /**
   * Validate glucose reading value
   */
  private isValidGlucoseReading(glucose: number): boolean {
    return glucose >= 20 && glucose <= 600; // Reasonable bounds for glucose values
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return this.apiClient.getConfig();
  }

  /**
   * Test connection to CGM service
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      console.error('❌ CGM service connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create default CGM service instance
 */
export function createCGMService(apiClient: ApiClient): CGMService {
  return new CGMService(apiClient);
}
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '../../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://loopy-api-production.up.railway.app';
const API_KEY = process.env.REACT_APP_API_KEY;


class BaseApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
      },
    });

    // Request interceptor for logging and additional headers
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error);
        
        // Convert axios errors to our ApiError format
        const appError: ApiError = {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
          timestamp: new Date().toISOString(),
        };

        return Promise.reject(appError);
      }
    );
  }

  // Generic GET method with retry logic
  async get<T>(url: string, config?: AxiosRequestConfig, retries = 3): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying API call. ${retries} attempts remaining.`);
        await this.delay(1000); // Wait 1 second before retry
        return this.get<T>(url, config, retries - 1);
      }
      throw error;
    }
  }

  // Generic POST method
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; message?: string }> {
    return this.get('/api/health');
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('🔌 Connection test failed:', error);
      return false;
    }
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const apiClient = new BaseApiClient();
/**
 * Base API client with authentication, error handling, and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, AppError, createAppError } from '../types';

/**
 * API client configuration
 */
interface ApiClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Request retry configuration
 */
interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: boolean;
}

/**
 * Enhanced API client with authentication and error handling
 */
export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private retryConfig: RetryConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.retryConfig = {
      attempts: this.config.retryAttempts || 3,
      delay: this.config.retryDelay || 1000,
      backoff: true,
    };

    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🚨 API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('🚨 API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request with retry logic
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.get<T>(url, config));
  }

  /**
   * Generic POST request with retry logic
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.post<T>(url, data, config));
  }

  /**
   * Generic PUT request with retry logic
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.put<T>(url, data, config));
  }

  /**
   * Generic DELETE request with retry logic
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.delete<T>(url, config));
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    request: () => Promise<AxiosResponse<T>>
  ): Promise<T> {
    let lastError: AxiosError;
    
    for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
      try {
        const response = await request();
        return response.data;
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry on certain error codes
        if (this.shouldNotRetry(lastError)) {
          break;
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryConfig.attempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.retryConfig.backoff 
          ? this.retryConfig.delay * Math.pow(2, attempt - 1)
          : this.retryConfig.delay;
        
        console.warn(`🔄 Retry attempt ${attempt}/${this.retryConfig.attempts} after ${delay}ms`);
        await this.sleep(delay);
      }
    }
    
    // All retries failed, throw enhanced error
    throw this.enhanceError(lastError!);
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: AxiosError): boolean {
    if (!error.response) {
      return false; // Network errors should be retried
    }
    
    const status = error.response.status;
    
    // Don't retry client errors (4xx) except for specific cases
    if (status >= 400 && status < 500) {
      // Retry on 408 (timeout), 429 (rate limit)
      return ![408, 429].includes(status);
    }
    
    return false; // Retry server errors (5xx) and other cases
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(error: AxiosError): AppError {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const responseData = error.response?.data;
    
    let message = 'Network request failed';
    let code = 'NETWORK_ERROR';
    
    if (status) {
      switch (status) {
        case 401:
          code = 'UNAUTHORIZED';
          message = 'Invalid API key or authentication failed';
          break;
        case 403:
          code = 'FORBIDDEN';
          message = 'Access denied';
          break;
        case 404:
          code = 'NOT_FOUND';
          message = 'API endpoint not found';
          break;
        case 429:
          code = 'RATE_LIMITED';
          message = 'Too many requests, please try again later';
          break;
        case 500:
          code = 'SERVER_ERROR';
          message = 'Internal server error';
          break;
        case 502:
        case 503:
        case 504:
          code = 'SERVICE_UNAVAILABLE';
          message = 'Service temporarily unavailable';
          break;
        default:
          code = `HTTP_${status}`;
          message = `Request failed with status ${status}: ${statusText}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT';
      message = 'Request timed out';
    } else if (error.code === 'ERR_NETWORK') {
      code = 'NETWORK_ERROR';
      message = 'Network connection failed';
    }
    
    return createAppError(code, message, 'ApiClient', {
      originalError: error.message,
      status,
      statusText,
      responseData,
      url: error.config?.url,
      method: error.config?.method,
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/api/health');
      return true;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ApiClientConfig> {
    return { ...this.config };
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }
}

/**
 * Create default API client instance
 */
export function createApiClient(): ApiClient {
  const config: ApiClientConfig = {
    baseURL: process.env.REACT_APP_API_URL || 'https://loopy-api-production.up.railway.app',
    apiKey: process.env.REACT_APP_API_KEY || '',
    timeout: 15000, // 15 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  };

  if (!config.apiKey) {
    console.warn('⚠️ No API key configured. Set REACT_APP_API_KEY environment variable.');
  }

  return new ApiClient(config);
}

// Export singleton instance
export const apiClient = createApiClient();
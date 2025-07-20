import axios, { AxiosResponse, AxiosError } from 'axios';
import { CGMDataResponse, CurrentReading, NormalizedCurrentReading, HistoricalDataResponse, HistoricalDataPoint, HealthCheckResponse, TimeRange, CGMReading } from '../types';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://loopy-api-production.up.railway.app';
const API_TOKEN = process.env.REACT_APP_API_TOKEN;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
  },
  timeout: 10000,
});

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return !error.response || error.response.status >= 500;
  },
};

async function retryRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: AxiosError | Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      lastError = error as AxiosError;

      if (attempt === config.maxRetries) {
        break;
      }

      if (config.retryCondition && !config.retryCondition(lastError as AxiosError)) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, config.retryDelay * (attempt + 1)));
    }
  }

  throw lastError!;
}

function normalizeTrend(direction: string, trend: number): 'up' | 'down' | 'stable' {
  if (direction.toLowerCase().includes('up') || trend > 4) return 'up';
  if (direction.toLowerCase().includes('down') || trend < 4) return 'down';
  return 'stable';
}

function normalizeCurrentReading(apiReading: CurrentReading): NormalizedCurrentReading {
  return {
    timestamp: apiReading.timestamp,
    value: apiReading.current_glucose,
    trend: normalizeTrend(apiReading.direction, apiReading.trend),
    device: apiReading.device,
    lastUpdated: apiReading.timestamp,
    status: apiReading.minutes_ago < 10 ? 'active' : 'inactive',
  };
}

function normalizeHistoricalData(apiData: HistoricalDataPoint[]): CGMDataResponse {
  const readings: CGMReading[] = apiData.map(point => ({
    timestamp: point.dateString,
    value: point.sgv,
    trend: normalizeTrend(point.direction, point.trend),
    device: point.device,
  }));

  const timestamps = readings.map(r => new Date(r.timestamp).getTime());
  const startTime = Math.min(...timestamps);
  const endTime = Math.max(...timestamps);
  const hours = Math.round((endTime - startTime) / (1000 * 60 * 60));

  return {
    readings,
    totalCount: readings.length,
    timeRange: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
      hours: Math.max(1, hours),
    },
  };
}

export const cgmApi = {
  async healthCheck(): Promise<HealthCheckResponse> {
    return retryRequest(() => apiClient.get<HealthCheckResponse>('/api/health'));
  },

  async getCurrentReading(): Promise<NormalizedCurrentReading> {
    const response = await retryRequest(() => apiClient.get<CurrentReading>('/api/cgm/current'));
    return normalizeCurrentReading(response);
  },

  async getHistoricalData(timeRange: TimeRange): Promise<CGMDataResponse> {
    const hours = parseInt(timeRange.replace('h', ''));
    const response = await retryRequest(() => 
      apiClient.get<HistoricalDataResponse>(`/api/cgm/data?hours=${hours}`)
    );
    return normalizeHistoricalData(response.data);
  },
};

export default cgmApi;
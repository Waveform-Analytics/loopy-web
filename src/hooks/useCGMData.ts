import { useState, useEffect, useCallback, useRef } from 'react';
import { NormalizedCurrentReading, CGMDataResponse, TimeRange, ApiError } from '../types';
import { cgmApi } from '../services/api';

interface UseCGMDataResult {
  currentReading: NormalizedCurrentReading | null;
  historicalData: CGMDataResponse | null;
  loading: {
    current: boolean;
    historical: boolean;
  };
  error: {
    current: ApiError | null;
    historical: ApiError | null;
  };
  refreshCurrent: () => Promise<void>;
  refreshHistorical: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  timeRange: TimeRange;
}

export function useCGMData(initialTimeRange: TimeRange = '24h'): UseCGMDataResult {
  const [currentReading, setCurrentReading] = useState<NormalizedCurrentReading | null>(null);
  const [historicalData, setHistoricalData] = useState<CGMDataResponse | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  
  const [loading, setLoading] = useState({
    current: false,
    historical: false,
  });
  
  const [error, setError] = useState<{
    current: ApiError | null;
    historical: ApiError | null;
  }>({
    current: null,
    historical: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const createApiError = (error: any): ApiError => ({
    message: error.response?.data?.message || error.message || 'Unknown error',
    status: error.response?.status || 0,
    code: error.response?.data?.code,
    timestamp: new Date().toISOString(),
  });

  const refreshCurrent = useCallback(async () => {
    setLoading(prev => ({ ...prev, current: true }));
    setError(prev => ({ ...prev, current: null }));

    try {
      const data = await cgmApi.getCurrentReading();
      setCurrentReading(data);
    } catch (err) {
      const apiError = createApiError(err);
      setError(prev => ({ ...prev, current: apiError }));
      console.error('Failed to fetch current reading:', apiError);
    } finally {
      setLoading(prev => ({ ...prev, current: false }));
    }
  }, []);

  const refreshHistorical = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(prev => ({ ...prev, historical: true }));
    setError(prev => ({ ...prev, historical: null }));

    try {
      const data = await cgmApi.getHistoricalData(timeRange);
      setHistoricalData(data);
    } catch (err) {
      // Don't set error if request was aborted
      if ((err as any).name !== 'CanceledError') {
        const apiError = createApiError(err);
        setError(prev => ({ ...prev, historical: apiError }));
        console.error('Failed to fetch historical data:', apiError);
      }
    } finally {
      setLoading(prev => ({ ...prev, historical: false }));
    }
  }, [timeRange]);

  // Initial data fetch
  useEffect(() => {
    refreshCurrent();
    refreshHistorical();
  }, [refreshCurrent, refreshHistorical]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    currentReading,
    historicalData,
    loading,
    error,
    refreshCurrent,
    refreshHistorical,
    setTimeRange,
    timeRange,
  };
}
import { useState, useEffect, useCallback } from 'react';
import { CGMDataResponse, CurrentGlucose, LoadingState, AppError } from '../types';
import { api } from '../services/api';
// TODO: Enable smart polling in future iteration
// import { SmartPollingAnalyzer, PollingStrategy } from '../utils/smartPolling';

interface UseCGMDataOptions {
  hours?: number;
  refreshInterval?: number; // This will be used as fallback, smart polling will override
  autoRefresh?: boolean;
  enableSmartPolling?: boolean;
}

interface UseCGMDataReturn {
  // Data
  cgmData: CGMDataResponse | null;
  currentGlucose: CurrentGlucose | null;
  
  // State
  loading: LoadingState;
  error: AppError | null;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useCGMData = (options: UseCGMDataOptions = {}): UseCGMDataReturn => {
  const {
    hours = 24,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    autoRefresh = true
  } = options;

  // State
  const [cgmData, setCgmData] = useState<CGMDataResponse | null>(null);
  const [currentGlucose, setCurrentGlucose] = useState<CurrentGlucose | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading('loading');
      setError(null);

      console.log(`🔄 Fetching CGM data (${hours}h)...`);

      // Fetch both current and historical data in parallel
      const [historicalData, currentData] = await Promise.all([
        api.cgm.getCGMData(hours),
        api.cgm.getCurrentGlucose()
      ]);

      setCgmData(historicalData);
      setCurrentGlucose(currentData);
      setLastUpdated(new Date());
      setLoading('success');

      console.log(`✅ CGM data loaded: ${historicalData.data.length} readings`);

    } catch (err: any) {
      console.error('❌ Failed to fetch CGM data:', err);
      
      const appError: AppError = {
        code: err.code || 'FETCH_ERROR',
        message: err.message || 'Failed to fetch CGM data',
        details: err.details,
        timestamp: new Date()
      };
      
      setError(appError);
      setLoading('error');
    }
  }, [hours]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    if (loading === 'error') {
      setLoading('idle');
    }
  }, [loading]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing CGM data...');
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setLoading('idle');
      setError(null);
    };
  }, []);

  return {
    cgmData,
    currentGlucose,
    loading,
    error,
    lastUpdated,
    refresh,
    clearError
  };
};
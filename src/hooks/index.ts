/**
 * Barrel exports for all custom React hooks
 * 
 * This allows clean imports like:
 * import { useChartState, useCGMData } from '../hooks';
 */

import { useMemo } from 'react';
import { useChartState } from './useChartState';
import { useCGMData } from './useCGMData';

// Chart state management hooks
export { useChartState, useChartPreferences } from './useChartState';
export type { 
  UseChartStateOptions, 
  UseChartStateReturn,
  UseChartPreferencesOptions,
  UseChartPreferencesReturn 
} from './useChartState';

// CGM data fetching hooks
export { useCGMData, useRealtimeCGM } from './useCGMData';
export type { 
  UseCGMDataOptions, 
  UseCGMDataReturn,
  UseRealtimeCGMOptions 
} from './useCGMData';

/**
 * Commonly used hook combinations
 */

/**
 * Combined hook for CGM chart with state management
 */
export interface UseCGMChartOptions {
  /** Default time range */
  defaultTimeRange?: '1h' | '3h' | '6h' | '12h' | '24h';
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Chart height */
  height?: number;
  /** Whether to fetch data on mount */
  fetchOnMount?: boolean;
}

export const useCGMChart = (options: UseCGMChartOptions = {}) => {
  const {
    defaultTimeRange = '3h',
    refreshInterval = 5 * 60 * 1000,
    height = 500,
    fetchOnMount = true,
  } = options;

  // Chart state management
  const chartState = useChartState({
    defaultTimeRange,
    onTimeRangeChange: (range) => {
      console.log(`📊 Time range changed to: ${range}`);
    },
    onUserInteractionChange: (hasInteracted) => {
      console.log(`👆 User interaction: ${hasInteracted ? 'manual' : 'auto'}`);
    },
  });

  // CGM data fetching
  const cgmData = useCGMData({
    hours: chartState.timeRangeConfig.hours,
    refreshInterval,
    fetchOnMount,
    onError: (error) => {
      chartState.setError(error.message);
    },
    onDataUpdate: () => {
      chartState.setError(null);
    },
  });

  // Combined loading state
  const isLoading = useMemo(() => {
    return chartState.chartState.isLoading || cgmData.loadingState === 'loading';
  }, [chartState.chartState.isLoading, cgmData.loadingState]);

  // Combined error state
  const error = useMemo(() => {
    return chartState.chartState.error || cgmData.error?.message || null;
  }, [chartState.chartState.error, cgmData.error]);

  return {
    // Chart state
    ...chartState,
    
    // CGM data
    data: cgmData.data,
    currentGlucose: cgmData.currentGlucose,
    dataQuality: cgmData.dataQuality,
    lastFetch: cgmData.lastFetch,
    refreshData: cgmData.refresh,
    
    // Combined state
    isLoading,
    error,
    
    // Convenience methods
    isReady: cgmData.data.length > 0 && !isLoading && !error,
    isEmpty: cgmData.data.length === 0 && !isLoading,
    hasError: !!error,
  };
};

/**
 * Type for the combined CGM chart hook return
 */
export type UseCGMChartReturn = ReturnType<typeof useCGMChart>;
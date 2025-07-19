/**
 * Chart state management hook
 * 
 * Manages chart display state including time range selection, live mode,
 * user interaction tracking, and auto-scaling behavior
 */

import { useState, useCallback, useMemo } from 'react';
import { TimeRange, ChartState } from '../types';

/**
 * Chart state hook options
 */
export interface UseChartStateOptions {
  /** Default time range */
  defaultTimeRange?: TimeRange;
  /** Initial time range (alias for defaultTimeRange) */
  initialTimeRange?: TimeRange;
  /** Default live mode state */
  defaultIsLiveMode?: boolean;
  /** Initial live mode (alias for defaultIsLiveMode) */
  initialLiveMode?: boolean;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Callback when live mode toggles */
  onLiveModeChange?: (isLive: boolean) => void;
  /** Callback when user interaction state changes */
  onUserInteractionChange?: (hasInteracted: boolean) => void;
}

/**
 * Chart state hook return type
 */
export interface UseChartStateReturn {
  /** Current chart state */
  chartState: ChartState;
  /** Currently selected time range */
  selectedTimeRange: TimeRange;
  /** Whether live mode is enabled */
  isLiveMode: boolean;
  /** Whether user has manually interacted with chart */
  userHasInteracted: boolean;
  /** Update time range and reset user interaction */
  updateTimeRange: (newRange: TimeRange) => void;
  /** Set selected time range */
  setSelectedTimeRange: (newRange: TimeRange) => void;
  /** Toggle live mode */
  toggleLiveMode: () => void;
  /** Set live mode */
  setLiveMode: (isLive: boolean) => void;
  /** Mark that user has manually interacted with chart */
  setUserInteracted: () => void;
  /** Set user interaction state */
  setUserHasInteracted: (hasInteracted: boolean) => void;
  /** Reset user interaction flag (enables auto-scaling) */
  resetUserInteraction: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Reset all state to defaults */
  resetState: () => void;
  /** Check if auto-scaling should be enabled */
  shouldAutoScale: boolean;
  /** Get time range configuration */
  timeRangeConfig: {
    hours: number;
    label: string;
    ticks: number;
  };
}

/**
 * Custom hook for managing chart state
 */
export const useChartState = (options: UseChartStateOptions = {}): UseChartStateReturn => {
  const {
    defaultTimeRange = '3h',
    initialTimeRange,
    defaultIsLiveMode = true,
    initialLiveMode,
    onTimeRangeChange,
    onLiveModeChange,
    onUserInteractionChange,
  } = options;

  // Use initial values if provided, otherwise defaults
  const timeRange = initialTimeRange || defaultTimeRange;
  const liveMode = initialLiveMode !== undefined ? initialLiveMode : defaultIsLiveMode;

  // Chart state
  const [chartState, setChartState] = useState<ChartState>({
    selectedTimeRange: timeRange,
    isLiveMode: liveMode,
    userHasInteracted: false,
    isLoading: false,
    error: null,
  });

  // Time range configuration
  const timeRangeConfig = useMemo(() => {
    const configMap = {
      '1h': { hours: 1, label: '1 Hour', ticks: 4 },
      '3h': { hours: 3, label: '3 Hours', ticks: 6 },
      '6h': { hours: 6, label: '6 Hours', ticks: 6 },
      '12h': { hours: 12, label: '12 Hours', ticks: 8 },
      '24h': { hours: 24, label: '24 Hours', ticks: 8 },
    };
    return configMap[chartState.selectedTimeRange];
  }, [chartState.selectedTimeRange]);

  // Should auto-scale (when user hasn't manually interacted)
  const shouldAutoScale = useMemo(() => {
    return !chartState.userHasInteracted;
  }, [chartState.userHasInteracted]);

  // Update time range
  const updateTimeRange = useCallback((newRange: TimeRange) => {
    setChartState(prev => ({
      ...prev,
      selectedTimeRange: newRange,
      userHasInteracted: false, // Reset user interaction on time range change
      error: null, // Clear any previous errors
    }));
    
    // Call external callback
    onTimeRangeChange?.(newRange);
    onUserInteractionChange?.(false);
  }, [onTimeRangeChange, onUserInteractionChange]);

  // Toggle live mode
  const toggleLiveMode = useCallback(() => {
    setChartState(prev => {
      const newLiveMode = !prev.isLiveMode;
      
      // Call external callback
      onLiveModeChange?.(newLiveMode);
      
      return {
        ...prev,
        isLiveMode: newLiveMode,
        userHasInteracted: false, // Reset interaction when toggling live mode
        error: null,
      };
    });
    
    onUserInteractionChange?.(false);
  }, [onLiveModeChange, onUserInteractionChange]);

  // Set user has interacted (disables auto-scaling)
  const setUserInteracted = useCallback(() => {
    setChartState(prev => {
      if (prev.userHasInteracted) return prev; // Avoid unnecessary re-renders
      
      onUserInteractionChange?.(true);
      
      return {
        ...prev,
        userHasInteracted: true,
      };
    });
  }, [onUserInteractionChange]);

  // Reset user interaction (enables auto-scaling)
  const resetUserInteraction = useCallback(() => {
    setChartState(prev => {
      if (!prev.userHasInteracted) return prev; // Avoid unnecessary re-renders
      
      onUserInteractionChange?.(false);
      
      return {
        ...prev,
        userHasInteracted: false,
      };
    });
  }, [onUserInteractionChange]);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setChartState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting to load
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setChartState(prev => ({
      ...prev,
      error,
      isLoading: false, // Stop loading when error occurs
    }));
  }, []);

  // Reset all state to defaults
  const resetState = useCallback(() => {
    const newState: ChartState = {
      selectedTimeRange: defaultTimeRange,
      isLiveMode: defaultIsLiveMode,
      userHasInteracted: false,
      isLoading: false,
      error: null,
    };
    
    setChartState(newState);
    
    // Call callbacks to notify of reset
    onTimeRangeChange?.(defaultTimeRange);
    onLiveModeChange?.(defaultIsLiveMode);
    onUserInteractionChange?.(false);
  }, [defaultTimeRange, defaultIsLiveMode, onTimeRangeChange, onLiveModeChange, onUserInteractionChange]);

  // Additional setter functions
  const setSelectedTimeRange = useCallback((newRange: TimeRange) => {
    updateTimeRange(newRange);
  }, [updateTimeRange]);

  const setLiveMode = useCallback((isLive: boolean) => {
    setChartState(prev => ({
      ...prev,
      isLiveMode: isLive,
    }));
    onLiveModeChange?.(isLive);
  }, [onLiveModeChange]);

  const setUserHasInteracted = useCallback((hasInteracted: boolean) => {
    setChartState(prev => ({
      ...prev,
      userHasInteracted: hasInteracted,
    }));
    onUserInteractionChange?.(hasInteracted);
  }, [onUserInteractionChange]);

  return {
    chartState,
    selectedTimeRange: chartState.selectedTimeRange,
    isLiveMode: chartState.isLiveMode,
    userHasInteracted: chartState.userHasInteracted,
    updateTimeRange,
    setSelectedTimeRange,
    toggleLiveMode,
    setLiveMode,
    setUserInteracted,
    setUserHasInteracted,
    resetUserInteraction,
    setLoading,
    setError,
    resetState,
    shouldAutoScale,
    timeRangeConfig,
  };
};

/**
 * Hook for managing chart display preferences
 */
export interface UseChartPreferencesOptions {
  /** Default chart height */
  defaultHeight?: number;
  /** Default mobile optimization */
  defaultIsMobileOptimized?: boolean;
}

export interface UseChartPreferencesReturn {
  /** Chart preferences object */
  preferences: {
    defaultTimeRange: TimeRange;
    enableLiveMode: boolean;
    height: number;
    isMobileOptimized: boolean;
  };
  /** Update preferences */
  updatePreferences: (updates: Partial<UseChartPreferencesReturn['preferences']>) => void;
  /** Chart height */
  height: number;
  /** Mobile optimization enabled */
  isMobileOptimized: boolean;
  /** Update chart height */
  setHeight: (height: number) => void;
  /** Toggle mobile optimization */
  toggleMobileOptimization: () => void;
  /** Auto-detect mobile and adjust settings */
  autoAdjustForDevice: (isMobile: boolean) => void;
}

/**
 * Custom hook for chart display preferences
 */
export const useChartPreferences = (options: UseChartPreferencesOptions = {}): UseChartPreferencesReturn => {
  const {
    defaultHeight = 500,
    defaultIsMobileOptimized = false,
  } = options;

  const [height, setHeight] = useState(defaultHeight);
  const [isMobileOptimized, setIsMobileOptimized] = useState(defaultIsMobileOptimized);
  const [defaultTimeRange, setDefaultTimeRange] = useState<TimeRange>('24h');
  const [enableLiveMode, setEnableLiveMode] = useState(true);

  const preferences = useMemo(() => ({
    defaultTimeRange,
    enableLiveMode,
    height,
    isMobileOptimized,
  }), [defaultTimeRange, enableLiveMode, height, isMobileOptimized]);

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    if (updates.defaultTimeRange !== undefined) setDefaultTimeRange(updates.defaultTimeRange);
    if (updates.enableLiveMode !== undefined) setEnableLiveMode(updates.enableLiveMode);
    if (updates.height !== undefined) setHeight(updates.height);
    if (updates.isMobileOptimized !== undefined) setIsMobileOptimized(updates.isMobileOptimized);
  }, []);

  const toggleMobileOptimization = useCallback(() => {
    setIsMobileOptimized(prev => !prev);
  }, []);

  const autoAdjustForDevice = useCallback((isMobile: boolean) => {
    setIsMobileOptimized(isMobile);
    setHeight(isMobile ? 350 : 500);
  }, []);

  return {
    preferences,
    updatePreferences,
    height,
    isMobileOptimized,
    setHeight,
    toggleMobileOptimization,
    autoAdjustForDevice,
  };
};
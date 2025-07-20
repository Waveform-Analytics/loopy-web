/**
 * CGM Chart Container
 * 
 * Integrates CGMChart with TimeRangeSelector and chart state management hooks
 */

import React from 'react';
import { Box, Stack } from '@mui/material';
import { SimpleCGMChart } from './SimpleCGMChart';
import { TimeRangeSelector } from './TimeRangeSelector';
import { useChartState, useCGMData, useChartPreferences } from '../../hooks';
import { ChartConfig, CGMReading } from '../../types';

/**
 * CGM Chart Container props
 */
export interface CGMChartContainerProps {
  /** Chart height in pixels */
  height?: number;
  /** Chart width (auto-calculated if not provided) */
  width?: number;
  /** Chart configuration overrides */
  config?: Partial<ChartConfig>;
  /** Custom CGM data (overrides auto-fetching) */
  data?: CGMReading[];
  /** Whether to fetch data automatically */
  autoFetch?: boolean;
  /** Data fetch options */
  fetchOptions?: {
    hours?: number;
    refreshInterval?: number;
    includeAnalysis?: boolean;
  };
  /** Whether to show time range selector */
  showTimeRangeSelector?: boolean;
  /** Whether to show target range visualization */
  showTargetRange?: boolean;
  /** Custom target range values */
  targetRange?: { low: number; high: number };
  /** Callback for data point hover */
  onDataPointHover?: (dataPoint: any) => void;
  /** Error callback */
  onError?: (error: any) => void;
}

/**
 * Integrated CGM Chart Container
 */
export const CGMChartContainer: React.FC<CGMChartContainerProps> = ({
  height = 400,
  width,
  config,
  data: customData,
  autoFetch = true,
  fetchOptions = {},
  showTimeRangeSelector = true,
  showTargetRange = true,
  targetRange = { low: 70, high: 180 },
  onDataPointHover,
  onError,
}) => {
  // Chart state management
  const {
    selectedTimeRange,
    isLiveMode,
    userHasInteracted,
    setSelectedTimeRange,
    setLiveMode,
    setUserHasInteracted,
  } = useChartState({
    initialTimeRange: '3h',
    initialLiveMode: true,
  });

  // Chart preferences
  const { preferences, updatePreferences } = useChartPreferences();

  // CGM data fetching (only if autoFetch is true and no custom data)
  const {
    data: fetchedData,
    loadingState,
    error,
    refresh,
    nextRefreshIn,
    clearError,
  } = useCGMData({
    hours: fetchOptions.hours || parseInt(selectedTimeRange.replace('h', '')),
    refreshInterval: isLiveMode ? (fetchOptions.refreshInterval || 5 * 60 * 1000) : 0,
    fetchOnMount: autoFetch && !customData,
    includeAnalysis: fetchOptions.includeAnalysis ?? true,
    onError: (err) => {
      console.error('CGM data fetch error:', err);
      onError?.(err);
    },
  });

  // Filter data based on selected time range
  const chartData = React.useMemo(() => {
    const sourceData = customData || fetchedData;
    if (!sourceData.length) return sourceData;

    // Sort data by time to get the most recent
    const sortedData = [...sourceData].sort((a, b) => {
      const timeA = new Date(a.dateString || a.datetime).getTime();
      const timeB = new Date(b.dateString || b.datetime).getTime();
      return timeB - timeA;
    });

    // Use the most recent data point as reference (not current time)
    const mostRecentTime = new Date(sortedData[0].dateString || sortedData[0].datetime);
    const timeRangeHours = parseInt(selectedTimeRange.replace('h', ''));
    const cutoffTime = new Date(mostRecentTime.getTime() - timeRangeHours * 60 * 60 * 1000);

    // Filter data to selected time range
    return sourceData.filter(reading => {
      const readingTime = new Date(reading.dateString || reading.datetime);
      return readingTime >= cutoffTime && readingTime <= mostRecentTime;
    });
  }, [customData, fetchedData, selectedTimeRange]);

  const isLoading = autoFetch && loadingState === 'loading';
  const errorMessage = error?.message;

  // Handle time range change
  const handleTimeRangeChange = (newRange: typeof selectedTimeRange) => {
    setSelectedTimeRange(newRange);
    setUserHasInteracted(false); // Reset interaction state for new time range
    updatePreferences({ defaultTimeRange: newRange });
  };

  // Handle live mode toggle
  const handleLiveModeToggle = () => {
    const newLiveMode = !isLiveMode;
    setLiveMode(newLiveMode);
    updatePreferences({ enableLiveMode: newLiveMode });
  };

  // Handle user interaction
  const handleUserInteraction = () => {
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    clearError();
    refresh();
  };

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {/* Time Range Selector */}
      {showTimeRangeSelector && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TimeRangeSelector
            selectedRange={selectedTimeRange}
            onRangeChange={handleTimeRangeChange}
            isLiveMode={isLiveMode}
            onLiveModeToggle={handleLiveModeToggle}
            onRefresh={autoFetch ? handleRefresh : undefined}
            isLoading={isLoading}
            nextRefreshIn={nextRefreshIn}
            showRefreshControls={autoFetch}
          />
        </Box>
      )}

      {/* Chart - Fresh start */}
      <SimpleCGMChart
        data={chartData}
        height={height}
        timeRange={selectedTimeRange}
      />
    </Stack>
  );
};

export default React.memo(CGMChartContainer);
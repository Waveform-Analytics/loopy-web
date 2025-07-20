import React, { useCallback } from 'react';
import { 
  Container, 
  Grid, 
  Snackbar,
  Alert,
} from '@mui/material';
import { CurrentReading, TimeRangeSelector, SimpleCGMChart } from './components';
import { useCGMData, useSmartPolling } from './hooks';
import { transformCGMDataForChart, generateMockCGMData } from './utils';

function App() {
  const {
    currentReading,
    historicalData,
    loading,
    error,
    refreshCurrent,
    refreshHistorical,
    setTimeRange,
    timeRange,
  } = useCGMData('24h');

  // Live mode with intelligent polling based on actual CGM data patterns
  const handleLiveUpdate = useCallback(() => {
    refreshCurrent();
    refreshHistorical();
  }, [refreshCurrent, refreshHistorical]);

  const {
    timeUntilNext,
    lastUpdate,
    nextExpectedReading,
    estimatedInterval,
  } = useSmartPolling({
    onUpdate: handleLiveUpdate,
    currentReading,
    historicalData,
    fallbackIntervalMs: 5 * 60 * 1000, // 5 minutes fallback
  });

  // Memoize chart data transformation to prevent unnecessary re-renders
  const chartData = React.useMemo(() => {
    if (historicalData?.readings && historicalData.readings.length > 0) {
      return transformCGMDataForChart(historicalData.readings);
    }
    // Use mock data when no real data is available
    const mockReadings = generateMockCGMData(parseInt(timeRange.replace('h', '')));
    return transformCGMDataForChart(mockReadings);
  }, [historicalData?.readings, timeRange]);

  // Memoized time range change handler
  const handleTimeRangeChange = useCallback((newRange: string) => {
    setTimeRange(newRange as any);
  }, [setTimeRange]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Grid container spacing={3}>
        {/* Current Reading */}
        <Grid item xs={12} md={4}>
          <CurrentReading
            reading={currentReading}
            loading={loading.current}
            error={error.current}
          />
        </Grid>

        {/* Time Range Selector */}
        <Grid item xs={12} md={8}>
          <TimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            timeUntilNext={timeUntilNext}
            lastUpdate={lastUpdate}
            nextExpectedReading={nextExpectedReading}
            estimatedInterval={estimatedInterval}
          />
        </Grid>

        {/* Chart */}
        <Grid item xs={12}>
          <SimpleCGMChart
            data={chartData}
            timeRange={timeRange}
            height={400}
          />
        </Grid>
      </Grid>

      {/* Error Notifications */}
      <Snackbar
        open={!!(error.current || error.historical)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error.current?.message || error.historical?.message || 'An error occurred'}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
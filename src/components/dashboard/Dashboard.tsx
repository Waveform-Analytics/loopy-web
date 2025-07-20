/**
 * Main Dashboard Component
 * 
 * Combines CGM chart, current reading, and other dashboard elements
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { CGMChartContainer } from '../charts';
import { CurrentReading, CompactCurrentReading } from './CurrentReading';
import { useCGMData, useRealtimeCGM } from '../../hooks';
import { ChartDataPoint } from '../../types';

/**
 * Dashboard component props
 */
export interface DashboardProps {
  /** Dashboard title */
  title?: string;
  /** Whether to show app bar */
  showAppBar?: boolean;
  /** Whether to enable fullscreen mode */
  enableFullscreen?: boolean;
  /** Custom chart height */
  chartHeight?: number;
  /** Whether to show debug information */
  showDebugInfo?: boolean;
}

/**
 * Main Dashboard Component
 */
export const Dashboard: React.FC<DashboardProps> = ({
  title = 'CGM Dashboard',
  showAppBar = true,
  enableFullscreen = true,
  chartHeight,
  showDebugInfo = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Real-time CGM data with alerts
  const cgmData = useRealtimeCGM({
    hours: 24,
    refreshInterval: 0, // NUCLEAR: Disable auto-refresh
    fetchOnMount: true,
    alertThresholds: {
      low: 70,
      high: 180,
      veryLow: 54,
      veryHigh: 250,
    },
    onAlert: (alert) => {
      const messages = {
        veryLow: `Very Low Glucose: ${alert.glucose} mg/dL - Immediate attention needed!`,
        low: `Low Glucose: ${alert.glucose} mg/dL - Check and treat if needed`,
        veryHigh: `Very High Glucose: ${alert.glucose} mg/dL - Take corrective action`,
        high: `High Glucose: ${alert.glucose} mg/dL - Monitor closely`,
        trend: `Rapid glucose change detected: ${alert.direction}`,
      };
      
      showSnackbar(
        messages[alert.type],
        alert.type === 'veryLow' || alert.type === 'veryHigh' ? 'error' : 'warning'
      );
    },
    onError: (error) => {
      showSnackbar(`Data fetch error: ${error.message}`, 'error');
    },
  });

  // Snackbar helper
  const showSnackbar = useCallback((message: string, severity: typeof snackbarSeverity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;
    
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, enableFullscreen]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    cgmData.refresh();
    showSnackbar('Refreshing glucose data...', 'info');
  }, [cgmData, showSnackbar]);
  
  // Memoize the data to prevent unnecessary re-renders
  const memoizedCGMData = useMemo(() => cgmData.data, [cgmData.data]);

  // Data point hover handler
  const handleDataPointHover = useCallback((dataPoint: ChartDataPoint | null) => {
    setSelectedDataPoint(dataPoint);
  }, []);

  // Calculate responsive chart height
  const getChartHeight = () => {
    if (chartHeight) return chartHeight;
    if (isFullscreen) return window.innerHeight - 200;
    if (isSmallScreen) return 300;
    if (isMobile) return 350;
    return 450;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'background.default',
      position: 'relative',
    }}>
      {/* App Bar */}
      {showAppBar && (
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            
            {/* Current reading in header (mobile) */}
            {isMobile && (
              <Box sx={{ mr: 2 }}>
                <CompactCurrentReading
                  currentGlucose={cgmData.currentGlucose}
                  isLoading={cgmData.loadingState === 'loading'}
                />
              </Box>
            )}

            {/* Header actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                color="inherit" 
                onClick={handleRefresh}
                disabled={cgmData.loadingState === 'loading'}
              >
                <RefreshIcon />
              </IconButton>
              
              <IconButton color="inherit">
                <SettingsIcon />
              </IconButton>

              {enableFullscreen && (
                <IconButton color="inherit" onClick={toggleFullscreen}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Main Content */}
      <Container 
        maxWidth={isFullscreen ? false : 'xl'} 
        sx={{ 
          py: showAppBar ? 3 : 2,
          px: isFullscreen ? 2 : undefined,
        }}
      >
        <Stack spacing={3}>
          {/* Current Reading + Chart Layout */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Current Reading (Desktop) */}
            {!isMobile && (
              <Box sx={{ 
                width: { xs: '100%', md: '300px' },
                flexShrink: 0,
              }}>
                <CurrentReading
                  currentGlucose={cgmData.currentGlucose}
                  isLoading={cgmData.loadingState === 'loading'}
                  showTrendDetails={true}
                  size={isSmallScreen ? 'small' : 'medium'}
                />
              </Box>
            )}

            {/* Main Chart */}
            <Box sx={{ flexGrow: 1 }}>
              <CGMChartContainer
                height={getChartHeight()}
                data={memoizedCGMData}
                autoFetch={false} // We're handling data fetching at dashboard level
                showTimeRangeSelector={true}
                showTargetRange={true}
                onDataPointHover={handleDataPointHover}
                onError={(error) => showSnackbar(`Chart error: ${error.message}`, 'error')}
              />
            </Box>
          </Box>

          {/* Current Reading (Mobile) */}
          {isMobile && (
            <CurrentReading
              currentGlucose={cgmData.currentGlucose}
              isLoading={cgmData.loadingState === 'loading'}
              showTrendDetails={true}
              size="small"
            />
          )}

          {/* Data Quality Info */}
          {showDebugInfo && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Data Quality
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
                  </Typography>
                  <Typography variant="h6">
                    {cgmData.dataQuality.totalPoints}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Valid Points
                  </Typography>
                  <Typography variant="h6">
                    {cgmData.dataQuality.validPoints}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Data Gaps
                  </Typography>
                  <Typography variant="h6">
                    {cgmData.dataQuality.gapCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Update
                  </Typography>
                  <Typography variant="h6">
                    {cgmData.lastFetch ? cgmData.lastFetch.toLocaleTimeString() : 'Never'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Selected Data Point Info */}
          {selectedDataPoint && (
              <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="body1">
                  <strong>Selected:</strong> {selectedDataPoint.glucose} mg/dL at{' '}
                  {selectedDataPoint.timestamp.toLocaleString()}
                </Typography>
              </Paper>
          )}
        </Stack>
      </Container>

      {/* Floating Action Button for Quick Refresh */}
      {!showAppBar && (
        <Fab
          color="primary"
          aria-label="refresh"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={handleRefresh}
          disabled={cgmData.loadingState === 'loading'}
        >
          <RefreshIcon />
        </Fab>
      )}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === 'error' ? 10000 : 6000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          setSnackbarOpen(false);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setSnackbarOpen(false);
              }}
            >
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>×</Typography>
            </IconButton>
          }
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
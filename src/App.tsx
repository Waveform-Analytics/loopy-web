import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress,
  Card,
  CardContent,
  Button,
  Grid,
  Collapse,
  IconButton,
} from '@mui/material';
import { 
  Refresh, 
  CheckCircle, 
  Error, 
  ExpandMore, 
  ExpandLess 
} from '@mui/icons-material';
import { api } from './services/api';
import { useCGMData } from './hooks';
import { RechartsTimeSeriesChart } from './components/charts';

interface ConnectionStatus {
  api: boolean;
  cgm: boolean;
  loading: boolean;
  error?: string;
}

function App() {
  const [status, setStatus] = useState<ConnectionStatus>({
    api: false,
    cgm: false,
    loading: true,
  });
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);

  // Use the CGM data hook
  const { 
    cgmData, 
    currentGlucose, 
    loading: dataLoading, 
    error: dataError, 
    lastUpdated,
    refresh: refreshData 
  } = useCGMData({ 
    hours: 24, // Always fetch 24h of data for filtering
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  });

  const testConnections = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔍 Testing API connections...');
      
      // Test base API connection
      const apiConnected = await api.testConnection();
      console.log('📡 API Connection:', apiConnected ? 'SUCCESS' : 'FAILED');
      
      // Test CGM data connection
      const cgmConnected = await api.cgm.testConnection();
      console.log('📊 CGM Connection:', cgmConnected ? 'SUCCESS' : 'FAILED');
      
      setStatus({
        api: apiConnected,
        cgm: cgmConnected,
        loading: false,
      });
      
    } catch (error: any) {
      console.error('❌ Connection test error:', error);
      setStatus({
        api: false,
        cgm: false,
        loading: false,
        error: error.message || 'Connection test failed',
      });
    }
  };

  useEffect(() => {
    testConnections();
  }, []);

  // Auto-hide connection details when both connections are successful
  useEffect(() => {
    if (status.api && status.cgm && !status.loading) {
      const timer = setTimeout(() => {
        setShowConnectionDetails(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, md: 4 } }}>
        <Typography variant="h4" gutterBottom align="center">
          🔄 Loopy Web
        </Typography>
        
        <Typography variant="h6" gutterBottom align="center" color="text.secondary">
          Enhanced CGM Dashboard
        </Typography>

        {/* Connection Status - Collapsible */}
        <Box sx={{ mt: 2, mb: 3 }}>
          <Card>
            <CardContent sx={{ pb: showConnectionDetails ? 2 : 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    🔌 Status
                  </Typography>
                  
                  {status.loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Box display="flex" gap={1}>
                      {status.api ? <CheckCircle color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                      {status.cgm ? <CheckCircle color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                    </Box>
                  )}
                </Box>
                
                <IconButton 
                  onClick={() => setShowConnectionDetails(!showConnectionDetails)}
                  size="small"
                >
                  {showConnectionDetails ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              <Collapse in={showConnectionDetails}>
                <Box sx={{ mt: 2 }}>
                  {status.loading ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress size={24} />
                      <Typography>Testing connections...</Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {status.api ? <CheckCircle color="success" /> : <Error color="error" />}
                        <Typography>
                          Backend API: {status.api ? 'Connected' : 'Disconnected'}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        {status.cgm ? <CheckCircle color="success" /> : <Error color="error" />}
                        <Typography>
                          CGM Data: {status.cgm ? 'Available' : 'Unavailable'}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={testConnections}
                        disabled={status.loading}
                        size="small"
                      >
                        Refresh Status
                      </Button>
                    </Box>
                  )}
                  
                  {status.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {status.error}
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* Success message */}
        {status.api && status.cgm && !dataError && (
          <Alert severity="success" sx={{ mb: 3 }}>
            🎉 All systems connected! Displaying your real CGM data.
          </Alert>
        )}

        {/* Data error */}
        {dataError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={refreshData}>
                Retry
              </Button>
            }
          >
            Error loading CGM data: {dataError.message}
          </Alert>
        )}

        {/* Main Dashboard Content */}
        {status.api && status.cgm && (
          <Grid container spacing={3}>
            {/* Enhanced Time Series Chart */}
            <Grid item xs={12}>
              {dataLoading === 'loading' && !cgmData ? (
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
                      <CircularProgress />
                      <Typography>Loading your CGM data...</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : cgmData && cgmData.data.length > 0 ? (
                <RechartsTimeSeriesChart 
                  data={cgmData.data}
                  title="24-Hour Glucose Timeline"
                />
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 No Recent Data
                    </Typography>
                    <Typography color="text.secondary">
                      No CGM readings found in the last 24 hours. Make sure your Loop system is running and connected to MongoDB.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={refreshData} 
                      sx={{ mt: 2 }}
                      startIcon={<Refresh />}
                    >
                      Refresh Data
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Current Glucose Display - Coming Next */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🚧 Current Glucose Display
                  </Typography>
                  <Typography color="text.secondary">
                    Enhanced current reading component with comprehensive trend analysis - coming next!
                  </Typography>
                  {currentGlucose && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h4" color="primary">
                        {currentGlucose.current_glucose || '--'} mg/dL
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentGlucose.direction} • {Math.round(currentGlucose.minutes_ago)} min ago
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Stats Display - Coming Next */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🚧 Analytics Dashboard
                  </Typography>
                  <Typography color="text.secondary">
                    Advanced time-in-range statistics and trend analysis - coming next!
                  </Typography>
                  {cgmData?.analysis && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Average: {(cgmData.analysis.basic_stats?.avg_glucose || cgmData.analysis.average_glucose)?.toFixed(0)} mg/dL
                      </Typography>
                      <Typography variant="body2">
                        Time in Range: {(cgmData.analysis.time_in_range?.normal_percent || cgmData.analysis.time_in_range?.in_range)?.toFixed(0)}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Last updated info */}
        {lastUpdated && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default App;
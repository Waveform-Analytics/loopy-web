import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { NormalizedCurrentReading } from '../types';
import { formatGlucoseValue, getGlucoseStatus } from '../utils';

interface CurrentReadingProps {
  reading: NormalizedCurrentReading | null;
  loading: boolean;
  error: any;
}

const TrendIcon = ({ trend }: { trend?: string }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp color="error" />;
    case 'down':
      return <TrendingDown color="primary" />;
    case 'stable':
    default:
      return <TrendingFlat color="action" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'low':
      return 'error';
    case 'high':
      return 'warning';
    case 'normal':
    default:
      return 'success';
  }
};

export const CurrentReading: React.FC<CurrentReadingProps> = React.memo(({
  reading,
  loading,
  error
}) => {
  // Common styling for consistent height
  const commonPaperSx = {
    p: 3,
    minHeight: 240, // Fixed minimum height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={commonPaperSx}>
        <Box>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading current reading...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={commonPaperSx}>
        <Alert severity="error">
          {error.message || 'Failed to load current reading'}
        </Alert>
      </Paper>
    );
  }

  if (!reading) {
    return (
      <Paper elevation={2} sx={commonPaperSx}>
        <Typography variant="body2" color="text.secondary">
          No current reading available
        </Typography>
      </Paper>
    );
  }

  const status = getGlucoseStatus(reading.value);
  const formattedValue = formatGlucoseValue(reading.value);
  const lastUpdated = new Date(reading.lastUpdated).toLocaleTimeString();

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        ...commonPaperSx,
        background: theme => theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              mr: 1,
              color: theme => theme.palette.text.primary
            }}
          >
            {formattedValue}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TrendIcon trend={reading.trend} />
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              mg/dL
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={status.toUpperCase()}
            color={getStatusColor(status) as any}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated}
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          <Chip
            label={reading.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
            color={reading.status === 'active' ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
    </Paper>
  );
});

CurrentReading.displayName = 'CurrentReading';
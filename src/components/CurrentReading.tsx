import React, { useState, useEffect } from 'react';
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

// Configurable glucose thresholds (easily editable)
const GLUCOSE_THRESHOLDS = {
  urgentLow: 55,    // < 55: red (urgent low)
  low: 70,          // 55-69: yellow (low) 
  normal: 180,      // 70-180: green (in range)
  high: 250,        // 181-250: yellow (high)
  // > 250: red (really high)
};

const getGlucoseColor = (value: number): string => {
  if (value < GLUCOSE_THRESHOLDS.urgentLow) {
    return '#d32f2f'; // Red - urgent low
  } else if (value < GLUCOSE_THRESHOLDS.low) {
    return '#ed6c02'; // Orange/Yellow - low
  } else if (value <= GLUCOSE_THRESHOLDS.normal) {
    return '#2e7d32'; // Green - in range
  } else if (value <= GLUCOSE_THRESHOLDS.high) {
    return '#ed6c02'; // Orange/Yellow - high
  } else {
    return '#d32f2f'; // Red - really high
  }
};

const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes === 1) {
    return '1 min ago';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    if (diffHours === 1) {
      return remainingMinutes > 0 ? `1h ${remainingMinutes}m ago` : '1h ago';
    } else {
      return remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}m ago` : `${diffHours}h ago`;
    }
  }
};

export const CurrentReading: React.FC<CurrentReadingProps> = React.memo(({
  reading,
  loading,
  error
}) => {
  // State for live time updates (for time since calculation)
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second to keep "time since" current
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Common styling for compact, consistent height
  const commonPaperSx = {
    p: 2,
    minHeight: 120, // Compact height for mobile
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to left
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

  const formattedValue = formatGlucoseValue(reading.value);
  const lastUpdatedDate = new Date(reading.lastUpdated);
  const timeSinceUpdate = formatTimeSince(lastUpdatedDate);
  const glucoseColor = getGlucoseColor(reading.value);

  return (
    <Paper elevation={2} sx={commonPaperSx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        
        {/* Left side: glucose + trend with time since below */}
        <Box>
          {/* Glucose value and trend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Color-coded glucose value */}
            <Typography 
              variant="h1" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '3rem', sm: '3.5rem' },
                lineHeight: 1,
                color: glucoseColor, // Color-coded based on value
              }}
            >
              {formattedValue}
            </Typography>
            
            {/* Trend arrow right next to glucose */}
            <TrendIcon trend={reading.trend} />
          </Box>
          
          {/* Time since update directly below glucose value */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.875rem',
              mt: 1,
              textAlign: 'left'
            }}
          >
            {timeSinceUpdate}
          </Typography>
        </Box>
        
        {/* Right side: current time */}
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 'medium',
            textAlign: 'right'
          }}
        >
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </Typography>
      </Box>
    </Paper>
  );
});

CurrentReading.displayName = 'CurrentReading';
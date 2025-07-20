import React from 'react';
import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { TimeRange } from '../types';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  timeUntilNext?: number;
  lastUpdate?: Date | null;
  nextExpectedReading?: Date | null;
  estimatedInterval?: number;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '3h', label: '3H' },
  { value: '6h', label: '6H' },
  { value: '12h', label: '12H' },
  { value: '24h', label: '24H' },
];

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = React.memo(({
  timeRange,
  onTimeRangeChange,
  timeUntilNext = 0,
  lastUpdate,
  nextExpectedReading,
  estimatedInterval,
}) => {
  const handleTimeRangeChange = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newRange: TimeRange | null) => {
      if (newRange) {
        onTimeRangeChange(newRange);
      }
    },
    [onTimeRangeChange]
  );

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Time Range Selection */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Time Range
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                minHeight: 44, // Touch-friendly
              },
            }}
          >
            {timeRangeOptions.map(option => (
              <ToggleButton
                key={option.value}
                value={option.value}
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Live Updates Status */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrow color="primary" fontSize="small" />
            <Typography variant="body2" color="primary" fontWeight="medium">
              Live Updates Active
            </Typography>
          </Box>
          
          {/* Live Status Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Chip
              label={`Next: ${formatCountdown(timeUntilNext)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {nextExpectedReading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Expected: {nextExpectedReading.toLocaleTimeString()}
              </Typography>
            )}
            {estimatedInterval && (
              <Typography variant="caption" color="text.secondary">
                Interval: ~{Math.round(estimatedInterval / 60000)}min
              </Typography>
            )}
            {lastUpdate && (
              <Typography variant="caption" color="text.secondary">
                Last: {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
});

TimeRangeSelector.displayName = 'TimeRangeSelector';
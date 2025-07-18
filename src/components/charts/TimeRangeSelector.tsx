import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  AccessTime
} from '@mui/icons-material';

export type TimeRange = '1h' | '3h' | '6h' | '12h' | '24h';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isLiveMode?: boolean;
  onLiveModeToggle?: () => void;
  dataCount?: number;
}

const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
  { value: '1h', label: '1H', hours: 1 },
  { value: '3h', label: '3H', hours: 3 },
  { value: '6h', label: '6H', hours: 6 },
  { value: '12h', label: '12H', hours: 12 },
  { value: '24h', label: '24H', hours: 24 }
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  isLiveMode = true,
  onLiveModeToggle,
  dataCount
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: TimeRange | null
  ) => {
    if (newRange !== null) {
      onRangeChange(newRange);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
      sx={{
        p: 1,
        bgcolor: 'background.default',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider'
      }}
    >
      {/* Time Range Buttons */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={0.5}>
          <AccessTime fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            View:
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={selectedRange}
          exclusive
          onChange={handleRangeChange}
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiToggleButton-root': {
              px: isMobile ? 1 : 1.5,
              py: 0.5,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 'auto' : 48
            }
          }}
        >
          {timeRangeOptions.map((option) => (
            <ToggleButton
              key={option.value}
              value={option.value}
              aria-label={`Show ${option.label}`}
            >
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Live Mode & Data Info */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {dataCount !== undefined && (
          <Chip
            label={`${dataCount} readings`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        )}
        
        {onLiveModeToggle && (
          <Chip
            icon={isLiveMode ? <PlayArrow /> : <Pause />}
            label={isLiveMode ? "Live" : "Paused"}
            size="small"
            color={isLiveMode ? "success" : "default"}
            onClick={onLiveModeToggle}
            clickable
            sx={{
              fontSize: '0.7rem',
              '& .MuiChip-icon': {
                fontSize: '1rem'
              }
            }}
          />
        )}
      </Box>
    </Box>
  );
};
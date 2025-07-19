/**
 * Time Range Selector Component
 * 
 * Interactive button group for selecting chart time ranges with smooth transitions
 */

import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { TimeRange } from '../../types';

/**
 * Time range selector component props
 */
export interface TimeRangeSelectorProps {
  /** Currently selected time range */
  selectedRange: TimeRange;
  /** Callback when time range changes */
  onRangeChange: (range: TimeRange) => void;
  /** Whether live mode is enabled */
  isLiveMode?: boolean;
  /** Callback to toggle live mode */
  onLiveModeToggle?: () => void;
  /** Callback for manual refresh */
  onRefresh?: () => void;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Time until next auto-refresh (in seconds) */
  nextRefreshIn?: number;
  /** Whether to show refresh controls */
  showRefreshControls?: boolean;
  /** Custom time range options */
  timeRanges?: TimeRange[];
  /** Compact mode for mobile */
  compact?: boolean;
}

/**
 * Default time ranges with labels
 */
const DEFAULT_TIME_RANGES: Array<{ value: TimeRange; label: string; shortLabel: string }> = [
  { value: '1h', label: '1 Hour', shortLabel: '1h' },
  { value: '3h', label: '3 Hours', shortLabel: '3h' },
  { value: '6h', label: '6 Hours', shortLabel: '6h' },
  { value: '12h', label: '12 Hours', shortLabel: '12h' },
  { value: '24h', label: '24 Hours', shortLabel: '24h' },
];

/**
 * Format refresh countdown
 */
const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return 'Now';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
};

/**
 * Time Range Selector Component
 */
export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  isLiveMode = false,
  onLiveModeToggle,
  onRefresh,
  isLoading = false,
  nextRefreshIn = 0,
  showRefreshControls = true,
  timeRanges,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCompact = compact || isMobile;

  // Use custom ranges or defaults
  const ranges = timeRanges || DEFAULT_TIME_RANGES.map(r => r.value);
  const rangeLabels = DEFAULT_TIME_RANGES.reduce((acc, r) => {
    acc[r.value] = isCompact ? r.shortLabel : r.label;
    return acc;
  }, {} as Record<TimeRange, string>);

  // Handle range selection
  const handleRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: TimeRange | null,
  ) => {
    if (newRange && newRange !== selectedRange) {
      onRangeChange(newRange);
    }
  };

  // Handle live mode toggle
  const handleLiveModeToggle = () => {
    onLiveModeToggle?.();
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (!isLoading) {
      onRefresh?.();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        flexWrap: isCompact ? 'wrap' : 'nowrap',
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Time Range Toggle Buttons */}
      <ToggleButtonGroup
        value={selectedRange}
        exclusive
        onChange={handleRangeChange}
        aria-label="time range selection"
        size={isCompact ? 'small' : 'medium'}
        sx={{
          '& .MuiToggleButton-root': {
            px: isCompact ? 1 : 1.5,
            py: 0.5,
            fontSize: isCompact ? '0.75rem' : '0.875rem',
            fontWeight: 500,
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
      >
        {ranges.map((range) => (
          <ToggleButton
            key={range}
            value={range}
            aria-label={`Select ${rangeLabels[range]} time range`}
          >
            {rangeLabels[range]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Refresh Controls */}
      {showRefreshControls && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Live Mode Toggle */}
          {onLiveModeToggle && (
            <Tooltip title={isLiveMode ? 'Disable live updates' : 'Enable live updates'}>
              <IconButton
                onClick={handleLiveModeToggle}
                size={isCompact ? 'small' : 'medium'}
                color={isLiveMode ? 'primary' : 'default'}
                sx={{
                  border: '1px solid',
                  borderColor: isLiveMode ? 'primary.main' : 'divider',
                  backgroundColor: isLiveMode ? 'primary.light' : 'transparent',
                }}
              >
                {isLiveMode ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* Manual Refresh */}
          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                size={isCompact ? 'small' : 'medium'}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Live Status Indicator */}
      {isLiveMode && showRefreshControls && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            icon={<TimeIcon sx={{ fontSize: '0.875rem' }} />}
            label={
              isCompact ? (
                formatCountdown(Math.floor(nextRefreshIn / 1000))
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" component="span">
                    Next:
                  </Typography>
                  <Typography variant="caption" component="span" fontWeight="bold">
                    {formatCountdown(Math.floor(nextRefreshIn / 1000))}
                  </Typography>
                </Box>
              )
            }
            size="small"
            variant="outlined"
            color="primary"
            sx={{
              height: isCompact ? 24 : 28,
              '& .MuiChip-label': {
                px: 1,
                fontSize: isCompact ? '0.7rem' : '0.75rem',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

/**
 * Simplified time range selector for minimal UI
 */
export interface SimpleTimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  timeRanges?: TimeRange[];
}

export const SimpleTimeRangeSelector: React.FC<SimpleTimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  timeRanges,
}) => {
  const ranges = timeRanges || DEFAULT_TIME_RANGES.map(r => r.value);
  
  const handleRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: TimeRange | null,
  ) => {
    if (newRange && newRange !== selectedRange) {
      onRangeChange(newRange);
    }
  };

  return (
    <ToggleButtonGroup
      value={selectedRange}
      exclusive
      onChange={handleRangeChange}
      aria-label="time range selection"
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          px: 1,
          py: 0.25,
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: 36,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          },
        },
      }}
    >
      {ranges.map((range) => (
        <ToggleButton key={range} value={range}>
          {DEFAULT_TIME_RANGES.find(r => r.value === range)?.shortLabel || range}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default TimeRangeSelector;
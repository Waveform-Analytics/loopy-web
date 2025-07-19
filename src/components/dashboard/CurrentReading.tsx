/**
 * Current Reading Component
 * 
 * Displays current glucose reading with trend arrows and status information
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { CurrentGlucose } from '../../types';

/**
 * Current Reading component props
 */
export interface CurrentReadingProps {
  /** Current glucose data */
  currentGlucose: CurrentGlucose | null;
  /** Loading state */
  isLoading?: boolean;
  /** Target glucose range */
  targetRange?: { low: number; high: number };
  /** Whether to show detailed trend information */
  showTrendDetails?: boolean;
  /** Custom size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show last update time */
  showLastUpdate?: boolean;
}

/**
 * Get trend icon based on direction
 */
const getTrendIcon = (direction: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  
  switch (direction?.toLowerCase()) {
    case 'singleup':
    case 'doubleup':
    case 'fortyFiveup':
      return <TrendingUp fontSize={iconSize} />;
    case 'singledown':
    case 'doubledown': 
    case 'fortyFivedown':
      return <TrendingDown fontSize={iconSize} />;
    case 'flat':
    case 'none':
      return <TrendingFlat fontSize={iconSize} />;
    default:
      return <TrendingFlat fontSize={iconSize} />;
  }
};

/**
 * Get trend description
 */
const getTrendDescription = (direction: string): string => {
  switch (direction?.toLowerCase()) {
    case 'doubleup':
      return 'Rising rapidly';
    case 'singleup':
      return 'Rising';
    case 'fortyFiveup':
      return 'Rising slowly';
    case 'flat':
      return 'Stable';
    case 'fortyFivedown':
      return 'Falling slowly';
    case 'singledown':
      return 'Falling';
    case 'doubledown':
      return 'Falling rapidly';
    default:
      return 'Unknown trend';
  }
};

/**
 * Get glucose status based on value and target range
 */
const getGlucoseStatus = (glucose: number, targetRange = { low: 70, high: 180 }) => {
  if (glucose < targetRange.low * 0.77) {
    return { 
      level: 'critical', 
      label: 'Very Low', 
      color: 'error.dark',
      icon: <ErrorIcon />,
      description: 'Immediate attention needed'
    };
  }
  if (glucose < targetRange.low) {
    return { 
      level: 'low', 
      label: 'Low', 
      color: 'error.main',
      icon: <Warning />,
      description: 'Below target range'
    };
  }
  if (glucose > targetRange.high * 1.39) {
    return { 
      level: 'critical', 
      label: 'Very High', 
      color: 'error.dark',
      icon: <ErrorIcon />,
      description: 'Take corrective action'
    };
  }
  if (glucose > targetRange.high) {
    return { 
      level: 'high', 
      label: 'High', 
      color: 'warning.main',
      icon: <Warning />,
      description: 'Above target range'
    };
  }
  return { 
    level: 'normal', 
    label: 'In Range', 
    color: 'success.main',
    icon: <CheckCircle />,
    description: 'Within target range'
  };
};

/**
 * Format time ago
 */
const formatTimeAgo = (minutesAgo: number): string => {
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${Math.round(minutesAgo)}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  const mins = Math.round(minutesAgo % 60);
  return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''} ago` : `${mins}m ago`;
};

/**
 * Current Reading Component
 */
export const CurrentReading: React.FC<CurrentReadingProps> = ({
  currentGlucose,
  isLoading = false,
  targetRange = { low: 70, high: 180 },
  showTrendDetails = true,
  size = 'medium',
  showLastUpdate = true,
}) => {
  const theme = useTheme();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Glucose
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading current reading...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!currentGlucose || currentGlucose.current_glucose === null) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Glucose
          </Typography>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h3" color="text.secondary">
              --
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No current reading available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const glucose = currentGlucose.current_glucose;
  const status = getGlucoseStatus(glucose, targetRange);
  const trendIcon = getTrendIcon(currentGlucose.direction, size);
  const trendDescription = getTrendDescription(currentGlucose.direction);
  const timeAgo = formatTimeAgo(currentGlucose.minutes_ago);

  // Determine if reading is stale (older than 15 minutes)
  const isStale = currentGlucose.minutes_ago > 15;

  const textSize = size === 'small' ? 'h4' : size === 'large' ? 'h2' : 'h3';
  const cardPadding = size === 'small' ? 2 : size === 'large' ? 4 : 3;

  return (
    <Card 
      sx={{ 
        position: 'relative',
        background: status.level === 'critical' ? 
          `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)` :
          undefined,
        border: status.level === 'critical' ? 
          `1px solid ${alpha(theme.palette.error.main, 0.2)}` : 
          undefined,
      }}
    >
      <CardContent sx={{ p: cardPadding }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Glucose
          </Typography>
          
          {/* Status chip */}
          <Chip
            icon={status.icon}
            label={status.label}
            size="small"
            sx={{
              backgroundColor: alpha(
                status.color.includes('error') ? theme.palette.error.main :
                status.color.includes('warning') ? theme.palette.warning.main :
                theme.palette.success.main, 
                0.1
              ),
              color: status.color,
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Main reading display */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant={textSize} 
              sx={{ 
                color: status.color,
                fontWeight: 'bold',
                opacity: isStale ? 0.6 : 1,
              }}
            >
              {glucose}
            </Typography>
            <Typography 
              variant={size === 'small' ? 'body2' : 'h6'} 
              color="text.secondary"
              sx={{ opacity: isStale ? 0.6 : 1 }}
            >
              mg/dL
            </Typography>
          </Box>
          
          {/* Trend indicator */}
          <Tooltip title={trendDescription}>
            <Avatar
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                width: size === 'small' ? 32 : size === 'large' ? 48 : 40,
                height: size === 'small' ? 32 : size === 'large' ? 48 : 40,
              }}
            >
              {trendIcon}
            </Avatar>
          </Tooltip>
        </Box>

        {/* Trend details */}
        {showTrendDetails && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {trendDescription}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {status.description}
            </Typography>
          </Box>
        )}

        {/* Last update time */}
        {showLastUpdate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography 
              variant="caption" 
              color={isStale ? 'warning.main' : 'text.secondary'}
              sx={{ fontWeight: isStale ? 600 : 400 }}
            >
              {timeAgo}
              {isStale && ' (Stale)'}
            </Typography>
          </Box>
        )}

        {/* Stale data warning */}
        {isStale && (
          <Box sx={{ mt: 2 }}>
            <Chip
              icon={<Warning />}
              label="Data may be outdated"
              size="small"
              color="warning"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Compact current reading for smaller spaces
 */
export interface CompactCurrentReadingProps {
  currentGlucose: CurrentGlucose | null;
  isLoading?: boolean;
  targetRange?: { low: number; high: number };
}

export const CompactCurrentReading: React.FC<CompactCurrentReadingProps> = ({
  currentGlucose,
  isLoading = false,
  targetRange = { low: 70, high: 180 },
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress sx={{ flexGrow: 1, height: 4 }} />
        <Typography variant="caption">Loading...</Typography>
      </Box>
    );
  }

  if (!currentGlucose || currentGlucose.current_glucose === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" color="text.secondary">--</Typography>
        <Typography variant="caption" color="text.secondary">mg/dL</Typography>
      </Box>
    );
  }

  const glucose = currentGlucose.current_glucose;
  const status = getGlucoseStatus(glucose, targetRange);
  const trendIcon = getTrendIcon(currentGlucose.direction, 'small');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="h6" sx={{ color: status.color, fontWeight: 'bold' }}>
        {glucose}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        mg/dL
      </Typography>
      <Box sx={{ color: 'primary.main' }}>
        {trendIcon}
      </Box>
    </Box>
  );
};

export default CurrentReading;
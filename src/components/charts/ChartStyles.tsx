/**
 * Chart Styles and Theme Integration
 * 
 * Styled components and theme-aware chart styling utilities
 */

import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Styled chart container with responsive behavior
 */
export const ChartContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  
  // Responsive height adjustments
  [theme.breakpoints.down('sm')]: {
    '& .chart-paper': {
      borderRadius: theme.spacing(1),
    },
  },

  // Chart SVG styling
  '& svg': {
    display: 'block',
    width: '100%',
    height: '100%',
    
    // Smooth cursor transitions
    transition: 'cursor 0.2s ease',
    
    // Touch-friendly interactions on mobile
    [theme.breakpoints.down('sm')]: {
      touchAction: 'pan-x pan-y',
    },
  },

  // Chart element styling
  '& .glucose-line': {
    stroke: theme.palette.primary.main,
    strokeWidth: '2.5px',
    fill: 'none',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    
    // Smooth line transitions
    transition: 'stroke 0.3s ease',
  },

  // Data point styling
  '& .dot': {
    strokeWidth: '1px',
    stroke: theme.palette.common.white,
    transition: 'r 0.2s ease, fill 0.2s ease',
    cursor: 'pointer',
    
    '&:hover': {
      strokeWidth: '2px',
    },
  },

  // Axis styling
  '& .x-axis, & .y-axis': {
    '& line, & path': {
      stroke: theme.palette.divider,
      strokeWidth: '1px',
    },
    '& text': {
      fill: theme.palette.text.secondary,
      fontSize: '12px',
      fontFamily: theme.typography.fontFamily,
    },
  },

  // Grid lines
  '& .grid': {
    '& line': {
      stroke: alpha(theme.palette.divider, 0.3),
      strokeWidth: '1px',
      strokeDasharray: '2,2',
    },
  },

  // Target range styling
  '& .target-range-bg': {
    fill: alpha(theme.palette.success.main, 0.08),
    transition: 'fill 0.3s ease',
  },

  '& .target-line-low, & .target-line-high': {
    stroke: theme.palette.success.main,
    strokeWidth: '2px',
    strokeDasharray: '4,4',
    opacity: 0.7,
    transition: 'stroke 0.3s ease, opacity 0.3s ease',
  },

  // Axis labels
  '& .x-axis-label, & .y-axis-label': {
    fill: theme.palette.text.secondary,
    fontSize: '12px',
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
  },

  // Loading overlay
  '& .loading-overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
}));

/**
 * Styled tooltip container
 */
export const ChartTooltip = styled('div')(({ theme }) => ({
  position: 'absolute',
  backgroundColor: alpha(theme.palette.grey[900], 0.95),
  color: theme.palette.common.white,
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  fontFamily: theme.typography.fontFamily,
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  zIndex: 1000,
  whiteSpace: 'nowrap',
  boxShadow: theme.shadows[4],
  
  // Arrow pointer
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '100%',
    left: '50%',
    marginLeft: '-4px',
    borderWidth: '4px',
    borderStyle: 'solid',
    borderColor: `${alpha(theme.palette.grey[900], 0.95)} transparent transparent transparent`,
  },

  // Dark mode adjustments
  [theme.palette.mode === 'dark' ? '@media (prefers-color-scheme: dark)' : '@media (prefers-color-scheme: light)']: {
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    
    '&::after': {
      borderColor: `${alpha(theme.palette.background.paper, 0.95)} transparent transparent transparent`,
    },
  },
}));

/**
 * Styled chart paper with responsive elevation
 */
export const ChartPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  transition: 'box-shadow 0.3s ease',
  
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    elevation: 1,
    borderRadius: theme.spacing(1),
  },

  // Focus states for accessibility
  '&:focus-within': {
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
  },

  // Loading state styling
  '&.loading': {
    backgroundColor: alpha(theme.palette.action.hover, 0.05),
  },

  // Error state styling
  '&.error': {
    borderColor: theme.palette.error.main,
    borderWidth: '1px',
    borderStyle: 'solid',
  },
}));

/**
 * Chart control panel styling
 */
export const ChartControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 100,
  display: 'flex',
  gap: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  backdropFilter: 'blur(4px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,

  '& .MuiIconButton-root': {
    width: 32,
    height: 32,
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.8),
    },
  },

  // Mobile adjustments
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    
    '& .MuiIconButton-root': {
      width: 28,
      height: 28,
    },
  },
}));

/**
 * Responsive chart wrapper
 */
export const ResponsiveChartWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: 300,
  
  // Desktop sizing
  [theme.breakpoints.up('md')]: {
    minHeight: 400,
  },
  
  // Tablet sizing
  [theme.breakpoints.between('sm', 'md')]: {
    minHeight: 350,
  },
  
  // Mobile sizing
  [theme.breakpoints.down('sm')]: {
    minHeight: 280,
  },
  
  // Ensure proper aspect ratio maintenance
  aspectRatio: '16 / 9',
  
  [theme.breakpoints.down('sm')]: {
    aspectRatio: '4 / 3',
  },
}));

/**
 * Chart glucose value color utilities
 */
export const getGlucoseColorFromTheme = (theme: any, glucose: number, targetRange = { low: 70, high: 180 }) => {
  if (glucose < targetRange.low * 0.77) return theme.palette.error.dark; // Very low
  if (glucose < targetRange.low) return theme.palette.error.main; // Low
  if (glucose > targetRange.high * 1.39) return theme.palette.error.dark; // Very high
  if (glucose > targetRange.high) return theme.palette.warning.main; // High
  return theme.palette.success.main; // In range
};

/**
 * Chart theme integration hook
 */
export const useChartTheme = () => {
  // This would typically use useTheme() from MUI
  // For now, return default colors that work with both light/dark modes
  return {
    colors: {
      primary: '#2196f3',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
    },
    glucose: {
      veryLow: '#d32f2f',
      low: '#f44336',
      normal: '#4caf50',
      high: '#ff9800',
      veryHigh: '#d32f2f',
    },
  };
};
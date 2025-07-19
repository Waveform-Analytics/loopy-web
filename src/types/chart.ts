/**
 * Chart-specific types for D3.js visualization components
 */

import * as d3 from 'd3';
import { CGMReading } from './cgm';

/**
 * Time range options for chart display
 */
export type TimeRange = '1h' | '3h' | '6h' | '12h' | '24h';

/**
 * Chart data point that combines timestamp with glucose data
 */
export interface ChartDataPoint {
  /** JavaScript Date object for D3 time scales */
  timestamp: Date;
  /** Glucose value in mg/dL */
  glucose: number;
  /** Original CGM reading for reference */
  reading: CGMReading;
}

/**
 * Chart state management for user interactions and view control
 */
export interface ChartState {
  /** Currently selected time range */
  selectedTimeRange: TimeRange;
  /** Whether chart is in live mode (shows most recent data) */
  isLiveMode: boolean;
  /** Whether user has manually panned/zoomed (disables auto-scaling) */
  userHasInteracted: boolean;
  /** Current D3 zoom transform (for maintaining state) */
  currentTransform?: d3.ZoomTransform;
  /** Loading state for data fetching */
  isLoading?: boolean;
  /** Error state for data fetching */
  error?: string | null;
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
  /** Chart height in pixels */
  height: number;
  /** Chart margins */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Color scheme for different glucose ranges */
  colors: {
    veryLow: string;
    low: string;
    inRange: string;
    high: string;
    veryHigh: string;
    line: string;
    grid: string;
  };
  /** Target glucose ranges */
  targetRanges: {
    low: number;    // 70 mg/dL
    high: number;   // 180 mg/dL
  };
  /** Y-axis domain limits */
  yAxisLimits: {
    min: number;    // 40 mg/dL
    max: number;    // 400 mg/dL
  };
  /** Zoom/pan constraints */
  zoomLimits: {
    scaleMin: number;   // 0.1x
    scaleMax: number;   // 50x
  };
}

/**
 * Chart event handlers
 */
export interface ChartEventHandlers {
  /** Called when user changes time range */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Called when user toggles live mode */
  onLiveModeToggle?: (isLive: boolean) => void;
  /** Called when user manually interacts with chart */
  onUserInteraction?: () => void;
  /** Called when zoom/pan state changes */
  onZoomChange?: (transform: d3.ZoomTransform) => void;
  /** Called when user hovers over data point */
  onDataPointHover?: (dataPoint: ChartDataPoint | null) => void;
}

/**
 * Time range configuration mapping
 */
export const TIME_RANGE_CONFIG = {
  '1h': { hours: 1, label: '1 Hour', ticks: 4 },
  '3h': { hours: 3, label: '3 Hours', ticks: 6 },
  '6h': { hours: 6, label: '6 Hours', ticks: 6 },
  '12h': { hours: 12, label: '12 Hours', ticks: 8 },
  '24h': { hours: 24, label: '24 Hours', ticks: 8 },
} as const;

/**
 * Default chart configuration
 */
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  height: 500,
  margin: {
    top: 20,
    right: 30,
    bottom: 50,
    left: 60,
  },
  colors: {
    veryLow: '#DC143C',
    low: '#FF6B6B', 
    inRange: '#32CD32',
    high: '#FF8C00',
    veryHigh: '#8B0000',
    line: '#1976d2',
    grid: 'rgba(128,128,128,0.2)',
  },
  targetRanges: {
    low: 70,
    high: 180,
  },
  yAxisLimits: {
    min: 40,
    max: 400,
  },
  zoomLimits: {
    scaleMin: 0.1,
    scaleMax: 50,
  },
};

/**
 * Mobile-specific chart configuration
 */
export const MOBILE_CHART_CONFIG: Partial<ChartConfig> = {
  height: 350,
  margin: {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50,
  },
};

/**
 * Chart animation configuration
 */
export interface ChartAnimationConfig {
  /** Duration for transitions in milliseconds */
  transitionDuration: number;
  /** Easing function for transitions */
  easingFunction: string;
  /** Whether to animate initial chart load */
  animateOnLoad: boolean;
}

export const DEFAULT_ANIMATION_CONFIG: ChartAnimationConfig = {
  transitionDuration: 300,
  easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  animateOnLoad: true,
};

/**
 * Helper function to get time range in milliseconds
 */
export function getTimeRangeMs(range: TimeRange): number {
  return TIME_RANGE_CONFIG[range].hours * 60 * 60 * 1000;
}

/**
 * Helper function to calculate appropriate tick count for time range
 */
export function getTickCount(range: TimeRange, isMobile: boolean = false): number {
  const baseCount = TIME_RANGE_CONFIG[range].ticks;
  return isMobile ? Math.max(3, Math.floor(baseCount / 2)) : baseCount;
}
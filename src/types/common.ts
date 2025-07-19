/**
 * Common types used across the application
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** When this response was generated */
  last_updated: string;
  /** Response status */
  status: 'success' | 'error' | 'partial';
  /** Optional message */
  message?: string;
  /** Error details if status is 'error' */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Loading states for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Data source types
 */
export type DataSource = 'cgm' | 'pump' | 'combined' | 'manual';

/**
 * Time range for data queries
 */
export interface TimeRange {
  /** Start time */
  start: string | Date;
  /** End time */
  end: string | Date;
  /** Duration in hours */
  hours?: number;
}

/**
 * Generic chart data point
 */
export interface DataPoint {
  /** X-axis value (usually timestamp) */
  x: string | Date | number;
  /** Y-axis value */
  y: number;
  /** Optional color override */
  color?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * User preferences for the application
 */
export interface UserPreferences {
  /** Glucose units preference */
  glucoseUnits: 'mg/dL' | 'mmol/L';
  /** Default time range for charts */
  defaultTimeRange: '1h' | '3h' | '6h' | '12h' | '24h';
  /** Whether to use 24-hour time format */
  use24HourTime: boolean;
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
  /** Whether to show pump data overlays by default */
  showPumpData: boolean;
  /** Data refresh interval in minutes */
  refreshInterval: number;
  /** Custom glucose target ranges */
  customTargets?: {
    low: number;
    high: number;
  };
  /** Notification preferences */
  notifications: {
    enabled: boolean;
    lowGlucose: boolean;
    highGlucose: boolean;
    trendAlerts: boolean;
  };
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  glucoseUnits: 'mg/dL',
  defaultTimeRange: '3h',
  use24HourTime: false,
  theme: 'auto',
  showPumpData: false,
  refreshInterval: 5,
  notifications: {
    enabled: false,
    lowGlucose: true,
    highGlucose: true,
    trendAlerts: false,
  },
};

/**
 * Error types for better error handling
 */
export interface AppError {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Technical details */
  details?: any;
  /** When the error occurred */
  timestamp: Date;
  /** Where the error occurred */
  source: string;
}

/**
 * Connection status for real-time data
 */
export interface ConnectionStatus {
  /** Whether connected to data source */
  connected: boolean;
  /** Last successful data fetch */
  lastUpdate?: Date;
  /** Current latency in milliseconds */
  latency?: number;
  /** Connection quality score (0-100) */
  quality?: number;
  /** Any connection errors */
  error?: string;
}

/**
 * Statistics calculation interface
 */
export interface Statistics {
  /** Number of data points */
  count: number;
  /** Mean value */
  mean: number;
  /** Median value */
  median: number;
  /** Standard deviation */
  stdDev: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** 25th percentile */
  q1: number;
  /** 75th percentile */
  q3: number;
}

/**
 * Export/import data formats
 */
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xlsx';

export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Time range to export */
  timeRange: TimeRange;
  /** Data types to include */
  include: {
    cgm: boolean;
    pump: boolean;
    notes: boolean;
    statistics: boolean;
  };
  /** Whether to include raw data */
  includeRawData: boolean;
  /** File name (without extension) */
  filename?: string;
}

/**
 * Helper function to create a standardized error
 */
export function createAppError(
  code: string,
  message: string,
  source: string,
  details?: any
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    source,
  };
}

/**
 * Helper function to check if a value is a valid glucose reading
 */
export function isValidGlucose(value: number): boolean {
  return value >= 20 && value <= 600; // Reasonable bounds for glucose values
}

/**
 * Helper function to format glucose value with units
 */
export function formatGlucose(
  value: number,
  units: 'mg/dL' | 'mmol/L' = 'mg/dL'
): string {
  if (units === 'mmol/L') {
    return `${(value / 18.018).toFixed(1)} mmol/L`;
  }
  return `${Math.round(value)} mg/dL`;
}
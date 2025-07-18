// Common types used across the app
export interface TimeRange {
  start: string;
  end: string;
  hours: number;
}

export interface ApiResponse<T> {
  data: T;
  last_updated: string;
  status: 'success' | 'error' | 'partial';
  message?: string;
}

export interface ChartDataPoint {
  x: string | Date;
  y: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type DataSource = 'cgm' | 'pump' | 'combined';

// Chart interaction types
export interface ChartZoomState {
  level: number;
  startTime?: Date;
  endTime?: Date;
}

export interface ChartConfig {
  height: number;
  showGrid: boolean;
  showTooltips: boolean;
  enableZoom: boolean;
  enablePan: boolean;
}

// Error types for better error handling
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}
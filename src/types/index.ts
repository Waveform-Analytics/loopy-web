/**
 * Barrel exports for all type definitions
 * 
 * This allows clean imports like:
 * import { CGMReading, TimeRange, ChartState } from '../types';
 */

// CGM-related types
export type {
  CGMReading,
  CurrentGlucose,
  CGMDataResponse,
  CGMAnalysis,
  GlucoseTrend,
} from './cgm';

export {
  GLUCOSE_TRENDS,
  GLUCOSE_RANGES,
  getGlucoseRange,
  getTrendText,
} from './cgm';

// Chart-related types
export type {
  TimeRange,
  ChartDataPoint,
  ChartState,
  ChartConfig,
  ChartEventHandlers,
  ChartAnimationConfig,
} from './chart';

export {
  TIME_RANGE_CONFIG,
  DEFAULT_CHART_CONFIG,
  MOBILE_CHART_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  getTimeRangeMs,
  getTickCount,
} from './chart';

// Pump-related types (for future use)
export type {
  BolusDelivery,
  BasalRate,
  InsulinOnBoard,
  PumpSettings,
  PumpDataResponse,
  CombinedDiabetesData,
  InsulinVisualizationConfig,
} from './pump';

export {
  DEFAULT_INSULIN_VIZ_CONFIG,
  BOLUS_TYPE_CONFIG,
  calculateTotalDailyInsulin,
  getBolusDisplayConfig,
} from './pump';

// Common types
export type {
  ApiResponse,
  LoadingState,
  DataSource,
  TimeRange as CommonTimeRange,
  DataPoint,
  UserPreferences,
  AppError,
  ConnectionStatus,
  Statistics,
  ExportFormat,
  ExportOptions,
} from './common';

export {
  DEFAULT_USER_PREFERENCES,
  createAppError,
  isValidGlucose,
  formatGlucose,
} from './common';
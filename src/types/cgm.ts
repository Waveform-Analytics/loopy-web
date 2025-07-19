/**
 * CGM (Continuous Glucose Monitor) data types
 * 
 * These types define the structure of glucose data from the Loopy API
 */

export interface CGMReading {
  /** Timestamp in ISO format */
  datetime: string;
  /** Glucose value in mg/dL */
  sgv: number;
  /** Trend direction (e.g., "Flat", "SingleUp", "DoubleDown") */
  direction: string;
  /** Numeric trend value (optional) */
  trend?: number;
  /** Alternative timestamp field (some APIs use this) */
  dateString?: string;
  /** Device that recorded this reading */
  device?: string;
  /** Type of reading (usually "sgv" for sensor glucose value) */
  type?: string;
}

export interface CurrentGlucose {
  /** Current glucose value in mg/dL (null if no recent data) */
  current_glucose: number | null;
  /** Current trend direction */
  direction: string;
  /** Numeric trend value */
  trend: number;
  /** Timestamp of this reading */
  timestamp: string;
  /** How many minutes ago this reading was taken */
  minutes_ago: number;
  /** Device that recorded this reading */
  device?: string;
  /** Type of reading */
  type?: string;
}

export interface CGMDataResponse {
  /** Array of CGM readings */
  data: CGMReading[];
  /** When this data was last updated */
  last_updated: string;
  /** Optional analysis data */
  analysis?: CGMAnalysis;
  /** Time range metadata */
  time_range?: {
    start: string;
    end: string;
    hours: number;
  };
}

export interface CGMAnalysis {
  /** Time in range statistics */
  time_in_range?: {
    in_range: number;    // 70-180 mg/dL
    above_range: number; // >180 mg/dL
    below_range: number; // <70 mg/dL
  };
  /** Average glucose over the time period */
  average_glucose?: number;
  /** Glucose variability metric */
  glucose_variability?: number;
  /** Standard deviation */
  standard_deviation?: number;
  /** Coefficient of variation */
  coefficient_of_variation?: number;
}

/**
 * Glucose trend direction mapping
 */
export const GLUCOSE_TRENDS = {
  'DoubleUp': '⬆️⬆️',
  'SingleUp': '⬆️',
  'FortyFiveUp': '↗️',
  'Flat': '➡️',
  'FortyFiveDown': '↘️',
  'SingleDown': '⬇️',
  'DoubleDown': '⬇️⬇️',
  'NOT_COMPUTABLE': '?',
  'RATE_OUT_OF_RANGE': '!',
} as const;

export type GlucoseTrend = keyof typeof GLUCOSE_TRENDS;

/**
 * Glucose range classifications
 */
export const GLUCOSE_RANGES = {
  VERY_LOW: { min: 0, max: 54, label: 'Very Low', color: '#DC143C' },
  LOW: { min: 54, max: 70, label: 'Low', color: '#FF6B6B' },
  IN_RANGE: { min: 70, max: 180, label: 'In Range', color: '#32CD32' },
  HIGH: { min: 180, max: 250, label: 'High', color: '#FF8C00' },
  VERY_HIGH: { min: 250, max: 400, label: 'Very High', color: '#8B0000' },
} as const;

/**
 * Helper function to get glucose range classification
 */
export function getGlucoseRange(glucose: number) {
  if (glucose <= GLUCOSE_RANGES.VERY_LOW.max) return GLUCOSE_RANGES.VERY_LOW;
  if (glucose <= GLUCOSE_RANGES.LOW.max) return GLUCOSE_RANGES.LOW;
  if (glucose <= GLUCOSE_RANGES.IN_RANGE.max) return GLUCOSE_RANGES.IN_RANGE;
  if (glucose <= GLUCOSE_RANGES.HIGH.max) return GLUCOSE_RANGES.HIGH;
  return GLUCOSE_RANGES.VERY_HIGH;
}

/**
 * Helper function to get trend text with emoji
 */
export function getTrendText(direction: string): string {
  const trendMap: Record<string, string> = {
    'DoubleUp': '⬆️⬆️ Rising Fast',
    'SingleUp': '⬆️ Rising',
    'FortyFiveUp': '↗️ Rising Slowly',
    'Flat': '➡️ Stable',
    'FortyFiveDown': '↘️ Falling Slowly',
    'SingleDown': '⬇️ Falling',
    'DoubleDown': '⬇️⬇️ Falling Fast',
  };
  return trendMap[direction] || direction;
}
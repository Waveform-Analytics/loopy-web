// CGM data types - current implementation
export interface CGMReading {
  datetime: string;
  dateString?: string;  // Some API responses include both
  sgv: number;
  direction: string;
  trend?: number;
}

export interface CurrentGlucose {
  current_glucose: number | null;
  direction: string;
  trend: number;
  timestamp: string;
  minutes_ago: number;
}

export interface CGMAnalysis {
  time_in_range: {
    in_range: number;
    above_range: number;
    below_range: number;
    normal_percent?: number;  // Additional field from API
  };
  average_glucose: number;
  glucose_variability: number;
  basic_stats?: {
    avg_glucose: number;
    median_glucose: number;
    std_glucose: number;
    min_glucose: number;
    max_glucose: number;
  };
}

export interface CGMDataResponse {
  data: CGMReading[];
  analysis: CGMAnalysis;
  last_updated: string;
  time_range: {
    start: string;
    end: string;
    hours: number;
  };
}
export interface CGMReading {
  timestamp: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  device?: string;
}

export interface CurrentReading {
  current_glucose: number;
  direction: string;
  trend: number;
  timestamp: string;
  minutes_ago: number;
  device: string;
  type: string;
}

export interface HistoricalDataPoint {
  _id: string;
  sgv: number;
  date: number;
  dateString: string;
  trend: number;
  direction: string;
  device: string;
  type: string;
  utcOffset: number;
  sysTime: string;
  datetime: string;
  dateString_parsed: string;
  hour: number;
  day_of_week: number;
  date_only: string;
  glucose_category: string;
}

export interface HistoricalDataResponse {
  data: HistoricalDataPoint[];
}

export interface NormalizedCurrentReading extends CGMReading {
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
}

export interface CGMDataResponse {
  readings: CGMReading[];
  totalCount: number;
  timeRange: {
    start: string;
    end: string;
    hours: number;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
}

export type TimeRange = '1h' | '3h' | '6h' | '12h' | '24h';

export interface GlucoseTarget {
  min: number;
  max: number;
  unit: 'mg/dL' | 'mmol/L';
}
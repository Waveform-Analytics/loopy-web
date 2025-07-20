import { CGMReading } from './cgm';

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  formattedTime: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  timeRange: string;
  targetRange: {
    min: number;
    max: number;
  };
  height?: number;
  width?: string;
}

export interface ChartConfig {
  animations: boolean;
  refreshInterval: number;
  maxDataPoints: number;
  colors: {
    glucose: string;
    targetRange: string;
    grid: string;
    axis: string;
  };
}
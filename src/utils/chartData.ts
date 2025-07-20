import { format } from 'date-fns';
import { CGMReading, ChartDataPoint } from '../types';

export function transformCGMDataForChart(readings: CGMReading[]): ChartDataPoint[] {
  return readings
    .map(reading => ({
      timestamp: new Date(reading.timestamp).getTime(),
      value: reading.value,
      formattedTime: format(new Date(reading.timestamp), 'HH:mm'),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function generateMockCGMData(hours: number = 24): CGMReading[] {
  const readings: CGMReading[] = [];
  const now = new Date();
  const intervalMs = 5 * 60 * 1000; // 5 minutes
  const totalReadings = (hours * 60 * 60 * 1000) / intervalMs;

  for (let i = 0; i < totalReadings; i++) {
    const timestamp = new Date(now.getTime() - (totalReadings - i - 1) * intervalMs);
    
    // Generate realistic glucose values (80-200 mg/dL with some variation)
    const baseValue = 120 + Math.sin(i * 0.1) * 30; // Gentle wave pattern
    const noise = (Math.random() - 0.5) * 20; // Random variation
    const value = Math.max(60, Math.min(300, Math.round(baseValue + noise)));

    readings.push({
      timestamp: timestamp.toISOString(),
      value,
      trend: determineTrend(readings, value),
    });
  }

  return readings;
}

function determineTrend(previousReadings: CGMReading[], currentValue: number): 'up' | 'down' | 'stable' {
  if (previousReadings.length === 0) return 'stable';
  
  const lastReading = previousReadings[previousReadings.length - 1];
  const diff = currentValue - lastReading.value;
  
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

export function formatGlucoseValue(value: number, unit: 'mg/dL' | 'mmol/L' = 'mg/dL'): string {
  if (unit === 'mmol/L') {
    return (value / 18.0).toFixed(1);
  }
  return value.toString();
}

export function getGlucoseStatus(value: number): 'low' | 'normal' | 'high' {
  if (value < 70) return 'low';
  if (value > 180) return 'high';
  return 'normal';
}
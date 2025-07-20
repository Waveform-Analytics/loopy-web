/**
 * Recharts Time Series Chart Component
 * 
 * A clean, reliable chart implementation using Recharts for glucose data visualization
 */

import React, { useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { format } from 'date-fns';
import { CGMReading, ChartDataPoint } from '../../types';

export interface RechartsTimeSeriesChartProps {
  /** CGM data to display */
  data: CGMReading[];
  /** Chart height in pixels */
  height?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Whether to show target range visualization */
  showTargetRange?: boolean;
  /** Custom target range values */
  targetRange?: { low: number; high: number };
  /** Time range for title display */
  timeRange?: string;
}

/**
 * Convert CGM readings to Recharts format
 */
const processChartData = (readings: CGMReading[]) => {
  return readings
    .filter(reading => reading.sgv >= 20 && reading.sgv <= 600)
    .map(reading => ({
      timestamp: new Date(reading.dateString || reading.datetime).getTime(),
      glucose: reading.sgv,
      timeString: format(new Date(reading.dateString || reading.datetime), 'HH:mm'),
      dateString: reading.dateString || reading.datetime,
      reading,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Get glucose color based on value
 */
const getGlucoseColor = (glucose: number, targetRange = { low: 70, high: 180 }) => {
  if (glucose < targetRange.low * 0.77) return '#d32f2f'; // Very low
  if (glucose < targetRange.low) return '#f44336'; // Low
  if (glucose > targetRange.high * 1.39) return '#d32f2f'; // Very high
  if (glucose > targetRange.high) return '#ff9800'; // High
  return '#4caf50'; // In range
};

/**
 * Custom dot component for glucose values
 */
const CustomDot = React.memo(({ cx, cy, payload, targetRange }: any) => {
  if (!payload) return null;
  
  const color = getGlucoseColor(payload.glucose, targetRange);
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke="#fff"
      strokeWidth={1}
    />
  );
});

/**
 * Custom tooltip component
 */
const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          border: 'none',
        }}
      >
        <Typography variant="body2" sx={{ color: 'white', fontSize: '12px' }}>
          {`${data.glucose} mg/dL`}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', fontSize: '10px' }}>
          {format(new Date(data.timestamp), 'MMM dd, HH:mm')}
        </Typography>
      </Box>
    );
  }
  return null;
});

/**
 * Main Recharts Time Series Chart Component
 */
export const RechartsTimeSeriesChart: React.FC<RechartsTimeSeriesChartProps> = ({
  data,
  height = 400,
  isLoading = false,
  error,
  showTargetRange = true,
  targetRange = { low: 70, high: 180 },
  timeRange = '24h',
}) => {
  // Process data for Recharts
  const chartData = useMemo(() => processChartData(data), [data]);

  // Calculate Y-axis domain with padding and minimum range
  const yDomain = useMemo(() => {
    if (!chartData.length) return [50, 300];
    
    const values = chartData.map(d => d.glucose);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Enforce minimum range of 50 mg/dL
    const minRange = 50;
    const dataRange = max - min;
    
    if (dataRange < minRange) {
      // Center the data with minimum range
      const center = (min + max) / 2;
      const halfRange = minRange / 2;
      return [
        Math.max(40, Math.floor(center - halfRange)),
        Math.min(400, Math.ceil(center + halfRange))
      ];
    }
    
    // Normal padding for varied data
    const padding = dataRange * 0.1;
    return [
      Math.max(40, Math.floor(min - padding)),
      Math.min(400, Math.ceil(max + padding))
    ];
  }, [chartData]);

  // Custom X-axis tick formatter - memoized to prevent flickering
  const formatXAxisTick = useCallback((tickItem: any) => {
    return format(new Date(tickItem), 'HH:mm');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading glucose data...
        </Typography>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  // No data state
  if (!chartData.length) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height }}>
        <Typography variant="h6" color="text.secondary">
          No glucose data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check your CGM connection or try refreshing the data.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ width: '100%', height, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Glucose Levels - {timeRange}
      </Typography>
      
      <ResponsiveContainer width="100%" height={height - 80}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          
          {/* Target range area */}
          {showTargetRange && (
            <ReferenceArea
              y1={targetRange.low}
              y2={targetRange.high}
              fill="#4caf50"
              fillOpacity={0.1}
            />
          )}
          
          {/* Target range lines */}
          {showTargetRange && (
            <>
              <ReferenceLine
                y={targetRange.low}
                stroke="#4caf50"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
              <ReferenceLine
                y={targetRange.high}
                stroke="#4caf50"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
            </>
          )}
          
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXAxisTick}
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
          />
          
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => Math.round(value).toString()}
            label={{ 
              value: 'Glucose (mg/dL)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey="glucose"
            stroke="#2196f3"
            strokeWidth={2.5}
            dot={(props) => <CustomDot {...props} targetRange={targetRange} />}
            connectNulls={false}
            activeDot={{ r: 5, fill: '#2196f3' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default RechartsTimeSeriesChart;
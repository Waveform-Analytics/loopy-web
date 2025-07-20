/**
 * Simple CGM Chart - Built from scratch
 * 
 * A clean, simple implementation without any optimization baggage
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
import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import { CGMReading } from '../../types';

export interface SimpleCGMChartProps {
  data: CGMReading[];
  height?: number;
  timeRange?: string;
}

export const SimpleCGMChart: React.FC<SimpleCGMChartProps> = ({
  data,
  height = 400,
  timeRange = '3h',
}) => {
  // Convert CGM data to chart format - MEMOIZED to prevent re-animation
  const chartData = useMemo(() => 
    data
      .filter(reading => reading.sgv >= 20 && reading.sgv <= 600)
      .map(reading => ({
        timestamp: new Date(reading.dateString || reading.datetime).getTime(),
        glucose: reading.sgv,
        time: format(new Date(reading.dateString || reading.datetime), 'HH:mm'),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  , [data]);

  // Memoized tick formatter to prevent axis re-rendering
  const formatTick = useCallback((tickItem: any) => {
    return format(new Date(tickItem), 'HH:mm');
  }, []);

  // Memoized tooltip formatters
  const labelFormatter = useCallback((value: any) => format(new Date(value), 'MMM dd, HH:mm'), []);
  const valueFormatter = useCallback((value: any) => [`${value} mg/dL`, 'Glucose'], []);

  if (!chartData.length) {
    return (
      <Paper sx={{ p: 2, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height }}>
      <Typography variant="h6" gutterBottom>
        Glucose Levels - {timeRange}
      </Typography>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          
          {/* Target range */}
          <ReferenceArea y1={70} y2={180} fill="#4caf50" fillOpacity={0.1} />
          <ReferenceLine y={70} stroke="#4caf50" strokeDasharray="5 5" />
          <ReferenceLine y={180} stroke="#4caf50" strokeDasharray="5 5" />
          
          <XAxis 
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTick}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={labelFormatter}
            formatter={valueFormatter}
          />
          <Line 
            type="monotone" 
            dataKey="glucose" 
            stroke="#2196f3" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default SimpleCGMChart;
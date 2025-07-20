import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  Tooltip,
} from 'recharts';
import { Paper, Box, Typography, useTheme } from '@mui/material';
import { ChartDataPoint } from '../types';

interface SimpleCGMChartProps {
  data: ChartDataPoint[];
  timeRange: string;
  height?: number;
}

// Memoized tooltip component to prevent re-renders
const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ p: 1, border: '1px solid #ccc' }}>
        <Typography variant="body2">
          Time: {data.formattedTime}
        </Typography>
        <Typography variant="body2" color="primary">
          Glucose: {payload[0].value} mg/dL
        </Typography>
      </Paper>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export const SimpleCGMChart: React.FC<SimpleCGMChartProps> = React.memo(({
  data,
  timeRange,
  height = 400,
}) => {
  const theme = useTheme();

  // Memoize chart configuration to prevent re-renders
  const chartConfig = useMemo(() => ({
    colors: {
      glucose: theme.palette.primary.main,
      targetRange: theme.palette.success.light, // Green for target range
      targetRangeFill: theme.palette.success.main, // Darker green for fill
      grid: theme.palette.grey[300],
      axis: theme.palette.text.secondary,
      dots: theme.palette.primary.main,
    },
    targetRange: {
      min: 70,
      max: 180,
    },
  }), [theme]);

  // Memoize Y-axis domain to prevent flickering
  const yAxisDomain = useMemo(() => {
    if (data.length === 0) return [50, 250];
    
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = 20;
    
    return [
      Math.max(50, minValue - padding),
      Math.min(400, maxValue + padding)
    ];
  }, [data]);

  // Memoize X-axis domain to prevent flickering
  const xAxisDomain = useMemo(() => {
    if (data.length === 0) return ['dataMin', 'dataMax'];
    
    const timestamps = data.map(d => d.timestamp);
    return [Math.min(...timestamps), Math.max(...timestamps)];
  }, [data]);

  // Memoize tick formatter functions
  const formatXAxisTick = useMemo(() => 
    (value: number) => {
      const date = new Date(value);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }, []
  );

  const formatYAxisTick = useMemo(() => 
    (value: number) => `${value}`, 
    []
  );

  if (data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No glucose data available for {timeRange}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Glucose Levels - {timeRange}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Target range: {chartConfig.targetRange.min}-{chartConfig.targetRange.max} mg/dL 
          <span style={{ color: chartConfig.colors.targetRange, fontWeight: 'bold' }}>
            {' '}(green area)
          </span>
        </Typography>
      </Box>
      
      <Box sx={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={chartConfig.colors.grid}
            />
            
            {/* Target Range Background - Green underlay */}
            <ReferenceArea
              y1={chartConfig.targetRange.min}
              y2={chartConfig.targetRange.max}
              fill={chartConfig.colors.targetRangeFill}
              fillOpacity={0.15}
              stroke={chartConfig.colors.targetRange}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={xAxisDomain}
              tickFormatter={formatXAxisTick}
              stroke={chartConfig.colors.axis}
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis
              domain={yAxisDomain}
              tickFormatter={formatYAxisTick}
              stroke={chartConfig.colors.axis}
              fontSize={12}
              axisLine={false}
              tickLine={false}
              label={{ 
                value: 'mg/dL', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              animationDuration={0} // Disable animation to prevent flicker
            />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartConfig.colors.glucose}
              strokeWidth={2}
              dot={{ 
                r: 3, 
                fill: chartConfig.colors.dots, 
                stroke: chartConfig.colors.glucose, 
                strokeWidth: 1 
              }}
              activeDot={{ 
                r: 5, 
                fill: chartConfig.colors.dots, 
                stroke: chartConfig.colors.glucose, 
                strokeWidth: 2 
              }}
              animationDuration={0} // Critical: disable animations
              isAnimationActive={false} // Critical: disable animations
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

SimpleCGMChart.displayName = 'SimpleCGMChart';
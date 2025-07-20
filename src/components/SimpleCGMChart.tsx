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
import { Paper, Box, Typography, useTheme, Button, Chip } from '@mui/material';
import { ChartDataPoint } from '../types';

interface SimpleCGMChartProps {
  data: ChartDataPoint[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  timeUntilNext?: number;
  lastUpdate?: Date | null;
  nextExpectedReading?: Date | null;
  estimatedInterval?: number;
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

// Custom dot component that colors based on glucose value
const ColoredDot = React.memo((props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || typeof payload.value !== 'number') return null;
  
  const getGlucoseColor = (value: number): string => {
    const thresholds = {
      urgentLow: 55,
      low: 70,
      normal: 180,
      high: 250,
    };
    
    if (value < thresholds.urgentLow) {
      return '#d32f2f'; // Red - urgent low
    } else if (value < thresholds.low) {
      return '#ed6c02'; // Orange/Yellow - low
    } else if (value <= thresholds.normal) {
      return '#2e7d32'; // Green - in range
    } else if (value <= thresholds.high) {
      return '#ed6c02'; // Orange/Yellow - high
    } else {
      return '#d32f2f'; // Red - really high
    }
  };
  
  const color = getGlucoseColor(payload.value);
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke={color}
      strokeWidth={1}
    />
  );
});

ColoredDot.displayName = 'ColoredDot';

const timeRangeOptions = ['1h', '3h', '6h', '12h', '24h'];

const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes === 1) {
    return '1 min ago';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    if (diffHours === 1) {
      return remainingMinutes > 0 ? `1h ${remainingMinutes}m ago` : '1h ago';
    } else {
      return remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}m ago` : `${diffHours}h ago`;
    }
  }
};

export const SimpleCGMChart: React.FC<SimpleCGMChartProps> = React.memo(({
  data,
  timeRange,
  onTimeRangeChange,
  timeUntilNext = 0,
  lastUpdate,
  nextExpectedReading,
  estimatedInterval,
  height = 400,
}) => {
  const theme = useTheme();


  // Memoize chart configuration to prevent re-renders
  const chartConfig = useMemo(() => ({
    colors: {
      glucose: '#bdbdbd', // Light gray for line
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

  // Memoize countdown display to prevent unnecessary re-renders
  const countdownDisplay = useMemo(() => 
    formatCountdown(timeUntilNext), 
    [timeUntilNext]
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
      {/* Integrated Header with Time Range Pills */}
      <Box sx={{ mb: 2 }}>
        {/* Top row: Title and pill buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Glucose Levels
          </Typography>
          
          {/* Pill-shaped time range buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {timeRangeOptions.map((option) => (
              <Button
                key={option}
                variant={timeRange === option ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onTimeRangeChange(option)}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 3, // Pill shape
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  height: 32,
                }}
              >
                {option}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Compact stats row */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          fontSize: '0.8rem'
        }}>
          <Chip 
            label={`Next: ${countdownDisplay}`}
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
          
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              {formatTimeSince(lastUpdate)}
            </Typography>
          )}
          
          {estimatedInterval && (
            <Typography variant="caption" color="text.secondary">
              ~{Math.round(estimatedInterval / 60000)}min
            </Typography>
          )}
          
          <Typography variant="caption" color="text.secondary">
            Target: {chartConfig.targetRange.min}-{chartConfig.targetRange.max} mg/dL
            <span style={{ color: chartConfig.colors.targetRange, fontWeight: 'bold' }}>
              {' '}(green)
            </span>
          </Typography>
        </Box>
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
              dot={<ColoredDot />}
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
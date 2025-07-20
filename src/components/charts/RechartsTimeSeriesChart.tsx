import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Dot
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { CGMReading } from '../../types';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';

interface RechartsTimeSeriesChartProps {
  data: CGMReading[];
  height?: number;
  title?: string;
  defaultTimeRange?: TimeRange;
  isLiveMode?: boolean;
  onLiveModeChange?: (isLive: boolean) => void;
}

interface ChartDataPoint {
  timestamp: number;
  glucose: number;
  time: string;
  direction: string;
  color: string;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={3}
      fill={payload.color}
      stroke="#fff"
      strokeWidth={1}
    />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          boxShadow: 2
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {data.glucose} mg/dL
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.time}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          {data.direction}
        </Typography>
      </Box>
    );
  }
  return null;
};

export const RechartsTimeSeriesChart: React.FC<RechartsTimeSeriesChartProps> = ({
  data,
  height: propHeight,
  title = "Glucose Timeline",
  defaultTimeRange = '3h',
  isLiveMode: propIsLiveMode = true,
  onLiveModeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const height = propHeight || (isMobile ? 350 : 500);

  // Local state for time range and live mode
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [isLiveMode, setIsLiveMode] = useState(propIsLiveMode);

  const getGlucoseColor = useCallback((glucose: number) => {
    if (glucose < 70) return '#DC143C';    // Red for low
    if (glucose <= 180) return '#32CD32';  // Green for in range
    if (glucose <= 250) return '#FF8C00';  // Orange for high
    return '#8B0000';                      // Dark red for very high
  }, []);

  const getTrendText = useCallback((direction: string) => {
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
  }, []);

  // Filter data based on selected time range and live mode
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    const now = new Date();
    const hoursMap: Record<TimeRange, number> = {
      '1h': 1,
      '3h': 3,
      '6h': 6,
      '12h': 12,
      '24h': 24
    };
    
    const hoursToShow = hoursMap[selectedTimeRange];
    const cutoffTime = new Date(now.getTime() - (hoursToShow * 60 * 60 * 1000));
    
    // If live mode, show data from cutoff to now
    // If not live mode, show the most recent time range available
    if (isLiveMode) {
      return data.filter(reading => {
        const readingTime = new Date(reading.dateString || reading.datetime);
        return readingTime >= cutoffTime;
      });
    } else {
      // For non-live mode, show the most recent data in the selected range
      const sortedData = [...data].sort((a, b) => 
        new Date(b.dateString || b.datetime).getTime() - 
        new Date(a.dateString || a.datetime).getTime()
      );
      
      if (sortedData.length === 0) return [];
      
      const latestTime = new Date(sortedData[0].dateString || sortedData[0].datetime);
      const rangeStart = new Date(latestTime.getTime() - (hoursToShow * 60 * 60 * 1000));
      
      return sortedData.filter(reading => {
        const readingTime = new Date(reading.dateString || reading.datetime);
        return readingTime >= rangeStart;
      });
    }
  }, [data, selectedTimeRange, isLiveMode]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    return filteredData.map(reading => {
      const timestamp = new Date(reading.dateString || reading.datetime).getTime();
      return {
        timestamp,
        glucose: reading.sgv,
        time: new Date(reading.dateString || reading.datetime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        direction: getTrendText(reading.direction),
        color: getGlucoseColor(reading.sgv)
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredData, getTrendText, getGlucoseColor]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    
    const values = filteredData.map(d => d.sgv);
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const timeInRange = Math.round((inRange / values.length) * 100);
    
    return { average, timeInRange };
  }, [filteredData]);

  // Handle time range changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setSelectedTimeRange(newRange);
  };

  // Handle live mode toggle
  const handleLiveModeToggle = () => {
    const newLiveMode = !isLiveMode;
    setIsLiveMode(newLiveMode);
    onLiveModeChange?.(newLiveMode);
  };

  const formatXAxisTick = (tickItem: number) => {
    const date = new Date(tickItem);
    if (isMobile) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
        {/* Header with stats */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="h2"
            sx={{ flexGrow: 1 }}
          >
            {title}
          </Typography>
          
          {stats && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                label={`Avg: ${stats.average} mg/dL`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`TIR: ${stats.timeInRange}%`} 
                size="small" 
                color="success"
              />
            </Box>
          )}
        </Box>

        {/* Time Range Selector */}
        <Box mb={2}>
          <TimeRangeSelector
            selectedRange={selectedTimeRange}
            onRangeChange={handleTimeRangeChange}
            isLiveMode={isLiveMode}
            onLiveModeToggle={handleLiveModeToggle}
            dataCount={filteredData.length}
          />
        </Box>

        {/* Chart */}
        <Box sx={{ width: '100%', height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ 
              top: 5, 
              right: isMobile ? 5 : 30, 
              left: isMobile ? 5 : 20, 
              bottom: 5 
            }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider}
                opacity={0.3}
              />
              
              <XAxis 
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                fontSize={isMobile ? 10 : 12}
                interval="preserveStartEnd"
                minTickGap={isMobile ? 50 : 80}
              />
              
              <YAxis 
                domain={[50, 350]}
                fontSize={isMobile ? 10 : 12}
                label={isMobile ? undefined : { 
                  value: 'Glucose (mg/dL)', 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              
              {/* Target range background */}
              <ReferenceArea 
                y1={70} 
                y2={180} 
                fill={theme.palette.success.light}
                fillOpacity={0.1}
              />
              
              {/* Target range lines */}
              <ReferenceLine 
                y={70} 
                stroke={theme.palette.success.main}
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              <ReferenceLine 
                y={180} 
                stroke={theme.palette.warning.main}
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              
              <RechartsTooltip content={<CustomTooltip />} />
              
              <Line
                type="monotone"
                dataKey="glucose"
                stroke={theme.palette.primary.main}
                strokeWidth={isMobile ? 2 : 3}
                dot={<CustomDot />}
                activeDot={{ r: 5, stroke: theme.palette.primary.main, strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Instructions */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 1, display: 'block', textAlign: 'center' }}
        >
          {isMobile ? '📱 Touch chart to see details • Use time range buttons above' : '💻 Hover over chart for details • Select time range above'}
        </Typography>
      </CardContent>
    </Card>
  );
};
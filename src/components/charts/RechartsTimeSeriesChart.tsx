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
  Dot,
  Brush
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Timeline
} from '@mui/icons-material';
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
  
  // Zoom state management
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [brushEnabled, setBrushEnabled] = useState(!isMobile); // Disable brush on mobile by default

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
    // Reset zoom when changing time ranges to avoid confusion
    setZoomDomain(null);
  };

  // Handle live mode toggle
  const handleLiveModeToggle = () => {
    const newLiveMode = !isLiveMode;
    setIsLiveMode(newLiveMode);
    onLiveModeChange?.(newLiveMode);
  };

  // Get the full domain of the current data
  const fullDomain = useMemo((): [number, number] | null => {
    if (chartData.length === 0) return null;
    const timestamps = chartData.map(d => d.timestamp);
    return [Math.min(...timestamps), Math.max(...timestamps)];
  }, [chartData]);

  // Get the current display domain (either zoomed or full)
  const displayDomain = zoomDomain || fullDomain;

  // Zoom control functions
  const handleZoomIn = () => {
    if (!displayDomain) return;
    
    const [start, end] = displayDomain;
    const range = end - start;
    const center = start + range / 2;
    const newRange = range * 0.6; // Zoom in by 40%
    
    setZoomDomain([
      Math.max(fullDomain?.[0] || start, center - newRange / 2),
      Math.min(fullDomain?.[1] || end, center + newRange / 2)
    ]);
  };

  const handleZoomOut = () => {
    if (!displayDomain || !fullDomain) return;
    
    const [start, end] = displayDomain;
    const range = end - start;
    const center = start + range / 2;
    const newRange = range * 1.4; // Zoom out by 40%
    
    const newStart = Math.max(fullDomain[0], center - newRange / 2);
    const newEnd = Math.min(fullDomain[1], center + newRange / 2);
    
    // If we're close to full domain, just reset to full
    if (newEnd - newStart >= (fullDomain[1] - fullDomain[0]) * 0.9) {
      setZoomDomain(null);
    } else {
      setZoomDomain([newStart, newEnd]);
    }
  };

  const handleZoomReset = () => {
    setZoomDomain(null);
  };

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startTimestamp = chartData[brushData.startIndex]?.timestamp;
      const endTimestamp = chartData[brushData.endIndex]?.timestamp;
      
      if (startTimestamp && endTimestamp) {
        setZoomDomain([startTimestamp, endTimestamp]);
      }
    }
  };

  const toggleBrush = () => {
    setBrushEnabled(!brushEnabled);
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

        {/* Zoom Controls */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={1}
          sx={{
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Zoom:
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton 
                size="small" 
                onClick={handleZoomIn}
                disabled={!displayDomain}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton 
                size="small" 
                onClick={handleZoomOut}
                disabled={!zoomDomain}
              >
                <ZoomOut fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton 
                size="small" 
                onClick={handleZoomReset}
                disabled={!zoomDomain}
              >
                <CenterFocusStrong fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {!isMobile && (
              <Tooltip title={brushEnabled ? "Hide Zoom Selector" : "Show Zoom Selector"}>
                <IconButton 
                  size="small" 
                  onClick={toggleBrush}
                  color={brushEnabled ? "primary" : "default"}
                >
                  <Timeline fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {zoomDomain && (
              <Chip 
                label="Zoomed" 
                size="small" 
                color="primary" 
                variant="outlined"
                onDelete={handleZoomReset}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
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
                domain={displayDomain || ['dataMin', 'dataMax']}
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
              
              {/* Brush for zoom selection - only show on desktop when enabled */}
              {brushEnabled && !isMobile && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.light}
                  fillOpacity={0.1}
                  onChange={handleBrushChange}
                  tickFormatter={formatXAxisTick}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Mobile instructions */}
        {isMobile && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            📱 Use zoom buttons above • Touch chart to see details
          </Typography>
        )}
        
        {/* Desktop instructions */}
        {!isMobile && brushEnabled && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            💻 Drag the timeline below chart to zoom • Use zoom buttons for precise control
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
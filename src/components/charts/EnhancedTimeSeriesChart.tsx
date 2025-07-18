import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Card, 
  CardContent, 
  Typography,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  Home, 
  TouchApp, 
  Fullscreen,
  FullscreenExit 
} from '@mui/icons-material';
import { CGMReading } from '../../types';

interface EnhancedTimeSeriesChartProps {
  data: CGMReading[];
  height?: number;
  title?: string;
  onTimeRangeChange?: (startTime: Date, endTime: Date) => void;
}

export const EnhancedTimeSeriesChart: React.FC<EnhancedTimeSeriesChartProps> = ({ 
  data, 
  height: propHeight,
  title = "Enhanced Glucose Time Series",
  onTimeRangeChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Responsive height calculation
  const defaultHeight = isMobile ? 350 : isTablet ? 450 : 500;
  const height = propHeight || defaultHeight;
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchMode, setTouchMode] = useState(isMobile);

  // Auto-enable touch mode on mobile
  useEffect(() => {
    setTouchMode(isMobile);
  }, [isMobile]);

  // Enhanced glucose color coding
  const getGlucoseColor = useCallback((glucose: number) => {
    if (glucose < 54) return '#8B0000';    // Dark red for severe low
    if (glucose < 70) return '#DC143C';    // Red for low
    if (glucose < 80) return '#FF6347';    // Tomato for borderline low
    if (glucose <= 180) return '#32CD32';  // Lime green for in range
    if (glucose <= 250) return '#FF8C00';  // Orange for high
    if (glucose <= 300) return '#FF4500';  // Red-orange for very high
    return '#8B0000';                      // Dark red for critical high
  }, []);

  // Enhanced trend text
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

  // Enhanced data processing with smart point density and color coding
  const processedData = useMemo(() => {
    if (!data.length) return { x: [], y: [], colors: [], hoverText: [] };
    
    // Smart data sampling based on zoom level and screen size
    const maxPoints = isMobile ? 200 : isTablet ? 300 : 500;
    const samplingRate = Math.max(1, Math.floor(data.length / (maxPoints * zoomLevel)));
    const sampledData = data.filter((_, index) => index % samplingRate === 0);
    
    return {
      x: sampledData.map(d => new Date(d.dateString || d.datetime)),
      y: sampledData.map(d => d.sgv),
      colors: sampledData.map(d => getGlucoseColor(d.sgv)),
      hoverText: sampledData.map(d => 
        `${d.sgv} mg/dL<br>${getTrendText(d.direction)}<br>${new Date(d.dateString || d.datetime).toLocaleTimeString()}`
      ),
      raw: sampledData
    };
  }, [data, zoomLevel, isMobile, isTablet, getGlucoseColor, getTrendText]);

  // Calculate statistics for display
  const stats = useMemo(() => {
    if (!data.length) return null;
    
    const values = data.map(d => d.sgv);
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const high = values.filter(v => v > 180).length;
    const low = values.filter(v => v < 70).length;
    
    return {
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      inRange: Math.round((inRange / values.length) * 100),
      high: Math.round((high / values.length) * 100),
      low: Math.round((low / values.length) * 100),
      latest: values[values.length - 1]
    };
  }, [data]);

  // Enhanced trace with responsive styling
  const trace: any = {
    x: processedData.x,
    y: processedData.y,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Glucose',
    line: { 
      color: theme.palette.primary.main,
      width: isMobile ? 2 : 3
    },
    marker: { 
      size: isMobile ? 4 : 6,
      color: processedData.colors,
      line: { 
        color: '#fff', 
        width: isMobile ? 0.5 : 1 
      }
    },
    connectgaps: true,
    hovertemplate: '%{text}<extra></extra>',
    text: processedData.hoverText,
    hoverinfo: 'text'
  };

  // Mobile-optimized layout
  const layout: any = {
    title: {
      text: title,
      font: { 
        size: isMobile ? 16 : 20, 
        family: theme.typography.fontFamily 
      },
      x: 0.05,
      y: 0.95
    },
    xaxis: { 
      title: { 
        text: isMobile ? '' : 'Time', 
        font: { size: isMobile ? 10 : 14 }
      },
      type: 'date',
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.1)',
      showspikes: !isMobile,
      spikethickness: 1,
      spikecolor: '#999',
      tickfont: { size: isMobile ? 10 : 12 },
      tickangle: isMobile ? -45 : 0
    },
    yaxis: { 
      title: { 
        text: isMobile ? 'mg/dL' : 'Glucose (mg/dL)', 
        font: { size: isMobile ? 10 : 14 }
      },
      range: [40, Math.max(400, Math.max(...(processedData.y.length ? processedData.y : [400])) + 50)],
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.1)',
      zeroline: false,
      tickfont: { size: isMobile ? 10 : 12 }
    },
    shapes: [
      // Target range visualization (70-180 mg/dL)
      {
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0, x1: 1, y0: 70, y1: 180,
        fillcolor: 'rgba(76, 175, 80, 0.08)',
        line: { width: 0 }
      },
      // Target range lines
      {
        type: 'line',
        xref: 'paper', yref: 'y',
        x0: 0, x1: 1, y0: 70, y1: 70,
        line: { color: '#4caf50', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'paper', yref: 'y',
        x0: 0, x1: 1, y0: 180, y1: 180,
        line: { color: '#ff9800', width: 1, dash: 'dash' }
      }
    ],
    margin: { 
      t: isMobile ? 40 : 60, 
      b: isMobile ? 40 : 60, 
      l: isMobile ? 40 : 60, 
      r: isMobile ? 20 : 30 
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest',
    dragmode: touchMode ? 'pan' : 'zoom',
    // Mobile-optimized font sizes
    font: { size: isMobile ? 10 : 12 }
  };

  // Mobile-first configuration
  const config: any = {
    responsive: true,
    displayModeBar: !isMobile, // Hide toolbar on mobile for cleaner look
    modeBarButtonsToRemove: isMobile ? [] : ['pan2d', 'select2d', 'lasso2d'],
    modeBarButtonsToAdd: isMobile ? [] : ['hoverClosestCartesian'],
    doubleClick: 'reset+autosize',
    showTips: false,
    scrollZoom: true,
    touchZoom: true,
    touchPan: true,
    staticPlot: false
  };

  // Control handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const toggleTouchMode = useCallback(() => {
    setTouchMode(prev => !prev);
  }, []);

  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: isFullscreen ? '100vh' : 'auto',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        borderRadius: isFullscreen ? 0 : undefined
      }}
    >
      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
        {/* Mobile-optimized header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={1}
          flexWrap="wrap"
          gap={1}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="h2"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            {isMobile ? "Glucose Chart" : title}
          </Typography>
          
          {/* Stats chips - responsive layout */}
          {stats && (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              <Chip 
                label={`Avg: ${stats.average}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
              />
              <Chip 
                label={`TIR: ${stats.inRange}%`} 
                size="small" 
                color="success"
                sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
              />
            </Box>
          )}
        </Box>

        {/* Control panel - mobile optimized */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={1}
        >
          <Box display="flex" gap={0.5}>
            {!isMobile && (
              <>
                <Tooltip title="Zoom In">
                  <IconButton size="small" onClick={handleZoomIn}>
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <IconButton size="small" onClick={handleZoomOut}>
                    <ZoomOut fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Reset View">
              <IconButton size="small" onClick={handleReset}>
                <Home fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box display="flex" gap={0.5}>
            <Tooltip title={touchMode ? "Touch Mode On" : "Touch Mode Off"}>
              <IconButton 
                size="small" 
                onClick={toggleTouchMode}
                color={touchMode ? "primary" : "default"}
              >
                <TouchApp fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton size="small" onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Chart container */}
        <Box sx={{ width: '100%', height: isFullscreen ? 'calc(100vh - 120px)' : `${height}px` }}>
          <Plot
            data={[trace]}
            layout={{
              ...layout,
              height: isFullscreen ? window.innerHeight - 120 : height,
              autosize: true
            }}
            config={config}
            style={{ width: '100%', height: '100%' }}
            onRelayout={(event: any) => {
              // Handle zoom and pan events
              if (event['xaxis.range[0]'] && event['xaxis.range[1]']) {
                const startTime = new Date(event['xaxis.range[0]']);
                const endTime = new Date(event['xaxis.range[1]']);
                onTimeRangeChange?.(startTime, endTime);
              }
            }}
            useResizeHandler={true}
          />
        </Box>

        {/* Mobile-specific touch instructions */}
        {isMobile && touchMode && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            📱 Pinch to zoom • Drag to pan • Double tap to reset
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
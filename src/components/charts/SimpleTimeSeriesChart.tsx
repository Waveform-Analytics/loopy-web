import React from 'react';
import Plot from 'react-plotly.js';
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

interface SimpleTimeSeriesChartProps {
  data: CGMReading[];
  height?: number;
  title?: string;
}

export const SimpleTimeSeriesChart: React.FC<SimpleTimeSeriesChartProps> = ({ 
  data, 
  height: propHeight,
  title = "24-Hour Glucose Timeline"
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Responsive height
  const height = propHeight || (isMobile ? 350 : 500);

  // Process data for plotting
  const processedData = React.useMemo(() => {
    if (!data.length) return { x: [], y: [], colors: [] };
    
    const getGlucoseColor = (glucose: number) => {
      if (glucose < 70) return '#DC143C';    // Red for low
      if (glucose <= 180) return '#32CD32';  // Green for in range
      if (glucose <= 250) return '#FF8C00';  // Orange for high
      return '#8B0000';                      // Dark red for very high
    };
    
    return {
      x: data.map(d => new Date(d.dateString || d.datetime)),
      y: data.map(d => d.sgv),
      colors: data.map(d => getGlucoseColor(d.sgv))
    };
  }, [data]);

  // Calculate basic stats
  const stats = React.useMemo(() => {
    if (!data.length) return null;
    
    const values = data.map(d => d.sgv);
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const timeInRange = Math.round((inRange / values.length) * 100);
    
    return { average, timeInRange };
  }, [data]);

  // Plotly trace
  const trace = {
    x: processedData.x,
    y: processedData.y,
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    name: 'Glucose',
    line: { 
      color: theme.palette.primary.main,
      width: isMobile ? 2 : 3
    },
    marker: { 
      size: isMobile ? 4 : 6,
      color: processedData.colors,
      line: { color: '#fff', width: 1 }
    },
    hovertemplate: '<b>%{y} mg/dL</b><br>%{x}<extra></extra>'
  };

  // Plotly layout with type assertion
  const layout: any = {
    title: {
      text: title,
      font: { size: isMobile ? 16 : 20 },
      x: 0.05
    },
    xaxis: { 
      title: isMobile ? '' : 'Time',
      type: 'date',
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    yaxis: { 
      title: isMobile ? 'mg/dL' : 'Glucose (mg/dL)',
      range: [50, Math.max(350, Math.max(...(processedData.y.length ? processedData.y : [350])) + 50)],
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    shapes: [
      // Target range shading (70-180 mg/dL)
      {
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0, x1: 1, y0: 70, y1: 180,
        fillcolor: 'rgba(76, 175, 80, 0.1)',
        line: { width: 0 }
      },
      // Target lines
      {
        type: 'line',
        xref: 'paper',
        yref: 'y',
        x0: 0, x1: 1, y0: 70, y1: 70,
        line: { color: '#4caf50', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'paper',
        yref: 'y',
        x0: 0, x1: 1, y0: 180, y1: 180,
        line: { color: '#ff9800', width: 1, dash: 'dash' }
      }
    ],
    margin: { 
      t: isMobile ? 50 : 70, 
      b: isMobile ? 50 : 70, 
      l: isMobile ? 50 : 70, 
      r: isMobile ? 30 : 50 
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest'
  };

  // Plotly config with type assertion
  const config: any = {
    responsive: true,
    displayModeBar: !isMobile,
    doubleClick: 'reset+autosize',
    scrollZoom: true
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

        {/* Chart */}
        <Box sx={{ width: '100%', height: `${height}px` }}>
          <Plot
            data={[trace]}
            layout={{
              ...layout,
              height: height,
              autosize: true
            }}
            config={config}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </Box>

        {/* Mobile instructions */}
        {isMobile && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            📱 Scroll to zoom • Drag to pan • Double tap to reset
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
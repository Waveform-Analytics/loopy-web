/**
 * CGM Chart Component
 * 
 * Main D3.js chart component for displaying glucose data with smooth pan/zoom interactions
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import * as d3 from 'd3';
import { 
  CGMReading, 
  ChartDataPoint, 
  TimeRange, 
  ChartConfig,
  DEFAULT_CHART_CONFIG 
} from '../../types';
import { useChartInteractions, useChartTooltip } from '../../hooks';

/**
 * CGM Chart component props
 */
export interface CGMChartProps {
  /** CGM data to display */
  data: CGMReading[];
  /** Chart height in pixels */
  height?: number;
  /** Chart width (auto-calculated if not provided) */
  width?: number;
  /** Time range for initial zoom */
  timeRange?: TimeRange;
  /** Whether user has manually interacted with chart */
  userHasInteracted?: boolean;
  /** Callback when user interacts with chart */
  onUserInteraction?: () => void;
  /** Chart configuration overrides */
  config?: Partial<ChartConfig>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Whether to show target range visualization */
  showTargetRange?: boolean;
  /** Custom target range values */
  targetRange?: { low: number; high: number };
  /** Callback for data point hover */
  onDataPointHover?: (dataPoint: ChartDataPoint | null) => void;
}

/**
 * Convert CGM readings to chart data points
 */
const processChartData = (readings: CGMReading[]): ChartDataPoint[] => {
  return readings
    .filter(reading => reading.sgv >= 20 && reading.sgv <= 600) // Filter invalid readings
    .map(reading => ({
      timestamp: new Date(reading.dateString || reading.datetime),
      glucose: reading.sgv,
      reading,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

/**
 * Calculate time range domain for zoom
 */
const getTimeRangeDomain = (
  data: ChartDataPoint[],
  timeRange: TimeRange
): [Date, Date] => {
  if (!data.length) {
    const now = new Date();
    return [new Date(now.getTime() - 24 * 60 * 60 * 1000), now];
  }

  const now = new Date();
  const rangeHours = parseInt(timeRange.replace('h', ''));
  const startTime = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);
  
  return [startTime, now];
};

/**
 * Get glucose color based on value
 */
const getGlucoseColor = (glucose: number, targetRange: { low: number; high: number }) => {
  if (glucose < targetRange.low * 0.77) return '#d32f2f'; // Very low - dark red
  if (glucose < targetRange.low) return '#f44336'; // Low - red
  if (glucose > targetRange.high * 1.39) return '#d32f2f'; // Very high - dark red
  if (glucose > targetRange.high) return '#ff9800'; // High - orange
  return '#4caf50'; // In range - green
};

/**
 * Calculate Y-axis domain with padding
 */
const calculateYDomain = (
  data: ChartDataPoint[],
  userHasInteracted: boolean,
  currentTransform?: d3.ZoomTransform,
  xScale?: d3.ScaleTime<number, number>
): [number, number] => {
  if (!data.length) return [50, 300];

  let visibleData = data;

  // If user has interacted and we have transform info, show only visible data
  if (userHasInteracted && currentTransform && xScale) {
    const newXScale = currentTransform.rescaleX(xScale);
    const [xMin, xMax] = newXScale.domain();
    visibleData = data.filter(d => d.timestamp >= xMin && d.timestamp <= xMax);
  }

  if (!visibleData.length) visibleData = data;

  const values = visibleData.map(d => d.glucose);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Add 10% padding
  const padding = (max - min) * 0.1;
  const paddedMin = Math.max(40, min - padding);
  const paddedMax = Math.min(400, max + padding);

  // Ensure minimum range of 100 mg/dL
  const range = paddedMax - paddedMin;
  if (range < 100) {
    const center = (paddedMin + paddedMax) / 2;
    return [Math.max(40, center - 50), Math.min(400, center + 50)];
  }

  return [paddedMin, paddedMax];
};

/**
 * Main CGM Chart Component
 */
export const CGMChart: React.FC<CGMChartProps> = ({
  data,
  height = 400,
  width,
  timeRange = '24h',
  userHasInteracted = false,
  onUserInteraction,
  config = {},
  isLoading = false,
  error,
  showTargetRange = true,
  targetRange = { low: 70, high: 180 },
  onDataPointHover,
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Chart configuration
  const chartConfig = useMemo(() => ({
    ...DEFAULT_CHART_CONFIG,
    ...config,
  }), [config]);

  // Chart interactions hook
  const {
    svgRef,
    initializeZoom,
    applyInitialTransform,
    getCurrentTransform,
    resetZoom,
  } = useChartInteractions({
    config: chartConfig,
    onInteractionStart: onUserInteraction,
    onTransformChange: (transform) => {
      currentTransformRef.current = transform;
      // Trigger re-render for Y-axis auto-scaling
      if (!userHasInteracted) {
        onUserInteraction?.();
      }
    },
  });

  // Tooltip hook
  const { tooltipRef, showTooltip, hideTooltip } = useChartTooltip({
    formatter: (dataPoint) => 
      `${dataPoint.glucose} mg/dL<br/>${dataPoint.timestamp.toLocaleTimeString()}`,
  });

  // Process data
  const chartData = useMemo(() => processChartData(data), [data]);

  // Calculate dimensions
  const containerWidth = width || (containerRef.current?.clientWidth ?? 800);
  const chartWidth = containerWidth - chartConfig.margin.left - chartConfig.margin.right;
  const chartHeight = height - chartConfig.margin.top - chartConfig.margin.bottom;

  // Create scales
  const xScale = useMemo(() => {
    const extent = d3.extent(chartData, d => d.timestamp) as [Date, Date];
    if (!extent[0] || !extent[1]) {
      const now = new Date();
      return d3.scaleTime()
        .domain([new Date(now.getTime() - 24 * 60 * 60 * 1000), now])
        .range([0, chartWidth]);
    }
    return d3.scaleTime()
      .domain(extent)
      .range([0, chartWidth]);
  }, [chartData, chartWidth]);

  const yDomain = useMemo(() => 
    calculateYDomain(chartData, userHasInteracted, getCurrentTransform() || undefined, xScale),
    [chartData, userHasInteracted, xScale, getCurrentTransform]
  );

  const yScale = useMemo(() => 
    d3.scaleLinear()
      .domain(yDomain)
      .range([chartHeight, 0])
      .nice(),
    [yDomain, chartHeight]
  );

  // Line generator
  const line = useMemo(() => 
    d3.line<ChartDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.glucose))
      .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  // Render chart
  const renderChart = useCallback(() => {
    if (!svgRef.current || !chartData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Create main group with margins
    const g = svg.append('g')
      .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`);

    // Add clipping path
    const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Target range background
    if (showTargetRange) {
      g.append('rect')
        .attr('class', 'target-range-bg')
        .attr('x', 0)
        .attr('width', chartWidth)
        .attr('y', yScale(targetRange.high))
        .attr('height', Math.max(0, yScale(targetRange.low) - yScale(targetRange.high)))
        .attr('fill', '#4caf50')
        .attr('opacity', 0.1);

      // Target range lines
      [targetRange.low, targetRange.high].forEach((value, i) => {
        g.append('line')
          .attr('class', i === 0 ? 'target-line-low' : 'target-line-high')
          .attr('x1', 0)
          .attr('x2', chartWidth)
          .attr('y1', yScale(value))
          .attr('y2', yScale(value))
          .attr('stroke', '#4caf50')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.7);
      });
    }

    // Create chart data group with clipping
    const chartGroup = g.append('g')
      .attr('class', 'chart-data')
      .attr('clip-path', `url(#${clipId})`);

    // Add glucose line
    chartGroup.append('path')
      .datum(chartData)
      .attr('class', 'glucose-line')
      .attr('fill', 'none')
      .attr('stroke', '#2196f3')
      .attr('stroke-width', 2.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Add data points
    chartGroup.selectAll('.dot')
      .data(chartData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.glucose))
      .attr('r', 3)
      .attr('fill', d => getGlucoseColor(d.glucose, targetRange))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 5);
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        showTooltip(mouseX, mouseY, d);
        onDataPointHover?.(d);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', 3);
        hideTooltip();
        onDataPointHover?.(null);
      });

    // Add X axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%H:%M') as any)
      .ticks(6);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis as any);

    // Add Y axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => `${d}`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis as any);

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Time');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - chartConfig.margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Glucose (mg/dL)');

    // Initialize zoom
    const zoom = initializeZoom(containerWidth, height, xScale, yScale);
    svg.call(zoom);

    // Apply initial time range zoom
    if (!userHasInteracted) {
      const timeRangeDomain = getTimeRangeDomain(chartData, timeRange);
      const fullDomain = d3.extent(chartData, d => d.timestamp) as [Date, Date];
      if (fullDomain[0] && fullDomain[1]) {
        applyInitialTransform(zoom, xScale, timeRangeDomain, fullDomain, chartWidth);
      }
    }

  }, [
    chartData, 
    chartWidth, 
    chartHeight, 
    xScale, 
    yScale, 
    line, 
    timeRange, 
    userHasInteracted,
    showTargetRange,
    targetRange,
    chartConfig.margin,
    initializeZoom,
    applyInitialTransform,
    showTooltip,
    hideTooltip,
    onDataPointHover
  ]);

  // Render chart when data or dimensions change
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      renderChart();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart]);

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
        <Alert severity="error">
          {error}
        </Alert>
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
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{
            display: 'block',
            cursor: userHasInteracted ? 'grab' : 'default',
          }}
        />
        
        {/* Tooltip */}
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        />
      </Paper>
    </Box>
  );
};

export default CGMChart;
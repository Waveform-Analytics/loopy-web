/**
 * Simplified CGM Chart Component
 * 
 * A more stable D3.js chart focused on reliable interactions
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import * as d3 from 'd3';
import { CGMReading, ChartDataPoint, TimeRange } from '../../types';

export interface SimpleCGMChartProps {
  data: CGMReading[];
  height?: number;
  width?: number;
  timeRange?: TimeRange;
  isLoading?: boolean;
  error?: string;
  showTargetRange?: boolean;
  targetRange?: { low: number; high: number };
  onDataPointHover?: (dataPoint: ChartDataPoint | null) => void;
}

const processChartData = (readings: CGMReading[]): ChartDataPoint[] => {
  return readings
    .filter(reading => reading.sgv >= 20 && reading.sgv <= 600)
    .map(reading => ({
      timestamp: new Date(reading.dateString || reading.datetime),
      glucose: reading.sgv,
      reading,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

const getGlucoseColor = (glucose: number, targetRange = { low: 70, high: 180 }) => {
  if (glucose < targetRange.low * 0.77) return '#d32f2f';
  if (glucose < targetRange.low) return '#f44336';
  if (glucose > targetRange.high * 1.39) return '#d32f2f';
  if (glucose > targetRange.high) return '#ff9800';
  return '#4caf50';
};

export const SimpleCGMChart: React.FC<SimpleCGMChartProps> = ({
  data,
  height = 400,
  width,
  timeRange = '24h',
  isLoading = false,
  error,
  showTargetRange = true,
  targetRange = { low: 70, high: 180 },
  onDataPointHover,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Process data
  const chartData = useMemo(() => processChartData(data), [data]);

  // Calculate dimensions
  const margin = useMemo(() => ({ top: 20, right: 30, bottom: 60, left: 60 }), []);
  const containerWidth = width || (containerRef.current?.clientWidth ?? 800);
  const chartWidth = containerWidth - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create scales
  const xScale = useMemo(() => {
    if (!chartData.length) {
      const now = new Date();
      return d3.scaleTime()
        .domain([new Date(now.getTime() - 24 * 60 * 60 * 1000), now])
        .range([0, chartWidth]);
    }
    
    const extent = d3.extent(chartData, d => d.timestamp) as [Date, Date];
    return d3.scaleTime()
      .domain(extent)
      .range([0, chartWidth]);
  }, [chartData, chartWidth]);

  const yScale = useMemo(() => {
    if (!chartData.length) {
      return d3.scaleLinear()
        .domain([50, 300])
        .range([chartHeight, 0]);
    }

    const values = chartData.map(d => d.glucose);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return d3.scaleLinear()
      .domain([Math.max(40, min - padding), Math.min(400, max + padding)])
      .range([chartHeight, 0])
      .nice();
  }, [chartData, chartHeight]);

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
    svg.selectAll('*').remove();

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

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
        .attr('x', 0)
        .attr('width', chartWidth)
        .attr('y', yScale(targetRange.high))
        .attr('height', Math.max(0, yScale(targetRange.low) - yScale(targetRange.high)))
        .attr('fill', '#4caf50')
        .attr('opacity', 0.1);

      // Target range lines
      [targetRange.low, targetRange.high].forEach((value) => {
        g.append('line')
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
      .attr('clip-path', `url(#${clipId})`);

    // Add glucose line
    chartGroup.append('path')
      .datum(chartData)
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
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 5);
        onDataPointHover?.(d);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 3);
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
    const yAxis = d3.axisLeft(yScale).ticks(6);
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis as any);

    // Add axis labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Time');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Glucose (mg/dL)');

    // Setup zoom behavior with improved trackpad support
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 50])
      .extent([[0, 0], [containerWidth, height]])
      .translateExtent([[-chartWidth * 2, -chartHeight * 2], [chartWidth * 3, chartHeight * 3]])
      .filter((event) => {
        // Allow mouse wheel events for trackpad zoom
        // Allow drag events for trackpad pan
        // Exclude right-click and ctrl+click
        return !event.ctrlKey && event.button !== 2;
      })
      .wheelDelta((event) => {
        // Improved wheel delta for better trackpad sensitivity
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002);
      })
      .on('start', (event) => {
        if (svgRef.current) {
          d3.select(svgRef.current).style('cursor', 'grabbing');
        }
      })
      .on('end', (event) => {
        if (svgRef.current) {
          d3.select(svgRef.current).style('cursor', 'grab');
        }
      })
      .on('zoom', (event) => {
        const { transform } = event;
        
        // Store the transform to prevent snapping
        currentTransformRef.current = transform;
        
        // Create new scales
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        // Update line with better performance
        const newLine = d3.line<ChartDataPoint>()
          .x(d => newXScale(d.timestamp))
          .y(d => newYScale(d.glucose))
          .curve(d3.curveMonotoneX);

        chartGroup.select('path').attr('d', newLine(chartData));

        // Update dots
        chartGroup.selectAll('.dot')
          .attr('cx', (d: any) => newXScale(d.timestamp))
          .attr('cy', (d: any) => newYScale(d.glucose));

        // Update axes
        (g.select('.x-axis') as any).call(d3.axisBottom(newXScale).tickFormat(d3.timeFormat('%H:%M') as any));
        (g.select('.y-axis') as any).call(d3.axisLeft(newYScale));

        // Update target range elements if shown
        if (showTargetRange) {
          g.select('rect')
            .attr('y', newYScale(targetRange.high))
            .attr('height', Math.max(0, newYScale(targetRange.low) - newYScale(targetRange.high)));

          g.selectAll('line')
            .filter(function() { return d3.select(this).attr('stroke') === '#4caf50'; })
            .attr('y1', (d, i) => newYScale(i === 0 ? targetRange.low : targetRange.high))
            .attr('y2', (d, i) => newYScale(i === 0 ? targetRange.low : targetRange.high));
        }
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Restore previous transform to prevent snapping
    if (currentTransformRef.current && currentTransformRef.current.k !== 1) {
      svg.call(zoom.transform, currentTransformRef.current);
    }

  }, [chartData, chartWidth, chartHeight, xScale, yScale, line, showTargetRange, targetRange, containerWidth, height, margin, onDataPointHover]);

  // Re-render when data or timeRange changes
  useEffect(() => {
    renderChart();
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
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height }}>
      <Paper elevation={1} sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block', cursor: 'grab' }}
        />
      </Paper>
    </Box>
  );
};

export default SimpleCGMChart;
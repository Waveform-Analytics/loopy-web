/**
 * D3 chart interactions hook
 * 
 * Manages D3.js zoom/pan interactions, transforms, and chart behavior state
 */

import { useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartDataPoint, ChartConfig, DEFAULT_CHART_CONFIG } from '../types';

/**
 * Chart interactions hook options
 */
export interface UseChartInteractionsOptions {
  /** Chart configuration */
  config?: Partial<ChartConfig>;
  /** Callback when user starts interacting */
  onInteractionStart?: () => void;
  /** Callback when user stops interacting */
  onInteractionEnd?: () => void;
  /** Callback when zoom/pan transform changes */
  onTransformChange?: (transform: d3.ZoomTransform) => void;
  /** Whether to enable interactions */
  enabled?: boolean;
}

/**
 * Chart interactions hook return type
 */
export interface UseChartInteractionsReturn {
  /** SVG element ref */
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Chart container ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Initialize D3 zoom behavior */
  initializeZoom: (
    width: number,
    height: number,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) => d3.ZoomBehavior<SVGSVGElement, unknown>;
  /** Apply initial transform to focus on specific domain */
  applyInitialTransform: (
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
    xScale: d3.ScaleTime<number, number>,
    targetDomain: [Date, Date],
    fullDomain: [Date, Date],
    width: number
  ) => void;
  /** Get current transform */
  getCurrentTransform: () => d3.ZoomTransform | null;
  /** Reset zoom to initial state */
  resetZoom: (zoom: d3.ZoomBehavior<SVGSVGElement, unknown>) => void;
  /** Check if user is currently interacting */
  isInteracting: boolean;
  /** Chart configuration with defaults */
  chartConfig: ChartConfig;
}

/**
 * Custom hook for D3 chart interactions
 */
export const useChartInteractions = (
  options: UseChartInteractionsOptions = {}
): UseChartInteractionsReturn => {
  const {
    config = {},
    onInteractionStart,
    onInteractionEnd,
    onTransformChange,
    enabled = true,
  } = options;

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const isInteractingRef = useRef<boolean>(false);

  // Merged chart configuration
  const chartConfig = useMemo(() => ({
    ...DEFAULT_CHART_CONFIG,
    ...config,
  }), [config]);

  // Initialize D3 zoom behavior
  const initializeZoom = useCallback((
    width: number,
    height: number,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) => {
    if (!enabled) {
      // Return a no-op zoom behavior if disabled
      return d3.zoom<SVGSVGElement, unknown>().on('zoom', null);
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([chartConfig.zoomLimits.scaleMin, chartConfig.zoomLimits.scaleMax])
      .extent([[0, 0], [width, height]])
      // No translateExtent for unrestricted panning
      .filter((event) => {
        // Allow all mouse and touch events for better trackpad support
        return !event.ctrlKey && !event.button;
      })
      .on('start', () => {
        if (!svgRef.current) return;
        
        // Update interaction state
        isInteractingRef.current = true;
        
        // Visual feedback
        d3.select(svgRef.current).style('cursor', 'grabbing');
        
        // Callback
        onInteractionStart?.();
      })
      .on('end', () => {
        if (!svgRef.current) return;
        
        // Update interaction state
        isInteractingRef.current = false;
        
        // Visual feedback
        d3.select(svgRef.current).style('cursor', 'grab');
        
        // Callback
        onInteractionEnd?.();
      })
      .on('zoom', (event) => {
        const { transform } = event;
        
        // Store current transform
        currentTransformRef.current = transform;
        
        // Callback with transform
        onTransformChange?.(transform);
        
        // Apply transform to chart elements
        applyTransformToChart(transform, xScale, yScale, width, height);
      });

    return zoom;
  }, [enabled, chartConfig.zoomLimits, onInteractionStart, onInteractionEnd, onTransformChange]);

  // Apply transform to chart elements
  const applyTransformToChart = useCallback((
    transform: d3.ZoomTransform,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    width: number,
    height: number
  ) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    if (g.empty()) return;

    // Create transformed scales
    const newXScale = transform.rescaleX(xScale);
    const newYScale = transform.rescaleY(yScale);

    // Update chart data elements
    updateChartElements(g, newXScale, newYScale);
    
    // Update axes
    updateAxes(g, newXScale, newYScale, height);
    
    // Update target range elements
    updateTargetRangeElements(g, newYScale, width);
  }, []);

  // Update chart data elements (line and points)
  const updateChartElements = useCallback((
    g: d3.Selection<d3.BaseType, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) => {
    // Update line path
    const line = d3.line<ChartDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.glucose))
      .curve(d3.curveMonotoneX);

    g.select('.chart-data path')
      .attr('d', (d: any) => line(d));

    // Update data points
    g.select('.chart-data')
      .selectAll('.dot')
      .attr('cx', (d: any) => xScale(d.timestamp))
      .attr('cy', (d: any) => yScale(d.glucose));
  }, []);

  // Update axes
  const updateAxes = useCallback((
    g: d3.Selection<d3.BaseType, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    height: number
  ) => {
    // Update X axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%H:%M') as any)
      .ticks(6);

    g.select('.x-axis')
      .call(xAxis as any);

    // Update Y axis
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.select('.y-axis')
      .call(yAxis as any);
  }, []);

  // Update target range elements
  const updateTargetRangeElements = useCallback((
    g: d3.Selection<d3.BaseType, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    width: number
  ) => {
    const { targetRanges } = chartConfig;

    // Update background rectangle
    g.select('.target-range-bg')
      .attr('y', yScale(targetRanges.high))
      .attr('height', Math.max(0, yScale(targetRanges.low) - yScale(targetRanges.high)));

    // Update target range lines
    g.select('.target-line-low')
      .attr('y1', yScale(targetRanges.low))
      .attr('y2', yScale(targetRanges.low));

    g.select('.target-line-high')
      .attr('y1', yScale(targetRanges.high))
      .attr('y2', yScale(targetRanges.high));
  }, [chartConfig]);

  // Apply initial transform to focus on specific time range
  const applyInitialTransform = useCallback((
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
    xScale: d3.ScaleTime<number, number>,
    targetDomain: [Date, Date],
    fullDomain: [Date, Date],
    width: number
  ) => {
    if (!svgRef.current || !enabled) return;

    const svg = d3.select(svgRef.current);

    // Calculate scale factor to zoom into target range
    const fullRange = fullDomain[1].getTime() - fullDomain[0].getTime();
    const targetRange = targetDomain[1].getTime() - targetDomain[0].getTime();
    const k = fullRange / targetRange;

    // Calculate translation to center the target range
    const targetStart = xScale(targetDomain[0]);
    const targetEnd = xScale(targetDomain[1]);
    const targetCenter = (targetStart + targetEnd) / 2;
    const viewCenter = width / 2;
    const tx = viewCenter - targetCenter * k;

    // Apply the initial transform
    const initialTransform = d3.zoomIdentity.translate(tx, 0).scale(k);
    
    svg.call(zoom.transform, initialTransform);
    currentTransformRef.current = initialTransform;
  }, [enabled]);

  // Get current transform
  const getCurrentTransform = useCallback(() => {
    return currentTransformRef.current;
  }, []);

  // Reset zoom to initial state
  const resetZoom = useCallback((zoom: d3.ZoomBehavior<SVGSVGElement, unknown>) => {
    if (!svgRef.current || !enabled) return;

    const svg = d3.select(svgRef.current);
    svg.call(zoom.transform, d3.zoomIdentity);
    currentTransformRef.current = d3.zoomIdentity;
  }, [enabled]);

  return {
    svgRef,
    containerRef,
    initializeZoom,
    applyInitialTransform,
    getCurrentTransform,
    resetZoom,
    isInteracting: isInteractingRef.current,
    chartConfig,
  };
};

/**
 * Hook for managing chart tooltip interactions
 */
export interface UseChartTooltipOptions {
  /** Tooltip offset from cursor */
  offset?: { x: number; y: number };
  /** Custom tooltip formatter */
  formatter?: (dataPoint: ChartDataPoint) => string;
}

export interface UseChartTooltipReturn {
  /** Tooltip element ref */
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  /** Show tooltip at position with data */
  showTooltip: (
    x: number,
    y: number,
    dataPoint: ChartDataPoint
  ) => void;
  /** Hide tooltip */
  hideTooltip: () => void;
  /** Whether tooltip is visible */
  isVisible: boolean;
}

/**
 * Custom hook for chart tooltip management
 */
export const useChartTooltip = (
  options: UseChartTooltipOptions = {}
): UseChartTooltipReturn => {
  const {
    offset = { x: 10, y: -28 },
    formatter,
  } = options;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(false);

  const showTooltip = useCallback((
    x: number,
    y: number,
    dataPoint: ChartDataPoint
  ) => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    
    // Format content
    const content = formatter ? formatter(dataPoint) : 
      `${dataPoint.glucose} mg/dL at ${dataPoint.timestamp.toLocaleTimeString()}`;
    
    tooltip.innerHTML = content;
    tooltip.style.left = `${x + offset.x}px`;
    tooltip.style.top = `${y + offset.y}px`;
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'none';
    
    isVisibleRef.current = true;
  }, [formatter, offset]);

  const hideTooltip = useCallback(() => {
    if (!tooltipRef.current) return;

    tooltipRef.current.style.opacity = '0';
    isVisibleRef.current = false;
  }, []);

  return {
    tooltipRef,
    showTooltip,
    hideTooltip,
    isVisible: isVisibleRef.current,
  };
};
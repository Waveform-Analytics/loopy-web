# Loopy Web - Advanced CGM Dashboard Frontend

A next-generation React TypeScript web application for advanced glucose data visualization and analysis. Goes beyond traditional CGM viewers with enhanced time series capabilities and comprehensive trend analysis.

## Project Vision

**Mission**: Create superior visualizations and analytical insights for diabetes management  
**Status**: 🚧 Ready to implement - Backend API is complete and deployed  
**Backend API**: https://loopy-api-production.up.railway.app  
**Architecture**: React + TypeScript with advanced visualization libraries  
**Target Users**: DIY Loop users seeking cutting-edge data analysis capabilities

## MVP Focus: Enhanced Time Series Visualization

### Core MVP Requirements
1. **Interactive 24-hour glucose chart** with advanced zoom and pan capabilities
2. **Current reading display** with comprehensive trend analysis (beyond basic arrows)
3. **Real-time data updates** with intelligent refresh and connection status
4. **Mobile-optimized interactions** for touch-based exploration

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Access to the deployed loopy-api backend
- API key for authentication (provided: `5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s`)

### Setup Commands

```bash
# Initialize React TypeScript project
npx create-react-app loopy-web --template typescript
cd loopy-web

# Install advanced visualization dependencies
npm install plotly.js react-plotly.js  # Enhanced charting with zoom/pan
npm install @mui/material @emotion/react @emotion/styled  # Material UI
npm install @mui/icons-material @mui/x-date-pickers  # Extended UI components
npm install axios date-fns  # API and time utilities
npm install recharts  # Alternative charting library for comparisons

# Development server
npm start
```

## Project Structure

```
loopy-web/                   # Standard React app structure
├── public/                  # Static assets (index.html, favicon, manifest.json)
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json        # PWA manifest for mobile app-like experience
├── src/                     # All TypeScript/React source code
│   ├── components/          # Reusable UI components (best practice: one component per file)
│   │   ├── charts/          # Chart-specific components
│   │   │   ├── EnhancedTimeSeriesChart.tsx
│   │   │   ├── TrendAnalysisOverlay.tsx
│   │   │   └── index.ts     # Barrel exports for clean imports
│   │   ├── glucose/         # Glucose domain components
│   │   │   ├── CurrentReading.tsx
│   │   │   ├── TrendIndicator.tsx
│   │   │   ├── ConnectionStatus.tsx
│   │   │   └── index.ts
│   │   ├── pump/            # Future: Pump data components
│   │   │   ├── BolusDisplay.tsx
│   │   │   ├── BasalRateChart.tsx
│   │   │   ├── InsulinOnBoard.tsx
│   │   │   └── index.ts
│   │   ├── common/          # Shared/generic components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── index.ts
│   │   └── layout/          # Layout and navigation components
│   │       ├── Dashboard.tsx
│   │       ├── Navigation.tsx
│   │       └── index.ts
│   ├── pages/               # Top-level page components (React Router)
│   │   ├── DashboardPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── index.ts
│   ├── hooks/               # Custom React hooks (best practice: start with 'use')
│   │   ├── useCGMData.ts
│   │   ├── usePumpData.ts   # Future: Pump data hook
│   │   ├── useRealTimeUpdates.ts
│   │   ├── useChartInteractions.ts
│   │   └── index.ts
│   ├── services/            # API layer and external services
│   │   ├── api/             # API client modules
│   │   │   ├── cgm.ts       # CGM-specific API calls
│   │   │   ├── pump.ts      # Future: Pump API calls
│   │   │   ├── base.ts      # Base API client with auth/retry logic
│   │   │   └── index.ts
│   │   ├── storage/         # Local storage, caching
│   │   │   ├── cache.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions (separate from components)
│   │   ├── cgm.ts           # CGM data types
│   │   ├── pump.ts          # Future: Pump data types
│   │   ├── api.ts           # API response types
│   │   ├── common.ts        # Shared types
│   │   └── index.ts
│   ├── utils/               # Pure utility functions (no React dependencies)
│   │   ├── glucose.ts       # Glucose calculations
│   │   ├── time.ts          # Date/time utilities
│   │   ├── insulin.ts       # Future: Insulin calculations
│   │   ├── validation.ts    # Data validation utilities
│   │   └── index.ts
│   ├── constants/           # App constants and configuration
│   │   ├── glucose.ts       # Glucose ranges, thresholds
│   │   ├── charts.ts        # Chart configuration constants
│   │   └── index.ts
│   ├── styles/              # Global styles and themes (if using CSS modules/styled-components)
│   │   ├── globals.css
│   │   ├── theme.ts         # Material-UI theme configuration
│   │   └── variables.css
│   ├── App.tsx              # Main app component with routing
│   ├── index.tsx            # Entry point (ReactDOM.render)
│   └── react-app-env.d.ts   # Create React App TypeScript definitions
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── .eslintrc.json           # ESLint configuration (code quality)
├── .prettierrc              # Prettier configuration (code formatting)
└── README.md                # User documentation
```

## Web Development Best Practices Applied

### TypeScript Best Practices
- **Strict type checking** - `tsconfig.json` with strict mode enabled
- **Barrel exports** - `index.ts` files for clean imports (`import { Chart } from '@/components/charts'`)
- **Domain-driven organization** - Types organized by feature (cgm, pump, common)
- **Generic types** - Reusable `ApiResponse<T>` pattern
- **Union types** - Clear options like `'normal' | 'square' | 'dual'` for bolus types

### React Best Practices
- **Single responsibility** - One component per file
- **Custom hooks** - Business logic separated from UI (`useCGMData`, `usePumpData`)
- **Error boundaries** - Graceful error handling
- **Memoization** - Performance optimization with `useMemo`, `useCallback`
- **Accessibility** - ARIA labels, keyboard navigation

### Project Organization Best Practices
- **Feature-based structure** - Components grouped by domain (glucose, pump, charts)
- **Separation of concerns** - API layer, business logic, UI components clearly separated
- **Configuration files** - ESLint, Prettier for code quality
- **Environment variables** - Secure API configuration

## Pump Data Integration Architecture ✅

The current architecture is **perfectly designed** for pump data extension:

### 1. **Modular API Structure**
```typescript
// Current: src/services/api/cgm.ts
export const cgmApi = { getCurrentGlucose, getCGMData };

// Future: src/services/api/pump.ts  
export const pumpApi = { 
  getBolusHistory, 
  getBasalRates, 
  getInsulinOnBoard,
  getPumpSettings 
};

// Combined: src/services/api/combined.ts
export const combinedApi = { 
  getDiabetesData,  // CGM + Pump together
  getCorrelationAnalysis 
};
```

### 2. **Component Architecture Ready for Pump Data**
```typescript
// Current: EnhancedTimeSeriesChart (glucose only)
// Future: CombinedTimeSeriesChart (glucose + insulin overlays)

<CombinedTimeSeriesChart
  cgmData={cgmData}
  pumpData={pumpData}  // Boluses, basal rates
  showInsulinOverlay={true}
  correlateBolusImpact={true}
/>
```

### 3. **Hook Pattern for Pump Data**
```typescript
// src/hooks/usePumpData.ts - future implementation
export const usePumpData = (timeRange: TimeRange) => {
  const [boluses, setBoluses] = useState<BolusDelivery[]>([]);
  const [basalRates, setBasalRates] = useState<BasalRate[]>([]);
  const [iob, setIOB] = useState<InsulinOnBoard[]>([]);
  
  // Smart caching, real-time updates, error handling
  return { boluses, basalRates, iob, loading, error };
};
```

## Implementation Guide

### Phase 1: Enhanced Time Series Chart (MVP - CGM Only)

The MVP focuses on creating a superior glucose visualization foundation that pump data can easily build upon.

#### Key Enhancement Areas:
1. **Advanced Zoom & Pan** - Smooth, responsive chart interactions
2. **Intelligent Data Display** - Smart point density and smoothing  
3. **Enhanced Trend Analysis** - Beyond simple directional arrows
4. **Mobile-First Interactions** - Touch-optimized chart controls
5. **Extensible Design** - Ready for pump data overlay

### Step 1: Enhanced API Service Layer

**src/services/api.ts**
```typescript
const API_BASE_URL = 'https://loopy-api-production.up.railway.app';
const API_KEY = process.env.REACT_APP_API_KEY || '5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s';

class ApiService {
  private getHeaders() {
    return {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async getCurrentGlucose() {
    const response = await fetch(`${API_BASE_URL}/api/cgm/current`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch current glucose');
    return response.json();
  }

  async getCGMData(hours: number = 24) {
    const response = await fetch(`${API_BASE_URL}/api/cgm/data?hours=${hours}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch CGM data');
    return response.json();
  }

  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/api/cgm/status`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }
}

export const apiService = new ApiService();
```

**src/types/cgm.ts** (Following TypeScript best practices)
```typescript
// CGM data types - current implementation
export interface CGMReading {
  datetime: string;
  sgv: number;
  direction: string;
  trend?: number;
}

export interface CurrentGlucose {
  current_glucose: number | null;
  direction: string;
  trend: number;
  timestamp: string;
  minutes_ago: number;
}

export interface CGMAnalysis {
  time_in_range: {
    in_range: number;
    above_range: number;
    below_range: number;
  };
  average_glucose: number;
  glucose_variability: number;
}

export interface CGMDataResponse {
  data: CGMReading[];
  analysis: CGMAnalysis;
  last_updated: string;
  time_range: {
    start: string;
    end: string;
    hours: number;
  };
}
```

**src/types/pump.ts** (Future pump data types - extensible design)
```typescript
// Pump data types - designed for future integration
export interface BolusDelivery {
  datetime: string;
  amount: number;           // Units of insulin
  type: 'normal' | 'square' | 'dual';
  duration?: number;        // For extended boluses
  carbs?: number;          // Associated carb count
  bg_input?: number;       // BG used for calculation
  programmed_by: 'user' | 'loop';
}

export interface BasalRate {
  datetime: string;
  rate: number;            // Units per hour
  duration: number;        // Duration in minutes
  type: 'scheduled' | 'temp' | 'suspend';
  reason?: string;         // Loop adjustment reason
}

export interface InsulinOnBoard {
  datetime: string;
  iob: number;             // Active insulin units
  decay_rate: number;      // How fast it's decaying
}

export interface PumpSettings {
  datetime: string;
  max_basal: number;
  max_bolus: number;
  insulin_sensitivity: number[];  // By time of day
  carb_ratio: number[];           // By time of day
  target_bg: {
    low: number;
    high: number;
  };
}

export interface PumpDataResponse {
  boluses: BolusDelivery[];
  basal_rates: BasalRate[];
  iob_history: InsulinOnBoard[];
  settings: PumpSettings[];
  last_updated: string;
  time_range: {
    start: string;
    end: string;
    hours: number;
  };
}

// Combined data for correlation analysis
export interface CombinedDiabetesData {
  cgm: CGMDataResponse;
  pump: PumpDataResponse;
  correlations?: {
    bolus_impact: Array<{
      bolus_time: string;
      bolus_amount: number;
      glucose_change: {
        pre_bolus: number;
        post_bolus_1h: number;
        post_bolus_2h: number;
        effectiveness_score: number;
      };
    }>;
    basal_effectiveness: number;
    overnight_stability: number;
  };
}
```

**src/types/common.ts** (Shared types)
```typescript
// Common types used across the app
export interface TimeRange {
  start: string;
  end: string;
  hours: number;
}

export interface ApiResponse<T> {
  data: T;
  last_updated: string;
  status: 'success' | 'error' | 'partial';
  message?: string;
}

export interface ChartDataPoint {
  x: string | Date;
  y: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type DataSource = 'cgm' | 'pump' | 'combined';
```

### Step 2: Enhanced Time Series Chart Component

**src/components/charts/EnhancedTimeSeriesChart.tsx**
```typescript
import React, { useState, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut, Home, TouchApp } from '@mui/icons-material';

interface EnhancedTimeSeriesChartProps {
  data: CGMReading[];
  height?: number;
  onTimeRangeChange?: (startTime: Date, endTime: Date) => void;
}

export const EnhancedTimeSeriesChart: React.FC<EnhancedTimeSeriesChartProps> = ({ 
  data, 
  height = 500,
  onTimeRangeChange 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);

  // Enhanced data processing with smart point density
  const processedData = useMemo(() => {
    if (!data.length) return { x: [], y: [], colors: [] };
    
    // Smart data sampling based on zoom level
    const samplingRate = Math.max(1, Math.floor(data.length / (400 * zoomLevel)));
    const sampledData = data.filter((_, index) => index % samplingRate === 0);
    
    return {
      x: sampledData.map(d => d.datetime),
      y: sampledData.map(d => d.sgv),
      colors: sampledData.map(d => getGlucoseColor(d.sgv))
    };
  }, [data, zoomLevel]);

  const getGlucoseColor = (glucose: number) => {
    if (glucose < 70) return '#f44336';  // Red for low
    if (glucose > 180) return '#ff9800'; // Orange for high
    if (glucose > 250) return '#d32f2f'; // Dark red for very high
    return '#4caf50'; // Green for in range
  };

  // Enhanced trace with gradient colors and smart smoothing
  const trace = {
    x: processedData.x,
    y: processedData.y,
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    name: 'Glucose',
    line: { 
      color: '#2196f3', 
      width: 3,
      smoothing: 0.3  // Smooth line interpolation
    },
    marker: { 
      size: 6,
      color: processedData.colors,
      line: { color: '#fff', width: 1 }
    },
    connectgaps: true,
    hovertemplate: '<b>%{y} mg/dL</b><br>%{x}<br><extra></extra>'
  };

  // Enhanced layout with better zoom controls and styling
  const layout = {
    title: {
      text: 'Continuous Glucose Monitor - 24 Hour View',
      font: { size: 20, family: 'Roboto, sans-serif' },
      x: 0.05
    },
    xaxis: { 
      title: { text: 'Time', font: { size: 14 } },
      type: 'date' as const,
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.2)',
      showspikes: true,
      spikethickness: 1,
      spikecolor: '#999'
    },
    yaxis: { 
      title: { text: 'Glucose (mg/dL)', font: { size: 14 } },
      range: [40, 400],
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.2)',
      zeroline: false
    },
    shapes: [
      // Enhanced range visualization
      {
        type: 'rect' as const,
        xref: 'paper' as const,
        yref: 'y' as const,
        x0: 0, x1: 1, y0: 70, y1: 180,
        fillcolor: 'rgba(76, 175, 80, 0.08)',
        line: { width: 0 }
      },
      // Target range lines
      {
        type: 'line' as const,
        xref: 'paper' as const, yref: 'y' as const,
        x0: 0, x1: 1, y0: 70, y1: 70,
        line: { color: '#4caf50', width: 2, dash: 'dash' }
      },
      {
        type: 'line' as const,
        xref: 'paper' as const, yref: 'y' as const,
        x0: 0, x1: 1, y0: 180, y1: 180,
        line: { color: '#ff9800', width: 2, dash: 'dash' }
      }
    ],
    margin: { t: 60, b: 60, l: 60, r: 30 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'x unified'
  };

  // Enhanced configuration for better mobile interaction
  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d'],
    modeBarButtonsToAdd: ['hoverClosestCartesian', 'hoverCompareCartesian'],
    doubleClick: 'reset+autosize' as const,
    showTips: false,
    scrollZoom: true
  };

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset(0);
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Enhanced control panel */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        display: 'flex',
        gap: 1,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 1,
        padding: 0.5
      }}>
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={handleZoomOut}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View">
          <IconButton size="small" onClick={handleReset}>
            <Home />
          </IconButton>
        </Tooltip>
        <Tooltip title="Touch Mode">
          <IconButton size="small">
            <TouchApp />
          </IconButton>
        </Tooltip>
      </Box>

      <Plot
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
        onRelayout={(event) => {
          // Handle zoom and pan events
          if (event['xaxis.range[0]'] && event['xaxis.range[1]']) {
            const startTime = new Date(event['xaxis.range[0]']);
            const endTime = new Date(event['xaxis.range[1]']);
            onTimeRangeChange?.(startTime, endTime);
          }
        }}
      />
    </Box>
  );
};
```

**src/components/CurrentGlucose.tsx**
```typescript
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

interface CurrentGlucoseProps {
  glucose: number | null;
  direction: string;
  timestamp: string;
  minutesAgo: number;
}

export const CurrentGlucose: React.FC<CurrentGlucoseProps> = ({ 
  glucose, direction, timestamp, minutesAgo 
}) => {
  const getTrendIcon = () => {
    switch (direction) {
      case 'SingleUp':
      case 'DoubleUp':
      case 'FortyFiveUp':
        return <TrendingUp color="warning" />;
      case 'SingleDown':
      case 'DoubleDown': 
      case 'FortyFiveDown':
        return <TrendingDown color="primary" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getGlucoseColor = () => {
    if (!glucose) return 'text.secondary';
    if (glucose < 70) return 'error.main';
    if (glucose > 180) return 'warning.main';
    return 'success.main';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Current Glucose
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h3" color={getGlucoseColor()}>
            {glucose || '--'}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            mg/dL
          </Typography>
          {getTrendIcon()}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {minutesAgo < 60 ? `${Math.round(minutesAgo)} minutes ago` : 'Over 1 hour ago'}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

### Phase 3: Dashboard Implementation

**src/pages/Dashboard.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Alert } from '@mui/material';
import { CGMChart } from '../components/CGMChart';
import { CurrentGlucose } from '../components/CurrentGlucose';
import { apiService } from '../services/api';

export const Dashboard: React.FC = () => {
  const [cgmData, setCgmData] = useState([]);
  const [currentGlucose, setCurrentGlucose] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataResponse, currentResponse] = await Promise.all([
          apiService.getCGMData(24), // Last 24 hours
          apiService.getCurrentGlucose()
        ]);
        
        setCgmData(dataResponse.data);
        setAnalysis(dataResponse.analysis);
        setCurrentGlucose(currentResponse);
        setError(null);
      } catch (err) {
        setError('Failed to load CGM data. Check your backend connection.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Typography>Loading CGM data...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CGM Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CGMChart data={cgmData} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <CurrentGlucose {...currentGlucose} />
        </Grid>
        
        <Grid item xs={12} md={8}>
          {/* Add TimeInRangeCard component here */}
        </Grid>
      </Grid>
    </Box>
  );
};
```

## Environment Configuration

**.env.example**
```env
# API Configuration
REACT_APP_API_URL=https://loopy-api-production.up.railway.app
REACT_APP_API_KEY=5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s
```

## Backend API Reference

The backend API is fully deployed and provides these authenticated endpoints:

- **Base URL**: `https://loopy-api-production.up.railway.app`
- **Authentication**: Bearer token in Authorization header
- **API Key**: `5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s`

### Available Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Health check | No |
| `/api/cgm/current` | GET | Current glucose reading | Yes |
| `/api/cgm/data?hours=24` | GET | Historical CGM data | Yes |
| `/api/cgm/status` | GET | Connection status | Yes |
| `/api/cgm/analysis/{period}` | GET | Period analysis data | Yes |

## Development Workflow

### Starting Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# The app will be available at http://localhost:3000
```

### Building for Production
```bash
# Create production build
npm run build

# The build artifacts will be in the build/ directory
```

### Testing API Connection
```bash
# Test the backend API health endpoint
curl https://loopy-api-production.up.railway.app/health

# Test authenticated endpoint (replace with actual API key)
curl -H "Authorization: Bearer 5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s" \
     https://loopy-api-production.up.railway.app/api/cgm/current
```

## Deployment Options

### Option 1: Netlify (Recommended)
```bash
# Build the project
npm run build

# Deploy to Netlify
# Upload the build/ directory or connect your Git repository
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 3: Docker
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Features to Implement

### Core Features (MVP)
- [ ] Current glucose display with trend arrows
- [ ] 24-hour glucose chart (Nightscout-style)
- [ ] Time in range statistics
- [ ] Real-time data updates (5-minute refresh)
- [ ] Mobile-responsive design
- [ ] Connection status indicators

### Enhanced Features
- [ ] Multiple time period views (24h, 7d, 30d)
- [ ] Daily pattern analysis
- [ ] Glucose variability metrics
- [ ] Export functionality (CSV, PDF)
- [ ] Custom alert thresholds
- [ ] PWA capabilities for mobile

### Advanced Features (Future)
- [ ] Pump data integration
- [ ] Insulin delivery visualization
- [ ] Correlation analysis (CGM + pump)
- [ ] Multi-user support with authentication

## Troubleshooting

### Common Issues

**API Connection Errors**
- Verify the API endpoint is accessible: `curl https://loopy-api-production.up.railway.app/health`
- Check that the API key is correctly configured in your `.env` file
- Ensure CORS is properly configured on the backend

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are compatible

**Data Loading Issues**
- Check browser console for network errors
- Verify MongoDB connection on the backend
- Test API endpoints directly with curl or Postman

## Contributing

This project follows the Nightscout UI conventions and uses Material-UI for consistent styling. When adding components:

1. Follow TypeScript best practices
2. Use Material-UI components for consistency
3. Implement proper error handling
4. Add loading states for async operations
5. Ensure mobile responsiveness

## Security Notes

- API key is included for development/demo purposes
- In production, consider implementing user authentication
- Backend handles MongoDB credentials securely via environment variables
- Frontend only communicates with the authenticated API, never directly with MongoDB

## Links

- **Backend Repository**: https://github.com/Waveform-Analytics/loopy-api
- **Live API**: https://loopy-api-production.up.railway.app
- **API Documentation**: https://loopy-api-production.up.railway.app/docs
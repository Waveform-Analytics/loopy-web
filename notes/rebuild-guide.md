# Loopy Web - Complete Rebuild Guide

A comprehensive guide to building a modern CGM dashboard with D3.js, React, and TypeScript from scratch.

## Overview

This guide will help you build a clean, performant CGM data visualization app with:
- **Smooth pan/zoom interactions** using D3.js
- **Time range selection buttons** (1h, 3h, 6h, 12h, 24h)
- **Auto-scaling Y-axis** that adapts to visible data
- **Extensible architecture** ready for pump data integration
- **Mobile-responsive design**

## Key Lessons Learned

From our previous implementation attempts:
1. **Keep D3 scales simple** - Use full data extent, control view with transforms
2. **Separate concerns** - UI state vs chart state vs data state
3. **Track user interaction** - Auto-scale vs manual control
4. **Use clipping paths** - Prevents visual artifacts during pan/zoom
5. **Start with working basics** - Add complexity incrementally

## Project Architecture

```
src/
├── components/
│   ├── charts/
│   │   ├── CGMChart.tsx              # Main chart component
│   │   ├── TimeRangeSelector.tsx     # Time range buttons
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── Dashboard.tsx             # Main dashboard layout
│   │   ├── CurrentReading.tsx        # Current glucose display
│   │   └── index.ts
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useCGMData.ts                 # Data fetching hook
│   ├── useChartInteractions.ts       # Chart state management
│   └── index.ts
├── services/
│   ├── api.ts                        # API client
│   └── index.ts
├── types/
│   ├── cgm.ts                        # CGM data types
│   ├── pump.ts                       # Future pump types
│   └── index.ts
├── utils/
│   ├── glucose.ts                    # Glucose calculations
│   ├── time.ts                       # Time utilities
│   └── index.ts
└── constants/
    ├── glucose.ts                    # Glucose ranges/thresholds
    └── charts.ts                     # Chart configuration
```

## Step-by-Step Implementation

### Step 1: Project Setup ✅

```bash
# Create fresh React TypeScript app
npx create-react-app loopy-web-v2 --template typescript
cd loopy-web-v2

# Install core dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install d3 @types/d3
npm install axios date-fns

# Install dev dependencies
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev @typescript-eslint/parser
npm install --save-dev prettier
```

### Step 2: Define Core Types

**src/types/cgm.ts**
```typescript
export interface CGMReading {
  datetime: string;
  sgv: number;
  direction: string;
  trend?: number;
  dateString?: string;
}

export interface CurrentGlucose {
  current_glucose: number | null;
  direction: string;
  trend: number;
  timestamp: string;
  minutes_ago: number;
}

export interface CGMDataResponse {
  data: CGMReading[];
  last_updated: string;
}

// Future pump integration
export interface PumpReading {
  datetime: string;
  bolus?: number;
  basal_rate?: number;
  iob?: number;
}

export interface CombinedData {
  cgm: CGMReading[];
  pump?: PumpReading[];
}
```

**src/types/chart.ts**
```typescript
export type TimeRange = '1h' | '3h' | '6h' | '12h' | '24h';

export interface ChartDataPoint {
  timestamp: Date;
  glucose: number;
  reading: CGMReading;
}

export interface ChartState {
  selectedTimeRange: TimeRange;
  isLiveMode: boolean;
  userHasInteracted: boolean;
  currentTransform?: d3.ZoomTransform;
}
```

### Step 3: Create API Service

**src/services/api.ts**
```typescript
import axios from 'axios';
import { CGMDataResponse, CurrentGlucose } from '../types/cgm';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://loopy-api-production.up.railway.app';
const API_KEY = process.env.REACT_APP_API_KEY || '5w6DXf7OSYtNl5wHHX_sSTViUmZfslMhjoAwOqtLZ0s';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export class CGMService {
  static async getCurrentGlucose(): Promise<CurrentGlucose> {
    const response = await apiClient.get('/api/cgm/current');
    return response.data;
  }

  static async getCGMData(hours: number = 24): Promise<CGMDataResponse> {
    const response = await apiClient.get(`/api/cgm/data?hours=${hours}`);
    return response.data;
  }

  static async getHealthStatus() {
    const response = await apiClient.get('/api/health');
    return response.data;
  }
}
```

## Implementation Principles

### 1. **Separation of Concerns**
- **Data layer**: API service and hooks handle all data fetching
- **State layer**: Custom hooks manage chart state separately from UI state
- **UI layer**: Components focus only on rendering and user interactions

### 2. **D3.js Best Practices**
- **Full data scales**: Always use complete dataset extent for scales
- **Transform-based zooming**: Control view with transforms, not scale domains
- **User interaction tracking**: Distinguish between automatic and manual scaling
- **Proper cleanup**: Remove event listeners and DOM elements

### 3. **Scalability for Pump Data**
- **Modular API service**: Easy to add pump endpoints
- **Extensible types**: Pump data types already defined
- **Chart overlay architecture**: Chart component ready for additional data layers
- **Combined data hooks**: Pattern established for merging CGM + pump data

This architecture provides a solid foundation that's both powerful and maintainable, ready to grow with your needs while keeping the codebase clean and understandable.
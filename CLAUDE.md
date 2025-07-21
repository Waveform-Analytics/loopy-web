# Loopy Web - CGM Dashboard Project

A modern CGM (Continuous Glucose Monitor) dashboard built with React, TypeScript, and Recharts.

## 🎯 PROJECT STATUS: PRODUCTION READY ✅

**Compact Mobile-First CGM Dashboard**

The dashboard is now fully functional and deployed to production on Vercel with all core features implemented. Key improvements include intelligent polling, flicker-free charts, and a mobile-optimized design.

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Foundation Setup ⚡
**Goal**: Rock-solid React + TypeScript + Material-UI foundation
- ✅ Clean React 18+ TypeScript project
- ✅ Material-UI 6+ for components and theming  
- ✅ Complete type system (CGM, Chart, Common types)
- ✅ Robust API service layer with retry logic
- ✅ Environment configuration (.env setup)

### Phase 2: Data Layer 📊
**Goal**: Reliable data fetching and state management
- ✅ Custom React hooks for CGM data fetching
- ✅ **Intelligent polling** - calculates next reading time based on actual data patterns
- ✅ Real-time data updates with optimized intervals
- ✅ Error handling and loading states
- ✅ Data transformation utilities
- ✅ Mock data for development

### Phase 3: UI Components 🎨
**Goal**: Clean, responsive Material-UI components
- ✅ Time range selector (1h, 3h, 6h, 12h, 24h)
- ✅ Current glucose reading display
- ✅ Live mode toggle with countdown timer
- ✅ Mobile-responsive design
- ✅ Alert/notification system

### Phase 4: Chart Implementation 📈
**Goal**: Stable, flicker-free glucose visualization

**CRITICAL LESSONS LEARNED:**
- ⚠️ **Recharts axis flickering**: Known issue with time-series + live updates
- ✅ **Solution approaches**: Memoization, static sizing, disabled animations
- ✅ **Alternative libraries**: Chart.js, Victory, D3.js direct
- ✅ **Key principle**: Minimize re-renders of chart components

**Implementation Strategy:**
1. Start with **simplest possible chart** (static data, no animations)
2. Add **aggressive memoization** from day 1
3. Test with **static data first**, then live data
4. If Recharts fails: **Chart.js fallback ready**

### Phase 5: Dashboard Integration 🏠
**Goal**: Complete dashboard with all features
- ✅ **Compact mobile-first design** - reduced from 3 cards to 2 cards
- ✅ **Responsive layout** (mobile + desktop optimized)
- ✅ **Real-time glucose monitoring** with intelligent polling
- ✅ **Color-coded glucose values** (red/yellow/green based on thresholds)
- ✅ **Current time display** with AM/PM format
- ✅ **Chart + current reading integration**
- ✅ **Smart trend arrows** using actual API direction data
- ✅ **Loading and error states** with proper error handling

### Phase 6: Production Deployment 🚀
**Goal**: Stable production environment
- ✅ **Vercel deployment** with environment variables configured
- ✅ **API authentication** working correctly with bearer tokens
- ✅ **Chart rendering fixes** for production builds (ReferenceArea issues)
- ✅ **Performance optimizations** and code cleanup
- ✅ **TypeScript error resolution** for production builds

## 🛠 TECHNOLOGY STACK

### Core Framework
- **React 18+** with TypeScript
- **Material-UI 6+** for UI components
- **date-fns** for time utilities
- **Axios** for API communication

### Charting (Primary)
- **Recharts 2+** - React-native charting
- **Fallback**: Chart.js + react-chartjs-2 (if Recharts fails)

### Development Tools
- **TypeScript 5+** for type safety
- **ESLint + Prettier** for code quality
- **React Dev Tools** for debugging

## 🔧 ENVIRONMENT SETUP

### Required Files
Create `.env` file with:
```bash
REACT_APP_API_BASE_URL=https://loopy-api-production.up.railway.app
REACT_APP_API_KEY=your_bearer_token_here
```

**Note**: Use `REACT_APP_API_KEY` (not `REACT_APP_API_TOKEN`) to match Vercel environment variables.

### API Endpoints
- **Base URL**: https://loopy-api-production.up.railway.app
- **Health Check**: `/api/health`
- **Current Reading**: `/api/cgm/current`
- **CGM Status**: `/api/cgm/status`
- **Historical Data**: `/api/cgm/data?hours=24`
- **CGM Analysis**: `/api/cgm/analysis/{period}` (period: 24h, week, month)

#### API Response Formats

**Current Reading (`/api/cgm/current`)**:
```json
{
  "current_glucose": 142,
  "direction": "Flat", 
  "trend": 4,
  "timestamp": "2025-01-16T10:30:00.000Z",
  "minutes_ago": 3.2,
  "device": "share2",
  "type": "sgv"
}
```

**Historical Data (`/api/cgm/data?hours=24`)**:
Returns data points and analysis for the specified time period.

## 🧠 INTELLIGENT POLLING SYSTEM

### How It Works
The dashboard analyzes historical CGM readings to predict when new data will arrive:

1. **Pattern Analysis**: Calculates median interval between actual readings (typically ~5 minutes)
2. **Next Reading Prediction**: Estimates when the next reading should arrive based on the latest timestamp
3. **Smart Scheduling**: Sets timers to check for new data just after the expected time (+30s buffer)
4. **Adaptive Updates**: Recalculates intervals when new data patterns are detected

### Benefits
- **Reduces API calls**: Only checks when new data is expected, not on fixed intervals
- **Faster updates**: Gets new data within 30 seconds of availability instead of waiting up to 5 minutes
- **Pattern-aware**: Adapts to your specific CGM device's timing patterns
- **Battery efficient**: Minimizes unnecessary network requests

### UI Indicators
- **Next Check**: Countdown to next expected reading
- **Expected Time**: Calculated next reading time based on patterns
- **Interval**: Detected average time between readings
- **Status**: Shows when last update occurred

## 🎨 DESIGN PRINCIPLES

### Data Flow
```
API → Custom Hooks → Components → UI
```

### Component Architecture
```
Dashboard
├── CurrentReading (glucose value + trend)
├── TimeRangeSelector (1h-24h + live mode)
└── CGMChart (memoized, flicker-resistant)
```

### Chart Requirements
1. **Must be flicker-free** (top priority)
2. Time-series glucose data visualization
3. Target range overlay (70-180 mg/dL)
4. Responsive design
5. Real-time updates without re-animation

## 🚨 CRITICAL LESSONS & GOTCHAS

### Chart Flickering Prevention
- **Memoize ALL functions** passed to chart components
- **Memoize data transformations** with useMemo
- **Disable animations** for live-updating charts
- **Use stable keys** for chart components
- **Test with live timers** early in development

### Production Build Issues Fixed
- **ReferenceArea rendering**: Add `key={timeRange}` to LineChart to force re-render
- **TypeScript errors**: Ensure consistent interface usage across files
- **Environment variables**: Use consistent naming (`REACT_APP_API_KEY`)
- **API authentication**: Bearer token format must match API expectations

### Color-Coded Features
- **Glucose thresholds**: Configurable in `GLUCOSE_THRESHOLDS` constant
  - Red: < 55 mg/dL (urgent low) or > 250 mg/dL (really high)  
  - Yellow: 55-69 mg/dL (low) or 181-250 mg/dL (high)
  - Green: 70-180 mg/dL (normal range)
- **Chart dots**: Color-coded based on glucose value
- **Active dots**: Preserve original color but enlarge on hover/selection

### Performance Best Practices
- **React.memo** for expensive components
- **useCallback** for event handlers passed to charts
- **Intelligent polling** - schedules updates based on actual CGM reading patterns
- **Separate timer logic** from chart rendering
- **Batch state updates** when possible

### Mobile Considerations
- **Touch-friendly** controls (44px minimum)
- **Responsive breakpoints** for different screen sizes
- **Simplified layouts** on small screens
- **Readable font sizes** (minimum 14px)

## 🧪 TESTING STRATEGY

### Development Testing
1. **Start with mock data** (no API calls)
2. **Add static API data** (single fetch)
3. **Enable live updates** (timer-based)
4. **Test chart stability** under load
5. **Mobile responsiveness** testing

### Chart-Specific Testing
- [ ] Static data renders without flicker
- [ ] Live data updates smoothly
- [ ] Time range changes work correctly
- [ ] Target range displays properly
- [ ] Mobile layout is usable

## 📦 DEVELOPMENT COMMANDS

```bash
npm start    # Development server (http://localhost:3000)
npm build    # Production build
npm test     # Run tests
npm run lint # Code quality check
```

## 🎯 SUCCESS CRITERIA

### Minimum Viable Product (MVP) ✅
- ✅ Displays current glucose reading with color coding
- ✅ Shows glucose history chart (flicker-free!)
- ✅ Time range selection works (1h, 3h, 6h, 12h, 24h)
- ✅ Mobile responsive with compact design
- ✅ Connects to live API with authentication

### Enhanced Features ✅
- ✅ **Intelligent polling** - updates based on actual CGM timing patterns
- ✅ **Color-coded glucose alerts** (red/yellow/green visual indicators)
- ✅ **Target range visualization** with green underlay (70-180 mg/dL)
- ✅ **Smart trend arrows** using API direction data
- ✅ **Professional mobile-first styling** with Material-UI
- ✅ **Real-time countdown** showing time until next reading
- ✅ **Current time display** with AM/PM format

## 🔄 DEPLOYMENT NOTES

### Vercel Configuration
1. **Environment Variables Required:**
   - `REACT_APP_API_BASE_URL` = `https://loopy-api-production.up.railway.app`
   - `REACT_APP_API_KEY` = `your_bearer_token_here`

2. **Build Settings:**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

### Key Files for Maintenance
- **Glucose thresholds**: `src/components/CurrentReading.tsx` (lines 37-43)
- **Chart colors**: `src/components/SimpleCGMChart.tsx` (ColoredDot component)
- **API configuration**: `src/services/api.ts` and `src/services/api/base.ts`
- **Polling logic**: `src/hooks/useSmartPolling.ts`

---

🎉 **Production-ready CGM dashboard with intelligent polling and mobile-first design!** 🚀
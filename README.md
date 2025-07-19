# Loopy Web - CGM Dashboard

A modern, interactive continuous glucose monitoring (CGM) dashboard built with React, TypeScript, and D3.js.

## 🎯 Features

- **Interactive D3.js charts** with smooth pan and zoom
- **Time range selection** (1h, 3h, 6h, 12h, 24h) with auto-scaling  
- **Smart Y-axis scaling** that adapts to visible data
- **Current glucose display** with trend indicators and alerts
- **Real-time monitoring** with auto-refresh every 5 minutes
- **Mobile-responsive design** with touch support
- **Material-UI theming** with professional appearance
- **Extensible architecture** ready for pump data overlay

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Charts**: D3.js 7 for interactive visualizations
- **UI**: Material-UI 7 components  
- **API**: Axios for backend communication
- **Backend**: https://loopy-api-production.up.railway.app

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

## 📋 Implementation Status - COMPLETE ✅

**Step 1-4: Foundation Complete ✅**
- React TypeScript project with all dependencies
- Complete type system (CGM, Chart, Pump, Common types)
- Robust API service layer with retry logic and error handling
- Advanced React hooks for state management and D3 interactions

**Step 5: Time Range Selector Complete ✅**
- Interactive time range buttons (1h, 3h, 6h, 12h, 24h)
- Live mode toggle with countdown timer
- Manual refresh controls with loading states
- Mobile-responsive design

**Step 6: D3.js Chart Component Complete ✅**
- Smooth pan/zoom interactions with D3.js transforms
- Auto-scaling Y-axis based on visible data vs user interaction
- Interactive tooltips with data point information
- Target range visualization with customizable thresholds
- Loading/error states with Material-UI components

**Step 7: Dashboard Layout Complete ✅**
- Responsive layout with current reading + chart
- Real-time glucose monitoring with alert notifications
- Mobile-optimized design (current reading in header)
- Snackbar notifications for glucose alerts
- Optional data quality debugging information

**🎉 FULLY FUNCTIONAL - Ready for Production!**

The complete CGM dashboard is now running successfully at http://localhost:3000

## 🚀 Quick Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📁 Current Architecture

```
src/
├── types/               # ✅ TypeScript definitions
│   ├── cgm.ts           #     CGM data types
│   ├── chart.ts         #     Chart configuration types  
│   ├── pump.ts          #     Pump data types (future)
│   ├── common.ts        #     Shared utility types
│   └── index.ts         #     Barrel exports
├── services/            # ✅ API service layer
│   ├── apiClient.ts     #     Base HTTP client
│   ├── cgmService.ts    #     CGM data service
│   ├── testServices.ts  #     Testing utilities
│   └── index.ts         #     Service exports
├── hooks/               # ✅ Custom React hooks
│   ├── useChartState.ts #     Chart state management
│   ├── useCGMData.ts    #     CGM data fetching
│   ├── useChartInteractions.ts # D3 interactions
│   └── index.ts         #     Combined hooks
├── components/          # 🚧 Next: UI components
│   ├── charts/          #     D3.js chart components
│   ├── dashboard/       #     Dashboard layout
│   └── common/          #     Shared components
└── utils/               # 🔄 Future: Helper functions
```

## 🔧 Environment

Configure your `.env` file:
```env
REACT_APP_API_URL=https://loopy-api-production.up.railway.app
REACT_APP_API_KEY=your_api_key_here
```

## 📈 Future Extensions

- Pump data integration (bolus, basal, IOB)
- Correlation analysis (glucose + insulin)  
- Advanced analytics and pattern recognition
- Data export capabilities
- Multi-user support

---

Follow the comprehensive rebuild guide in `notes/rebuild-guide.md` for complete implementation instructions.
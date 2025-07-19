# Loopy Web - CGM Dashboard

A modern, interactive continuous glucose monitoring (CGM) dashboard built with React, TypeScript, and D3.js.

## 🎯 Features

- **Interactive D3.js charts** with smooth pan and zoom
- **Time range selection** (1h, 3h, 6h, 12h, 24h) with auto-scaling  
- **Smart Y-axis scaling** that adapts to visible data
- **User interaction tracking** (auto-scale vs manual control)
- **Mobile-responsive design** with touch support
- **Extensible architecture** ready for pump data overlay

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Charts**: D3.js 7 for interactive visualizations
- **UI**: Material-UI 7 components  
- **API**: Axios for backend communication
- **Backend**: https://loopy-api-production.up.railway.app

## 📋 Implementation Status

**Step 1 Complete ✅**
- React TypeScript project initialized
- Core dependencies installed  
- Environment configuration ready

**Step 2 Complete ✅**
- TypeScript types defined (CGM, Chart, Pump, Common)
- Type safety throughout application
- Helper functions and constants
- Barrel exports for clean imports

**Step 3 Complete ✅**
- API service layer implemented
- Robust HTTP client with retry logic
- CGM data fetching service
- Error handling and validation
- Connection testing utilities

**Step 4 Complete ✅**
- Chart state management hooks (useChartState, useChartPreferences)
- CGM data fetching hooks (useCGMData, useRealtimeCGM)
- D3 chart interaction hooks (useChartInteractions, useChartTooltip)
- Combined hooks for seamless integration
- Auto-refresh, error handling, and memory management

**Current Status:** Ready for Step 5 (Time Range Selector Component)

**Next Steps:**
Follow `notes/rebuild-guide.md` for continued step-by-step implementation.

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
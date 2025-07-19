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

**Next Steps:**
Follow `notes/rebuild-guide.md` for step-by-step implementation.

## 🚀 Quick Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📁 Planned Architecture

```
src/
├── components/
│   ├── charts/           # D3.js chart components
│   ├── dashboard/        # Dashboard layout
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
├── services/            # API layer  
├── types/               # TypeScript definitions
├── utils/               # Helper functions
└── constants/           # App constants
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
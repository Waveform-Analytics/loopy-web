# Loopy Web 🔄

> An advanced web dashboard for Loop diabetes management - going beyond traditional CGM viewers with enhanced visualizations and comprehensive analysis

[![Status](https://img.shields.io/badge/status-ready_to_build-green.svg)](https://github.com/Waveform-Analytics/loopy-api)
[![Backend](https://img.shields.io/badge/backend-deployed-success.svg)](https://loopy-api-production.up.railway.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ What is Loopy Web?

Loopy Web is a next-generation React dashboard for viewing and analyzing your Loop diabetes management data. While inspired by Nightscout, it aims to provide **superior visualizations** and **deeper analytical insights** for better diabetes management.

**Key Differentiators:**
- **Enhanced time series visualization** with advanced zoom and interaction capabilities
- **Comprehensive trend analysis** beyond basic directional arrows
- **Future-ready architecture** for advanced reporting and analytics
- **Modern UI/UX** designed for both mobile and desktop workflows

**Perfect for**: DIY Loop users who want cutting-edge data visualization and analysis capabilities.

## 🚀 Quick Start

### Prerequisites

- **Loop system running** with MongoDB database
- **Node.js 18+** installed on your machine
- **Access to your MongoDB Atlas** credentials

### 5-Minute Setup

1. **Clone and setup**
   ```bash
   git clone https://github.com/your-username/loopy-web
   cd loopy-web
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API settings (defaults work for most users)
   ```

3. **Start the dashboard**
   ```bash
   npm start
   ```

4. **View your data** at `http://localhost:3000` 🎉

## 📱 Features

### MVP (Phase 1)
- **Enhanced time series visualization** - Interactive 24-hour glucose chart with advanced zoom capabilities
- **Current reading display** - Real-time glucose with comprehensive trend analysis
- **Smart data refresh** - Automatic updates every 5 minutes with connection status
- **Mobile-first design** - Optimized for both phone and desktop use

### Enhanced Visualizations (Phase 2)
- **Advanced time series controls** - Multiple time periods with smooth transitions
- **Pattern recognition displays** - Visual identification of glucose trends and patterns
- **Interactive data exploration** - Click, zoom, and filter capabilities
- **Smart annotations** - Contextual information overlay on charts

### Comprehensive Analysis (Phase 3)
- **Advanced reporting suite** - Beyond basic time-in-range statistics
- **Predictive insights** - Trend forecasting and pattern analysis
- **Comparative analytics** - Period-over-period analysis and improvements
- **Export capabilities** - Professional reports in multiple formats

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Loopy Web     │────│   Loopy API      │────│  MongoDB Atlas  │
│  (React App)    │    │  (FastAPI)       │    │  (Your Loop DB) │
│                 │    │                  │    │                 │
│ • Dashboard     │    │ • Authentication │    │ • CGM Data      │
│ • Charts        │    │ • Data Processing│    │ • Pump Data     │
│ • Mobile UI     │    │ • JSON API       │    │ • Loop History  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Backend Status**: ✅ Complete and deployed at `https://loopy-api-production.up.railway.app`

## 🛠️ Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── CGMChart.tsx    # Main glucose visualization
│   ├── CurrentGlucose.tsx # Current reading display
│   └── StatsCards.tsx  # Time in range cards
├── pages/              # Application pages
│   └── Dashboard.tsx   # Main dashboard
├── services/           # API communication
│   ├── api.ts         # Backend API client
│   └── types.ts       # TypeScript definitions
└── hooks/              # Custom React hooks
    └── useCGMData.ts  # Data fetching logic
```

### Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Check code style
```

## 🔒 Security & Privacy

- **Your data stays yours** - connects directly to your MongoDB
- **API authentication** - secured with bearer tokens
- **No data storage** - this app only displays, never stores your data
- **Open source** - audit the code yourself

## 🚀 Deployment

### Option 1: Netlify (Recommended)
1. Build the project: `npm run build`
2. Upload the `build/` folder to Netlify
3. Configure environment variables in Netlify dashboard

### Option 2: Vercel
```bash
npm i -g vercel
vercel --prod
```

### Option 3: Self-hosted
Use the included Dockerfile for containerized deployment.

## 🤝 For DIY Loop Users

### What You Need
- Your Loop system running with MongoDB
- Basic comfort with command line
- 15 minutes to set up

### What You Get
- Beautiful web dashboard for your CGM data
- Mobile-friendly interface
- Real-time updates
- No ongoing server costs (uses your existing data)

### Getting Your MongoDB Credentials
1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to Database → Connect → Drivers
3. Copy your connection string
4. The backend API handles the rest!

## 📖 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete technical implementation guide
- **[API Documentation](https://loopy-api-production.up.railway.app/docs)** - Interactive API reference
- **[Backend Repository](https://github.com/Waveform-Analytics/loopy-api)** - FastAPI backend source

## 🔧 Troubleshooting

### Common Issues

**"Can't connect to API"**
- Check that `https://loopy-api-production.up.railway.app/api/health` returns `{"status":"healthy"}`
- Verify your API key in `.env` file

**"No data showing"**
- Ensure your Loop system is writing to MongoDB
- Check the browser console for error messages
- Verify your MongoDB Atlas connection

**Build errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Roadmap

### Phase 1: MVP - Enhanced Time Series (Current)
- [x] Backend API deployment
- [ ] **Interactive 24h glucose chart** with advanced zoom and pan
- [ ] **Current reading component** with comprehensive trend display
- [ ] **Real-time updates** with connection status indicators
- [ ] **Mobile-responsive design** optimized for touch interactions

### Phase 2: Advanced Visualizations
- [ ] **Multi-period views** with smooth time range transitions
- [ ] **Pattern recognition** visual indicators and overlays
- [ ] **Interactive data exploration** - click for details, contextual zoom
- [ ] **Smart annotations** showing significant events and patterns

### Phase 3: Comprehensive Analytics
- [ ] **Advanced reporting suite** with exportable insights
- [ ] **Predictive analytics** for trend forecasting
- [ ] **Pump data integration** with correlation analysis
- [ ] **Professional reporting** with PDF/CSV export capabilities

## 🙋‍♀️ Support

- **Issues**: [GitHub Issues](https://github.com/your-username/loopy-web/issues)
- **DIY Loop Community**: [Loop Docs](https://loopkit.github.io/loopdocs/)
- **API Status**: [https://loopy-api-production.up.railway.app/api/health](https://loopy-api-production.up.railway.app/api/health)

## 📄 License

MIT License - feel free to use, modify, and share!

## 🙏 Acknowledgments

- **Loop Community** - for the amazing DIY diabetes management system
- **Nightscout** - inspiration for the dashboard design
- **FastAPI & React** - for the excellent development frameworks

---

**Made with ❤️ for the DIY diabetes community**

*This project is not affiliated with or endorsed by any medical device manufacturer. Always consult with your healthcare provider.*
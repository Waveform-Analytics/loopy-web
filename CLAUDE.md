# Loopy Web - Fresh Implementation

A modern CGM dashboard built with React, TypeScript, and D3.js, following a clean architecture pattern.

## Project Status: Steps 1-4 Complete ✅

**Step 1 Complete ✅**
- ✅ React TypeScript project initialized  
- ✅ Core dependencies installed
- ✅ Environment configuration set up
- ✅ Rebuild guide created

**Step 2 Complete ✅**
- ✅ Core TypeScript types defined (CGM, Chart, Pump, Common)
- ✅ Type safety throughout application
- ✅ Helper functions and constants
- ✅ Barrel exports for clean imports

**Step 3 Complete ✅**
- ✅ API service layer implemented
- ✅ Robust HTTP client with retry logic and error handling
- ✅ CGM data fetching service with validation
- ✅ Connection testing utilities
- ✅ Service integration and barrel exports

**Step 4 Complete ✅**
- ✅ Chart state management hooks (useChartState, useChartPreferences)
- ✅ CGM data fetching hooks (useCGMData, useRealtimeCGM)  
- ✅ D3 chart interaction hooks (useChartInteractions, useChartTooltip)
- ✅ Combined hooks for seamless integration (useCGMChart)
- ✅ Auto-refresh, error handling, and memory management

## Next Steps

Ready for **Step 5: Time Range Selector Component**

Remaining steps in `notes/rebuild-guide.md`:
5. **Step 5**: Create time range selector component ⬅️ **NEXT**
6. **Step 6**: Implement main D3.js chart component
7. **Step 7**: Build dashboard layout
8. **Step 8**: Create current reading display
9. **Step 9**: Polish and test
10. **Step 10**: Deploy and optimize

## Installed Dependencies

- **React 19** + TypeScript
- **Material-UI 7** for components and theming
- **D3.js 7** for interactive charts
- **Axios** for API communication  
- **date-fns** for time utilities

## Architecture Principles

- **Separation of concerns**: Data, state, and UI layers clearly separated
- **TypeScript first**: Strong typing throughout
- **D3.js best practices**: Full data scales + transform-based interactions
- **Extensible design**: Ready for pump data integration
- **Mobile responsive**: Touch-friendly interactions

## Environment

API configured for:
- Backend: https://loopy-api-production.up.railway.app
- Authentication: Bearer token configured in .env

## Development Commands

```bash
npm start    # Start development server
npm build    # Build for production  
npm test     # Run tests
```

## Testing Services

To test the API connection, you can:

1. **In browser console** (when dev server is running):
   ```javascript
   // Available after importing ServiceTest component
   testServices.quickTest()
   testServices.runAllTests()
   ```

2. **Use the ServiceTest component**:
   ```typescript
   // Temporarily add to App.tsx:
   import { ServiceTest } from './ServiceTest';
   ```

3. **Test endpoints directly**:
   - Health: https://loopy-api-production.up.railway.app/api/health
   - Current: https://loopy-api-production.up.railway.app/api/cgm/current

Ready to continue with Step 4!
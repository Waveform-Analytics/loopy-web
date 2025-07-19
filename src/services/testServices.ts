/**
 * Service testing utilities
 * 
 * This file contains utilities to test API connections and data fetching
 * Can be run to verify services are working correctly
 */

import { cgmService, testAllConnections } from './index';

/**
 * Test CGM data fetching
 */
export async function testCGMDataFetching(): Promise<void> {
  console.log('🧪 Testing CGM data fetching...');
  
  try {
    // Test health status
    console.log('📊 Testing health status...');
    const health = await cgmService.getHealthStatus();
    console.log('✅ Health status:', health);
    
    // Test current glucose
    console.log('🩸 Testing current glucose...');
    const current = await cgmService.getCurrentGlucose();
    console.log('✅ Current glucose:', {
      glucose: current.current_glucose,
      direction: current.direction,
      minutesAgo: current.minutes_ago,
      timestamp: current.timestamp,
    });
    
    // Test historical data (small sample)
    console.log('📈 Testing 1-hour historical data...');
    const data1h = await cgmService.getCGMData({ hours: 1 });
    console.log('✅ 1-hour data:', {
      dataPoints: data1h.data.length,
      timeRange: data1h.time_range,
      lastUpdated: data1h.last_updated,
    });
    
    if (data1h.data.length > 0) {
      const latest = data1h.data[data1h.data.length - 1];
      const oldest = data1h.data[0];
      console.log('📊 Sample readings:', {
        latest: { glucose: latest.sgv, direction: latest.direction, time: latest.datetime },
        oldest: { glucose: oldest.sgv, direction: oldest.direction, time: oldest.datetime },
      });
    }
    
    // Test analysis
    console.log('📊 Testing CGM analysis...');
    const analysis = await cgmService.getCGMAnalysis(24);
    console.log('✅ 24-hour analysis:', analysis);
    
    console.log('🎉 All CGM tests passed!');
    
  } catch (error) {
    console.error('❌ CGM test failed:', error);
    throw error;
  }
}

/**
 * Run comprehensive service tests
 */
export async function runAllTests(): Promise<boolean> {
  console.log('🚀 Starting comprehensive service tests...\n');
  
  try {
    // Test connections
    console.log('1️⃣ Testing service connections...');
    const connections = await testAllConnections();
    
    if (!connections.overall) {
      console.error('❌ Connection tests failed');
      return false;
    }
    
    console.log('✅ All connections successful\n');
    
    // Test CGM data fetching
    console.log('2️⃣ Testing CGM data fetching...');
    await testCGMDataFetching();
    
    console.log('\n🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Service tests failed:', error);
    return false;
  }
}

/**
 * Quick connection test
 */
export async function quickTest(): Promise<void> {
  console.log('⚡ Quick service test...');
  
  try {
    const health = await cgmService.getHealthStatus();
    const current = await cgmService.getCurrentGlucose();
    
    console.log('✅ Quick test results:', {
      service: health.status,
      currentGlucose: current.current_glucose,
      direction: current.direction,
      minutesAgo: current.minutes_ago,
    });
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    throw error;
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  // Make test functions available in browser console for debugging
  (window as any).testServices = {
    runAllTests,
    testCGMDataFetching,
    quickTest,
    cgmService,
  };
}
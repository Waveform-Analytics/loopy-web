/**
 * Barrel exports for all service modules
 * 
 * This allows clean imports like:
 * import { cgmService, apiClient } from '../services';
 */

import { apiClient } from './apiClient';
import { createCGMService } from './cgmService';

// Export API client
export { ApiClient, createApiClient, apiClient } from './apiClient';

// Export CGM service
export { CGMService, createCGMService } from './cgmService';
export type { CGMServiceOptions, HealthStatus } from './cgmService';

// Create and export service instances

export const cgmService = createCGMService(apiClient);

// Service utilities
export const services = {
  api: apiClient,
  cgm: cgmService,
} as const;

/**
 * Test all service connections
 */
export async function testAllConnections(): Promise<{
  api: boolean;
  cgm: boolean;
  overall: boolean;
}> {
  const results = {
    api: false,
    cgm: false,
    overall: false,
  };

  try {
    // Test base API connection
    results.api = await apiClient.testConnection();
    
    // Test CGM service
    results.cgm = await cgmService.testConnection();
    
    // Overall status
    results.overall = results.api && results.cgm;
    
    if (results.overall) {
      console.log('✅ All service connections successful');
    } else {
      console.warn('⚠️ Some service connections failed:', results);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Service connection test failed:', error);
    return results;
  }
}
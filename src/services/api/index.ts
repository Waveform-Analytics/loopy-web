// Import for internal use
import { apiClient } from './base';
import { cgmApi } from './cgm';

// Barrel exports for API services
export { apiClient } from './base';
export { cgmApi, CGMApi } from './cgm';

// Re-export for convenience
export const api = {
  cgm: cgmApi,
  healthCheck: () => apiClient.healthCheck(),
  testConnection: () => apiClient.testConnection(),
};
/**
 * Simple React component to test API services
 * This can be imported into App.tsx to verify services work
 */

import React, { useState, useEffect } from 'react';
import { cgmService, HealthStatus } from './services';
import { CurrentGlucose } from './types';

export const ServiceTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [currentGlucose, setCurrentGlucose] = useState<CurrentGlucose | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testServices();
  }, []);

  const testServices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🧪 Testing services...');

      // Test health
      const health = await cgmService.getHealthStatus();
      setHealthStatus(health);
      console.log('✅ Health:', health);

      // Test current glucose
      const current = await cgmService.getCurrentGlucose();
      setCurrentGlucose(current);
      console.log('✅ Current glucose:', current);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Service test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>🧪 Testing API Services...</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>❌ Service Test Failed</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={testServices}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>✅ API Services Working!</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Health Status:</h3>
        <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Current Glucose:</h3>
        <pre>{JSON.stringify(currentGlucose, null, 2)}</pre>
      </div>

      <button onClick={testServices}>Refresh Data</button>
    </div>
  );
};
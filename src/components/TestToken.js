// src/components/TestToken.jsx
import React, { useEffect, useState } from 'react';
import API_BASE1 from '../config';

const TestToken = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    const token = localStorage.getItem('authToken');
    console.log('Testing token:', token);
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE1}/screen/get-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ screenName: "Employee Master File" })
      });
      
      const data = await response.json();
      console.log('Test response:', data);
      setResult(data);
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', margin: '20px', border: '1px solid #ccc' }}>
      <h3>Token Test</h3>
      <button onClick={testToken} disabled={loading}>
        {loading ? 'Testing...' : 'Test Token'}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default TestToken;
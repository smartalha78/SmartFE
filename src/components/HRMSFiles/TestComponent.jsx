// TestComponent.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../../AuthContext";
import API_BASE1 from "../../config";

const TestComponent = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const useAuth = () => useContext(AuthContext);
    const { credentials } = useAuth();
    const API_BASE = API_BASE1;

    const testDepartment = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/get-table-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tableName: "HRMSDepartment",
                    page: 1,
                    limit: 5,
                    usePagination: true
                })
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            setResult(data);
            
            if (!data.success) {
                setError(`Server error: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Test error:', err);
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testWithoutPagination = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/get-table-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tableName: "HRMSDepartment"
                    // No usePagination flag - should work as before
                })
            });
            
            const data = await response.json();
            console.log('Response without pagination:', data);
            setResult(data);
        } catch (err) {
            console.error('Test error:', err);
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
            <h3>Debug Test Component</h3>
            <p>Credentials offcode: {credentials?.company?.offcode || 'Not available'}</p>
            <p>API Base: {API_BASE}</p>
            
            <div style={{ margin: '10px 0' }}>
                <button onClick={testDepartment} disabled={loading}>
                    {loading ? 'Testing...' : 'Test Department with Pagination'}
                </button>
                <button onClick={testWithoutPagination} disabled={loading} style={{ marginLeft: '10px' }}>
                    {loading ? 'Testing...' : 'Test without Pagination'}
                </button>
            </div>
            
            {error && (
                <div style={{ color: 'red', padding: '10px', background: '#ffe6e6' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            
            {result && (
                <div style={{ marginTop: '20px' }}>
                    <h4>Result:</h4>
                    <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '10px', 
                        overflow: 'auto',
                        maxHeight: '300px'
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default TestComponent;
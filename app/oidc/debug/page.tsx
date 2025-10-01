'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DebugCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const debug = {
      // URL parameters
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      
      // Environment variables
      env: {
        NEXT_PUBLIC_OIDC_CLIENT_ID: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
        NEXT_PUBLIC_OIDC_TENANT_ID: process.env.NEXT_PUBLIC_OIDC_TENANT_ID,
        NEXT_PUBLIC_OIDC_CALLBACK_URL: process.env.NEXT_PUBLIC_OIDC_CALLBACK_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NODE_ENV: process.env.NODE_ENV
      },
      
      // Browser state
      sessionStorage: {
        oidc_state: sessionStorage.getItem('oidc_state'),
        oidc_state_backup: localStorage.getItem('oidc_state_backup')
      },
      
      // Current URL
      currentUrl: window.location.href,
      origin: window.location.origin,
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(debug);
    console.log('🔍 Production Debug Info:', debug);
    
    // Try to parse stored state
    const storedState = sessionStorage.getItem('oidc_state') || localStorage.getItem('oidc_state_backup');
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        console.log('📋 Parsed stored state:', parsed);
        setDebugInfo((prev: any) => ({ ...prev, parsedStoredState: parsed }));
      } catch (e: any) {
        console.error('❌ Failed to parse stored state:', e);
        setDebugInfo((prev: any) => ({ ...prev, stateParseError: e.message }));
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔍 OIDC Production Debug Information
        </h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">URL Parameters</h2>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify({
                code: debugInfo.code ? `${debugInfo.code.substring(0, 50)}...` : null,
                state: debugInfo.state,
                error: debugInfo.error,
                error_description: debugInfo.error_description
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Environment Variables</h2>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(debugInfo.env, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Browser Storage</h2>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(debugInfo.sessionStorage, null, 2)}
            </pre>
            {debugInfo.parsedStoredState && (
              <div className="mt-2">
                <h3 className="font-medium text-yellow-700">Parsed Stored State:</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(debugInfo.parsedStoredState, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-800 mb-2">Current Location</h2>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify({
                currentUrl: debugInfo.currentUrl,
                origin: debugInfo.origin,
                timestamp: debugInfo.timestamp
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Quick Fixes</h2>
            <div className="space-y-2">
              <button 
                type="button"
                onClick={() => {
                  sessionStorage.clear();
                  localStorage.clear();
                  alert('Storage cleared! Try login again.');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Storage & Retry
              </button>
              
              <button 
                type="button"
                onClick={() => router.push('/logint')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
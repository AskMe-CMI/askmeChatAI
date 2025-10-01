'use client';

import { useEffect } from 'react';

async function clearSession() {
  try {
    const response = await fetch('/api/clear-session', {
      method: 'POST',
    });
    if (response.ok) {
      console.log('Session cleared successfully');
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

export default function ClearSessionPage() {
  useEffect(() => {
    clearSession();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Clearing Session...</h1>
        <p className="text-gray-600">
          Please wait while we clear your session.
        </p>
      </div>
    </div>
  );
}

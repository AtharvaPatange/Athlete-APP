'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';

export default function FirebaseDebug() {
  const [config, setConfig] = useState<any>({});
  const [authStatus, setAuthStatus] = useState('checking...');
  const [dbStatus, setDbStatus] = useState('checking...');

  useEffect(() => {
    // Check environment variables
    const envConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
    };
    setConfig(envConfig);

    // Check Auth status
    try {
      if (auth) {
        setAuthStatus('✅ Initialized');
      } else {
        setAuthStatus('❌ Not initialized');
      }
    } catch (error) {
      setAuthStatus('❌ Error: ' + (error as Error).message);
    }

    // Check Firestore status
    try {
      if (db) {
        setDbStatus('✅ Initialized');
      } else {
        setDbStatus('❌ Not initialized');
      }
    } catch (error) {
      setDbStatus('❌ Error: ' + (error as Error).message);
    }
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg border text-sm font-mono">
      <h3 className="font-bold text-lg mb-3">🔍 Firebase Debug Info</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Environment Variables:</h4>
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span>{key}:</span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Services Status:</h4>
        <div className="flex justify-between">
          <span>Auth:</span>
          <span>{authStatus}</span>
        </div>
        <div className="flex justify-between">
          <span>Firestore:</span>
          <span>{dbStatus}</span>
        </div>
      </div>

      <div className="text-xs text-gray-600 mt-4">
        <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</p>
      </div>
    </div>
  );
}

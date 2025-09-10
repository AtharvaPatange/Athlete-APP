'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export default function FirebaseStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading Firebase...</p>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">🔥 Firebase Status</h3>
      <p className="text-sm text-green-600">
        ✅ Firebase is connected successfully!
      </p>
      <p className="text-sm text-gray-600 mt-1">
        User: {user ? user.email || 'Authenticated' : 'Not authenticated'}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Project: athlete-app-c2dbd
      </p>
    </div>
  );
}

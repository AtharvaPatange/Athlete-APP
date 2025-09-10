'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
      return { user: result.user, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = error.message;
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase Authentication is not properly configured.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please check your email or register.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message || 'An error occurred during sign in.';
      }
      
      return { user: null, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign up with email:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.uid);
      return { user: result.user, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = error.message;
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase Authentication is not properly configured. Please check your Firebase console.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or try signing in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message || 'An error occurred during registration.';
      }
      
      return { user: null, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout
  };
};

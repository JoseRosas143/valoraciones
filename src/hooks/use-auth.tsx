
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  Auth,
  GoogleAuthProvider,
  signInWithRedirect, // Changed from signInWithPopup
  getRedirectResult, // To handle the redirect result
} from 'firebase/auth';
import { app } from '@/lib/firebase'; 

interface AuthContextType {
  user: User | null;
  loading: boolean;
  auth: Auth;
  signUp: (email: string, pass: string) => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    // Handle the redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // This is the signed-in user
          const user = result.user;
          console.log('Signed in through redirect:', user);
          // You can access the Google API token if needed:
          // const credential = GoogleAuthProvider.credentialFromResult(result);
          // const token = credential.accessToken;
        }
      })
      .catch((error) => {
        // Handle errors here
        console.error('Error after redirect:', error);
      });

    return () => unsubscribe();
  }, [auth]);

  const signUp = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };
  
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(auth, provider); // Changed to signInWithRedirect
  }

  const value = {
    user,
    loading,
    auth,
    signUp,
    signIn,
    signOut,
    signInWithGoogle
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

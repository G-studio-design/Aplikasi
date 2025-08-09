// src/context/AuthContext.tsx
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user-types';

interface AuthContextProps {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const unsubscribeFromPushNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    console.log('Successfully unsubscribed from push notifications.');
                }
            }
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
        }
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      try {
        return storedUser ? (JSON.parse(storedUser) as User) : null;
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        const { password, ...userToStore } = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }, [currentUser]);

  const logout = useCallback(async () => {
    await unsubscribeFromPushNotifications();
    setCurrentUser(null);
    console.log("User logged out and unsubscribed. Redirecting to login page.");
    router.push('/');
  }, [router]);


  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

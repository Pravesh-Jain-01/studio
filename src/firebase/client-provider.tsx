
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider is a client-side component responsible for initializing
 * Firebase services and wrapping its children with the `FirebaseProvider`.
 * This ensures that Firebase is initialized only once on the client.
 * @param {FirebaseClientProviderProps} props - The props for the component.
 * @returns {JSX.Element} The FirebaseProvider wrapping the children components.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // `useMemo` ensures that `initializeFirebase` is called only once per component mount.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}

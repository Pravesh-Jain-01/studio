'use client';

import { useUser, useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  if (isUserLoading || isProfileLoading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-12 text-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          your profile
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          here's your information.
        </p>
      </div>
      {userData ? (
        <div className="bg-secondary p-8 rounded-lg space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{userData.email}</p>
            </div>
             <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="text-lg font-semibold">{userData.age}</p>
            </div>
             <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="text-lg font-semibold">{userData.phoneNumber}</p>
            </div>
             <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="text-lg font-semibold capitalize">{userData.gender}</p>
            </div>
        </div>
      ) : (
        <p className="text-center">Could not load profile data.</p>
      )}
    </div>
  );
}

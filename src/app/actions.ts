
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import * as z from "zod";

const newsletterSchema = z.string().email({ message: "Invalid email address." });

export async function subscribeToNewsletter(email: string) {
  try {
    const validatedEmail = newsletterSchema.parse(email);
    const { firestore } = initializeFirebase();
    const subscribersCollection = collection(firestore, 'newsletter-subscribers');

    // Check if the email already exists
    const q = query(subscribersCollection, where("email", "==", validatedEmail), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return { success: false, error: "This email is already subscribed." };
    }

    // If not, add the new subscriber
    await addDoc(subscribersCollection, {
      email: validatedEmail,
      subscribedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
    }
    console.error("Error subscribing to newsletter:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

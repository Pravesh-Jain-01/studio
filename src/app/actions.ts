
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as z from "zod";

const newsletterSchema = z.string().email({ message: "Invalid email address." });

export async function subscribeToNewsletter(email: string) {
  try {
    const validatedEmail = newsletterSchema.parse(email);
    const { firestore } = initializeFirebase();
    const subscribersCollection = collection(firestore, 'newsletter-subscribers');

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

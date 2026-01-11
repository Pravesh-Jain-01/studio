
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import * as z from "zod";

const newsletterSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
});

export async function subscribeToNewsletter(email: string) {
    try {
        const { firestore } = initializeFirebase();
        
        const validation = newsletterSchema.safeParse({ email });
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0].message };
        }

        const subscribersCollection = collection(firestore, 'newsletter-subscribers');

        await addDoc(subscribersCollection, {
            email: email,
            subscribedAt: serverTimestamp(),
        });
        
        return { success: true, message: "Thanks for subscribing!" };

    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
}

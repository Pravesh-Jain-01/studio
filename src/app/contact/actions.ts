
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as z from "zod";

// Zod schema for validating the contact form data.
const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

/**
 * A server action to handle contact form submissions.
 * It validates the input and saves the message to the 'contact-messages' collection in Firestore.
 * @param {z.infer<typeof formSchema>} values - The validated form data.
 * @returns {Promise<{success: boolean}>} An object indicating whether the message was sent successfully.
 */
export async function sendMessage(values: z.infer<typeof formSchema>) {
  try {
    const { firestore } = initializeFirebase();
    const messagesCollection = collection(firestore, 'contact-messages');
    
    // Add the new message document to Firestore with a server-generated timestamp.
    await addDoc(messagesCollection, {
      ...values,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false };
  }
}

"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as z from "zod";

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export async function sendMessage(values: z.infer<typeof formSchema>) {
  try {
    const { firestore } = initializeFirebase();
    const messagesCollection = collection(firestore, 'contact-messages');
    
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

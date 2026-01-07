"use server";

import * as z from "zod";

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export async function sendMessage(values: z.infer<typeof formSchema>) {
  try {
    // In a real application, you would send an email or save to a database here.
    // For this example, we'll just log it to the console.
    console.log("New message received:");
    console.log("Name:", values.name);
    console.log("Email:", values.email);
    console.log("Message:", values.message);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false };
  }
}

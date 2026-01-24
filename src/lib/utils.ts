
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to conditionally join CSS class names together.
 * It uses `clsx` to handle conditional classes and `tailwind-merge` to resolve
 * conflicting Tailwind CSS classes intelligently.
 * @param {...ClassValue[]} inputs - A list of class names or conditional class objects.
 * @returns {string} The final merged and optimized class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

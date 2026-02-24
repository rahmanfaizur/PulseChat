import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isSameDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();

  if (isSameDay(d, now)) {
    return format(d, "h:mm a"); // e.g., "2:34 PM"
  }

  if (d.getFullYear() === now.getFullYear()) {
    return format(d, "MMM d, h:mm a"); // e.g., "Feb 15, 2:34 PM"
  }

  return format(d, "MMM d yyyy, h:mm a"); // e.g., "Feb 15 2023, 2:34 PM"
}

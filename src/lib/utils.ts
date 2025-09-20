import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLastWorkday(input: string): string {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const day = date.getDay();

  if (day === 0) {
    // Sunday → move back 2 days to Friday
    date.setDate(date.getDate() - 2);
  } else if (day === 6) {
    // Saturday → move back 1 day to Friday
    date.setDate(date.getDate() - 1);
  } else if (day === 1) {
    // Monday → move back 3 days to Friday
    date.setDate(date.getDate() - 3);
  } else {
    // Tuesday to Friday → move back 1 day
    date.setDate(date.getDate() - 1);
  }

  // Convert back to YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

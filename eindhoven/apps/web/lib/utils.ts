import { treaty } from "@elysiajs/eden";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { App } from "@repo/api/index";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

export const client = treaty<App>(process.env.NEXT_PUBLIC_API_URL);

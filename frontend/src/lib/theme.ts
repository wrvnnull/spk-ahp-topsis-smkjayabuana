import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const colors = {
  border: "hsl(214.3 31.8% 91.4%)",
  input: "hsl(214.3 31.8% 91.4%)",
  ring: "hsl(222.2 84% 4.9%)",
  background: "hsl(0 0% 100%)",
  foreground: "hsl(222.2 84% 4.9%)",
  primary: {
    DEFAULT: "hsl(222.2 47.4% 11.2%)",
    foreground: "hsl(210 40% 98%)",
  },
  secondary: {
    DEFAULT: "hsl(210 40% 96.1%)",
    foreground: "hsl(222.2 47.4% 11.2%)",
  },
  destructive: {
    DEFAULT: "hsl(0 84.2% 60.2%)",
    foreground: "hsl(210 40% 98%)",
  },
  muted: {
    DEFAULT: "hsl(210 40% 96.1%)",
    foreground: "hsl(215.4 16.3% 46.9%)",
  },
  accent: {
    DEFAULT: "hsl(210 40% 96.1%)",
    foreground: "hsl(222.2 47.4% 11.2%)",
  },
  popover: {
    DEFAULT: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
  },
  card: {
    DEFAULT: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
  },
} as const

export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
}

export const mix = {
  card: "border border-border bg-card text-card-foreground shadow-sm rounded-lg",
  input: "flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  button: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  skeleton: "animate-pulse rounded-md bg-muted",
}

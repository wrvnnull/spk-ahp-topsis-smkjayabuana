import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Use webpack for production build (more stable with Tailwind v3)
  // Turbopack is used for dev by default in Next.js 16
};

export default nextConfig;

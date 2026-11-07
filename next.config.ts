import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  experimental: { useTypeScriptCli: false },
};
export default nextConfig;

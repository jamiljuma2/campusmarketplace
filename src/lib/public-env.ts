export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

export const hasSupabase = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
    !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("your-"),
);

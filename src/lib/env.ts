import "server-only";
import { z } from "zod";
import { hasSupabase, publicEnv } from "@/lib/public-env";

const serverSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("CampusMarket KE"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  PAYHERO_API_USERNAME: z.string().optional(),
  PAYHERO_API_PASSWORD: z.string().optional(),
  PAYHERO_CHANNEL_ID: z.string().optional(),
  PAYHERO_CALLBACK_URL: z.string().url().optional(),
});

export const env = {
  ...publicEnv,
  ...serverSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYHERO_API_USERNAME: process.env.PAYHERO_API_USERNAME,
    PAYHERO_API_PASSWORD: process.env.PAYHERO_API_PASSWORD,
    PAYHERO_CHANNEL_ID: process.env.PAYHERO_CHANNEL_ID,
    PAYHERO_CALLBACK_URL: process.env.PAYHERO_CALLBACK_URL,
  }),
};

export { hasSupabase };

export const hasPayHero = Boolean(
  env.PAYHERO_API_USERNAME &&
    env.PAYHERO_API_PASSWORD &&
    env.PAYHERO_CHANNEL_ID &&
    /^\d+$/.test(env.PAYHERO_CHANNEL_ID) &&
    !env.PAYHERO_API_USERNAME.startsWith("your-") &&
    !env.PAYHERO_API_PASSWORD.startsWith("your-") &&
    env.PAYHERO_CALLBACK_URL?.startsWith("https://") &&
    env.PAYHERO_CALLBACK_URL.includes(".supabase.co/functions/v1/payhero-callback"),
);

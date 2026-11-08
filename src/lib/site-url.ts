import "server-only";
import { env } from "@/lib/env";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const deploymentHost = process.env.VERCEL_URL;
const configuredUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
const isLocalUrl = configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1");

export const siteOrigin = !isLocalUrl
  ? configuredUrl
  : productionHost
    ? `https://${productionHost}`
    : deploymentHost
      ? `https://${deploymentHost}`
      : configuredUrl;

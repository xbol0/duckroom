import { hex } from "./deps.ts";

function parseConfig() {
  const env = Deno.env.toObject();

  const port = env.PORT || "9000";

  if (!env.ADMIN_PUBLIC_KEY) throw new Error("Required ADMIN_PUBLIC_KEY");
  if (!env.TG_TOKEN) throw new Error("Required TG_TOKEN");
  if (!env.TG_SECRET) throw new Error("Required TG_SECRET");
  if (!/^[a-f0-9]{64}$/i.test(env.ADMIN_PUBLIC_KEY)) {
    throw new Error("Invalid ADMIN_PUBLIC_KEY format");
  }

  return {
    port: parseInt(port),
    host: env.HOST || "",
    dburl: env.DB_URL || "",
    tgToken: env.TG_TOKEN || "",
    tgSecret: env.TG_SECRET || "",
    adminPublicKey: hex.decode(env.ADMIN_PUBLIC_KEY),
    bloom: env.BLOOM_URL || "",
  };
}

export const config = parseConfig();

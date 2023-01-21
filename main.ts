import { config } from "./config.ts";
import { db } from "./database/mod.ts";
import * as server from "./server/server.ts";

(async () => {
  if (!config.tgToken) throw new Error("Required TG_TOKEN");
  if (!config.tgSecret) throw new Error("Required TG_SECRET");

  await db.init();
  server.start(config.port);
})();

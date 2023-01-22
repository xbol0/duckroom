import { PgProvider } from "../database/pg.ts";
import { ensurePublicKey } from "./activitypub.ts";

Deno.test(async function testEnsurePublicKey() {
  const db = new PgProvider(Deno.env.get("DB_URL")!);
  await db.init();

  console.log(await ensurePublicKey(Deno.env.get("TEST_ACTOR")!));

  await db.close();
});

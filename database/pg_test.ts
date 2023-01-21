import { PgProvider } from "./pg.ts";

Deno.test(async function testPgSiteinfo() {
  const db = new PgProvider(Deno.env.get("DB_URL")!);
  await db.init();
  console.log(await db.getSiteinfo());
  await db.close();
});

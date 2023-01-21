import { pg } from "../deps.ts";
import { DataProvider, MigrationFn } from "../types.ts";
import { Migrations } from "./pg_migrations.ts";

export class PgProvider implements DataProvider {
  pool: pg.Pool;

  constructor(url: string) {
    this.pool = new pg.Pool(url, 10, true);
  }

  async init(): Promise<void> {
    await this.migration(Migrations);
  }

  async close() {
    await this.pool.end();
  }

  async getSiteinfo() {
    return await this.use(async (db) => {
      const res = await db.queryArray`SELECT key,value FROM siteinfos`;
      return Object.fromEntries(res.rows);
    });
  }

  async use<T>(fn: (db: pg.PoolClient) => Promise<T>) {
    const db = await this.pool.connect();
    try {
      return await fn(db);
    } finally {
      db.release();
    }
  }

  async migration(list: MigrationFn[]) {
    await this.use(async (db) => {
      await db.queryArray(
        `CREATE TABLE IF NOT EXISTS migrations (ver INT PRIMARY KEY, created_at TIMESTAMP DEFAULT current_timestamp)`,
      );
      const res = await db.queryArray`SELECT count(*) FROM migrations`;

      let base = 0;
      if (res.rows.length !== 0) {
        base = parseInt(res.rows[0][0] as string);
      }

      if (base === list.length) return;

      let i = 0;
      for (const fn of list.slice(base)) {
        console.log(`current version: ${base + i}`);
        try {
          await fn(db);

          await db.queryArray`INSERT INTO migrations(ver) VALUES (${
            base + i++
          })`;
        } catch (err) {
          console.error(err);
          throw err;
        }
      }

      console.log("Migrated");
    });
  }
}

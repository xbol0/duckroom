import { pg } from "../deps.ts";
import {
  CreateUser,
  DataProvider,
  MigrationFn,
  OutboxInput,
  StatusItem,
  User,
} from "../types.ts";
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

  async getUserByTgid(id: number) {
    return await this.use(async (db) => {
      const res = await db.queryObject<User>(
"SELECT id,tg_id,name,display_name,public_key,private_key, \
avatar,stat,following,followers,statuses FROM accounts WHERE tg_id=$1 LIMIT 1",
        [id],
      );
      if (!res.rows.length) return null;
      return res.rows[0];
    });
  }

  async getUserByName(name: string) {
    return await this.use(async (db) => {
      const res = await db.queryObject<User>(
"SELECT id,tg_id,name,display_name,public_key,private_key, \
avatar,stat,following,followers,statuses FROM accounts WHERE name=$1 LIMIT 1",
        [name],
      );
      if (!res.rows.length) return null;
      return res.rows[0];
    });
  }

  async createUser(data: CreateUser) {
    await this.use(async (db) => {
      await db.queryArray(
"INSERT INTO accounts(tg_id,name,display_name,public_key,private_key,\
avatar) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        [
          data.tg_id,
          data.name,
          data.display_name,
          data.public_key,
          data.private_key,
          data.avatar,
        ],
      );
    });
  }

  async delUserByTgid(id: number) {
    await this.use((db) =>
      db.queryArray("DELETE FROM accounts WHERE tg_id=$1", [id])
    );
  }

  async updateUserMeta(id: number, key: keyof CreateUser, val: unknown) {
    await this.use((db) =>
      db.queryArray(`UPDATE accounts SET ${key}=$2 WHERE tg_id=$1`, [id, val])
    );
  }

  async addOutbox(data: OutboxInput) {
    await this.use((db) =>
      db.queryArray(
'INSERT INTO outbox (id,actor,"to","cc","object",type) VALUES \
($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [data.id, data.actor, data.to, data.cc, data.object, data.type],
      )
    );
  }

  async getOutbox(id: string) {
    return await this.use(async (db) => {
      const res = await db.queryObject(
        "SELECT * FROM outbox WHERE id=$1 LIMIT 1",
        [id],
      );

      if (!res.rows.length) return null;

      return res.rows[0] as StatusItem;
    });
  }
}

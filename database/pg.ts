import { pg } from "../deps.ts";
import {
  Actor,
  CreateUser,
  DataProvider,
  FollowInfo,
  FollowRequest,
  FollowRequestInput,
  MigrationFn,
  OutboxInput,
  Siteinfo,
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

  async setSiteinfo(data: Siteinfo) {
    await this.use(async (db) => {
      for (const [k, v] of Object.entries(data)) {
        await db.queryArray(
'INSERT INTO siteinfos ("key","value") VALUES ($1, $2) \
ON CONFLICT ("key") DO UPDATE SET "value"=$2',
          [k, v],
        );
      }
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
avatar,stat,following,followers,statuses,chat_id,href FROM accounts WHERE tg_id=$1 LIMIT 1",
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
avatar,stat,following,followers,statuses,chat_id,href FROM accounts WHERE name=$1 LIMIT 1",
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
avatar,chat_id,href) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
        [
          data.tg_id,
          data.name,
          data.display_name,
          data.public_key,
          data.private_key,
          data.avatar,
          data.chat_id,
          data.href,
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

  async getOutboxTotal(id: string) {
    return await this.use(async (db) => {
      const res = id
        ? await db.queryArray("SELECT count(*) FROM outbox WHERE actor=$1", [
          id,
        ])
        : await db.queryArray("SELECT count(*) FROM outbox");
      return res.rows[0][0] as number;
    });
  }

  async listOutbox(id: string, next: string) {
    return await this.use(async (db) => {
      const res = next
        ? await db.queryObject(
'SELECT id,actor,"type","to","cc","object" FROM outbox \
WHERE actor=$1 AND id<$2 ORDER BY created_at DESC LIMIT 10',
          [id, next],
        )
        : await db.queryObject(
'SELECT id,actor,"type","to","cc","object" FROM outbox \
WHERE actor=$1 ORDER BY created_at DESC LIMIT 10',
          [id],
        );

      return res.rows as StatusItem[];
    });
  }

  async getActor(id: string) {
    return await this.use(async (db) => {
      const res = await db.queryObject(
"SELECT id,username,nickname,inbox,outbox,shared_inbox,public_key \
FROM actors WHERE id=$1 LIMIT 1",
        [id],
      );

      if (!res.rows.length) return null;

      return res.rows[0] as Actor;
    });
  }

  async setActor(data: Actor) {
    await this.use((db) =>
      db.queryArray(
"INSERT INTO actors (id,username,nickname,inbox,outbox,shared_inbox,public_key) VALUES \
($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET nickname=$3,public_key=$7",
        [
          data.id,
          data.username,
          data.nickname,
          data.inbox,
          data.outbox,
          data.shared_inbox,
          data.public_key,
        ],
      )
    );
  }

  async addFollowRequest(data: FollowRequestInput) {
    return await this.use(async (db) => {
      const res = await db.queryArray(
        "INSERT INTO follow_requests (name,actor,data) VALUES ($1,$2,$3) RETURNING id",
        [data.name, data.actor, data.data],
      );
      if (res.rows.length) return Number(res.rows[0][0]);
      throw new Error("Add follow request fail");
    });
  }

  async getFollowRequest(id: number) {
    return await this.use(async (db) => {
      const res = await db.queryObject<FollowRequest>(
        "SELECT id,name,actor,data FROM follow_requests WHERE id=$1 LIMIT 1",
        [id],
      );
      if (res.rows.length) return res.rows[0];
      return null;
    });
  }

  async delFollowRequest(id: number) {
    await this.use((db) =>
      db.queryArray(
        "DELETE FROM follow_requests WHERE id=$1",
        [id],
      )
    );
  }

  async delFollower(data: FollowInfo) {
    await this.use(async (db) => {
      const res = await db.queryArray(
        "DELETE FROM followers WHERE name=$1 AND actor=$2 RETURNING 1",
        [data.name, data.actor],
      );
      if (res.rows.length) {
        await db.queryArray(
          "UPDATE accounts SET followers=followers-1 WHERE name=$1",
          [data.name],
        );
      }
    });
  }

  async addFollower(data: FollowInfo) {
    await this.use(async (db) => {
      const res = await db.queryArray(
        "INSERT INTO followers (name,actor) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING 1",
        [data.name, data.actor],
      );
      if (res.rows.length) {
        await db.queryArray(
          "UPDATE accounts SET followers=followers+1 WHERE name=$1",
          [data.name],
        );
      }
    });
  }

  async getFollowerTotal(id: string) {
    return await this.use(async (db) => {
      const res = await db.queryArray(
        "SELECT count(*) FROM followers WHERE name=$1",
        [id],
      );
      return res.rows[0][0] as number;
    });
  }

  async listFollowers(id: string, next: string) {
    return await this.use(async (db) => {
      const res = next
        ? await db.queryArray<[number, string]>(
          "SELECT id,actor FROM followers WHERE name=$1 AND id>$2 ORDER BY created_at DESC LIMIT 10",
          [id, next],
        )
        : await db.queryArray<[number, string]>(
          "SELECT id,actor FROM followers WHERE name=$1 ORDER BY created_at DESC LIMIT 10",
          [id],
        );

      if (!res.rows.length) {
        return [[], ""];
      }

      const n = res.rows[res.rows.length - 1][0];
      const list = res.rows.map((i) => i[1]);
      return [list, n.toString()];
    }) as [string[], string];
  }
}

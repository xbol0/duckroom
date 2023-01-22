import { pg } from "./deps.ts";
export * from "./tg_types.ts";

export type Handler = (q: Request) => Response | Promise<Response>;

export interface DataProvider {
  init(): Promise<void>;
  close(): Promise<void>;

  getSiteinfo<T extends Siteinfo>(): Promise<T>;
  getUserByTgid(id: number): Promise<User | null>;
  getUserByName(name: string): Promise<User | null>;
  createUser(input: CreateUser): Promise<void>;
  delUserByTgid(id: number): Promise<void>;
  updateUserMeta(
    id: number,
    key: keyof CreateUser,
    val: unknown,
  ): Promise<void>;

  addOutbox(data: OutboxInput): Promise<void>;
}

export type MigrationFn = (db: pg.PoolClient) => Promise<unknown>;
export type Siteinfo = {
  title: string;
  admin: string;
};

export type User = {
  id: number;
  tg_id: number;
  name: string;
  display_name: string;
  avatar: string;
  following: number;
  followers: number;
  statuses: number;
  public_key: string;
};
export type CreateUser = {
  tg_id: number;
  name: string;
  display_name: string;
  public_key: string;
  private_key: Uint8Array;
  avatar: string;
};

export type AdminInitInput = {
  max_connections?: number;
  url?: string;
};

export type WebhookParams = {
  url: string;
  secret_token: string;
  max_connections?: number;
};

export type OutboxInput = {
  id: string;
  actor: string;
  to: string[];
  cc: string[];
  type: string;
  object: unknown;
};

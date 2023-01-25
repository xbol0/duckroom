import { pg } from "./deps.ts";
export * from "./tg_types.ts";

import * as AP from "./ap_types.ts";
export * from "./ap_types.ts";

export type Handler = (q: Request) => Response | Promise<Response>;

export interface DataProvider {
  init(): Promise<void>;
  close(): Promise<void>;

  getSiteinfo<T extends Siteinfo>(): Promise<T>;
  setSiteinfo(data: Siteinfo): Promise<void>;

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
  getOutbox(id: string): Promise<StatusItem | null>;
  getOutboxTotal(id: string): Promise<number>;
  listOutbox(id: string, next: string): Promise<StatusItem[]>;

  getActor(id: string): Promise<Actor | null>;
  setActor(data: Actor): Promise<void>;

  addFollowRequest(data: FollowRequestInput): Promise<number>;
  getFollowRequest(id: number): Promise<FollowRequest | null>;
  delFollowRequest(id: number): Promise<void>;
}

export type MigrationFn = (db: pg.PoolClient) => Promise<unknown>;
export type Siteinfo = Record<string, string>;

export type User = {
  id: number;
  tg_id: number;
  chat_id: number;
  name: string;
  display_name: string;
  avatar: string;
  following: number;
  followers: number;
  statuses: number;
  public_key: string;
  private_key: Uint8Array;
  href: string;
};
export type CreateUser = {
  tg_id: number;
  chat_id: number;
  name: string;
  display_name: string;
  public_key: string;
  private_key: Uint8Array;
  avatar: string;
  href: string;
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

export type StatusItem = OutboxInput & { created_at: Date };

export type Actor = {
  id: string;
  username: string;
  nickname: string;
  public_key: Uint8Array;
  inbox: string;
  outbox: string;
  shared_inbox: string;
};

export type FollowRequest = {
  id: number;
  name: string;
  actor: string;
  data: AP.AP_FollowRequest;
};
export type FollowRequestInput = {
  name: string;
  actor: string;
  data: unknown;
};

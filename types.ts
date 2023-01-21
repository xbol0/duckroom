import { pg } from "./deps.ts";

export type Handler = (q: Request) => Response | Promise<Response>;

export interface DataProvider {
  init(): Promise<void>;
  close(): Promise<void>;

  getSiteinfo<T extends Siteinfo>(): Promise<T>;
}

export type MigrationFn = (db: pg.PoolClient) => Promise<unknown>;
export type Siteinfo = {
  title: string;
  admin: string;
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

export type TgResponse<T> = TgResult<T> | TgFail;
export type TgFail = {
  ok: false;
  error_code: number;
  description: string;
};
export type TgResult<T> = {
  ok: true;
  result: T;
};

export type TgEmpty = TgResponse<Record<string, never>>;
export type TgWebhookInfo = {
  url: string;
  max_connections?: number;
};
export type TgUpdate = {
  update_id: number;
  message?: unknown;
};

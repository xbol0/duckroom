import { MigrationFn } from "../types.ts";

// ***********************
// WARNING: APPEND migrations into this list, DO NOT modify it
// ***********************
export const Migrations: MigrationFn[] = [
  /** 2023-01-06 13:09  Create account table */
  (db) =>
    db.queryArray`CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  tg_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  public_key TEXT NOT NULL,
  private_key BYTEA NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  stat INT NOT NULL DEFAULT 0,
  following INT NOT NULL DEFAULT 0,
  followers INT NOT NULL DEFAULT 0,
  statuses INT NOT NULL DEFAULT 0
)`,

  /** 2023-01-06 15:10  Create siteinfo table */
  (db) =>
    db.queryArray`CREATE TABLE IF NOT EXISTS siteinfos (
  key TEXT PRIMARY KEY,
  value TEXT
)`,

  /** 2023-01-22 16:00  Create outbox table */
  (db) =>
    db.queryArray`CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  type TEXT NOT NULL,
  "to" TEXT[] NOT NULL,
  cc TEXT[] NOT NULL,
  "object" JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
)`,

  /** 2023-01-22 16:29  Create outbox index for actor */
  (db) => db.queryArray`CREATE INDEX actor_idx ON outbox (actor)`,

  /** 2023-01-22 20:52  Create actors table */
  (db) =>
    db.queryArray`CREATE TABLE IF NOT EXISTS actors (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  nickname TEXT,
  summary TEXT,
  public_key BYTEA,
  inbox TEXT,
  outbox TEXT,
  shared_inbox TEXT
)`,

  /** 2023-01-23 15:44  Add column chat_id for accounts */
  (db) =>
    db.queryArray(
      "ALTER TABLE IF EXISTS accounts ADD COLUMN IF NOT EXISTS chat_id INT NOT NULL DEFAULT 0",
    ),

  /** 2023-01-23 15:44  Change column chat_id to bigint for accounts */
  (db) =>
    db.queryArray(
      "ALTER TABLE IF EXISTS accounts ALTER COLUMN chat_id TYPE BIGINT",
    ),

  /** 2023-01-23 15:44  Add column href for accounts */
  (db) =>
    db.queryArray(
      "ALTER TABLE IF EXISTS accounts ADD COLUMN IF NOT EXISTS href TEXT NOT NULL DEFAULT ''",
    ),

  /** 2023-01-23 19:49  Create follow_requests table */
  (db) =>
    db.queryArray(
      "CREATE TABLE IF NOT EXISTS follow_requests (id SERIAL PRIMARY KEY,actor TEXT NOT NULL,data JSONB NOT NULL,name TEXT NOT NULL)",
    ),

  /** 2023-01-25 19:02  Create followers table */
  (db) =>
    db.queryArray(
      "CREATE TABLE IF NOT EXISTS followers (id SERIAL PRIMARY KEY,name TEXT NOT NULL,actor TEXT NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT current_timestamp)",
    ),

  /** 2023-01-25 19:24  Create index name for followers */
  (db) =>
    db.queryArray("CREATE INDEX IF NOT EXISTS name_idx ON followers (name)"),
];

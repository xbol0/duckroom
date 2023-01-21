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
];

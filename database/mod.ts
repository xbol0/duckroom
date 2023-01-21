import { config } from "../config.ts";
import { DataProvider } from "../types.ts";
import { PgProvider } from "./pg.ts";

function getProvider(): DataProvider {
  const url = config.dburl;

  if (!url) throw new Error("No database provider");

  if (url.startsWith("postgres://")) {
    return new PgProvider(url);
  }

  if (url.startsWith("postgresql://")) {
    return new PgProvider(url);
  }

  throw new Error("Unknown database provider");
}

export const db = getProvider();

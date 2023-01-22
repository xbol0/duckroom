import { db } from "../database/mod.ts";
import { TgMessage } from "../types.ts";

export async function getSession(msg: TgMessage) {
  return await db.getUserByTgid(msg.from.id);
}

import { ErrorRes } from "../deps.ts";
import { adminAuth } from "../lib/auth.ts";
import { AdminInitInput } from "../types.ts";
import * as bot from "../lib/bot.ts";
import { respond } from "../server/response.ts";
import { config } from "../config.ts";
import { DefaultCommands } from "../constant/commands.ts";
import { db } from "../database/mod.ts";

export async function initBot(req: Request) {
  const body = await adminAuth<AdminInitInput>(req);
  if (!verifyBody(body)) throw new ErrorRes("Invalid body");

  const me = await bot.getMe();
  console.log(me);

  const u = new URL(req.url);
  await db.setSiteinfo({
    bot_id: me.id.toString(),
    bot_name: me.first_name,
    username: me.username,
    origin: u.origin,
  });
  console.log("Update siteinfo successful.");

  const url = body.url || `${u.origin}/webhook`;

  console.log("Get bot webhook info...");
  const info = await bot.getWebhookInfo();

  console.log(info);
  console.log("Update webhook info");

  await bot.setWebhook({
    url,
    secret_token: config.tgSecret,
    max_connections: 60,
  });

  console.log("Update bot commands");
  await bot.setMyCommands({ commands: DefaultCommands });

  console.log("Update webhook info success");

  return respond(null, 202);
}

function verifyBody(input: unknown): input is AdminInitInput {
  if (typeof input !== "object" || input === null) return false;
  if (
    "max_connections" in input && (typeof input.max_connections !== "number")
  ) return false;

  if ("url" in input && typeof input.url !== "string") return false;
  return true;
}

export async function getBotInfo(_: Request) {
  return respond(await bot.getMe());
}

export async function uninstall(_: Request) {
  await bot.resetWebhook();
  return respond(null, 202);
}

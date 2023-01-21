import { ErrorRes, log } from "../deps.ts";
import { adminAuth } from "../lib/auth.ts";
import { AdminInitInput } from "../types.ts";
import * as bot from "../lib/bot.ts";
import { respond } from "../server/response.ts";
import { config } from "../config.ts";

export async function initBot(req: Request) {
  const body = await adminAuth<AdminInitInput>(req);
  if (!verifyBody(body)) throw new ErrorRes("Invalid body");

  const url = body.url || `${new URL(req.url).origin}/webhook`;

  log("Get bot webhook info...");
  const info = await bot.getWebhookInfo();

  log(`Webhook info: ${info}`);

  if (url == info.url) {
    log(`Webhook url is equal ${url}, skip initialize`);
    return respond(null, 202);
  }

  log("Update webhook info");
  await bot.setWebhook({
    url,
    secret_token: config.tgSecret,
    max_connections: 60,
  });

  log("Update webhook info success");

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

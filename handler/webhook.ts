import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";
import { respond } from "../server/response.ts";
import { TgMessage } from "../tg_types.ts";
import { TgUpdate } from "../types.ts";
import { handleCallbackQuery } from "./webhook/callback_query.ts";
import { handleCommand } from "./webhook/command.ts";
import { handleOutbox } from "./webhook/outbox.ts";

export async function webhook(req: Request) {
  const ht = req.headers.get("x-telegram-bot-api-secret-token");
  if (ht !== config.tgSecret) throw new ErrorRes("Illegal request", 403);

  const json = await req.json();
  console.log(json);

  if (!verifyBody(json)) throw new ErrorRes("Invalid format", 400);

  if (json.message) handleMessage(json.message, req);
  if (json.callback_query) handleCallbackQuery(json.callback_query, req);

  return respond(null, 202);
}

function handleMessage(msg: TgMessage, req: Request) {
  if (
    msg.entities?.length && msg.entities.some((i) => i.type === "bot_command")
  ) {
    const item = msg.entities.find((i) => i.type === "bot_command")!;
    const command = msg.text!.slice(item.offset + 1, item.length + item.offset);
    const content = msg.text!.slice(item.length + 1);

    queueMicrotask(() => handleCommand(command, content, msg, req));
  } else if (
    msg.caption_entities?.length &&
    msg.caption_entities.some((i) => i.type === "bot_command")
  ) {
    const item = msg.caption_entities.find((i) => i.type === "bot_command")!;
    const command = msg.caption!.slice(
      item.offset + 1,
      item.length + item.offset,
    );
    const content = msg.caption!.slice(item.length + 1);

    queueMicrotask(() => handleCommand(command, content, msg, req));
  } else {
    queueMicrotask(() => handleOutbox(msg, req));
  }
}

function verifyBody(input: unknown): input is TgUpdate {
  if (typeof input !== "object" || input === null) return false;
  if (!("update_id" in input)) return false;
  return true;
}

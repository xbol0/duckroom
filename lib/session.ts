import { db } from "../database/mod.ts";
import { ErrorRes } from "../deps.ts";
import { TgMessage } from "../types.ts";
import { sendMessage } from "./bot.ts";

export async function getSession(msg: TgMessage, throwError = true) {
  const res = await db.getUserByTgid(msg.from.id);

  if (!res && throwError) {
    await sendMessage({
      chat_id: msg.chat.id,
      text: "You haven't registered, please register by /bind first.",
    });
    throw new ErrorRes(
      "You haven't registered, please register by /bind first.",
    );
  }

  return res;
}

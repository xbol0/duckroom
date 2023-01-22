import { getSession } from "../../lib/session.ts";
import { TgMessage } from "../../types.ts";
import * as Bot from "../../lib/bot.ts";

export async function handleOutbox(msg: TgMessage, _req: Request) {
  const s = await getSession(msg);

  if (!s) {
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "You haven't registered, please register by /bind first.",
    });
    return;
  }

  // TODO: store outbox and forward to other instances
}

import { getSession } from "../../lib/session.ts";
import { TgMessage } from "../../tg_types.ts";
import * as Bot from "../../lib/bot.ts";
import { RegisteredCommands } from "../../constant/commands.ts";
import { db } from "../../database/mod.ts";

export async function refreshCommands(
  _: string,
  msg: TgMessage,
  _req: Request,
) {
  console.log(`${msg.from.id} request refresh commands.`);
  const s = await getSession(msg, false);

  if (s) {
    await Bot.setMyCommands({
      commands: RegisteredCommands,
      scope: { type: "chat", chat_id: msg.chat.id },
    });
    console.log(`User ${msg.from.id} commands updated to registered.`);
  } else {
    console.log(`User ${msg.from.id} does not registered, restore to default`);
    await Bot.deleteMyCommands({
      scope: { type: "chat", chat_id: msg.chat.id },
    });
  }

  console.log(`Update ${msg.from.id} chat_id`);
  await db.updateUserMeta(msg.from.id, "chat_id", msg.chat.id);

  await Bot.sendMessage({
    chat_id: msg.chat.id,
    text: "Your commands was updated.",
  });
}

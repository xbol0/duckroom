import { TgMessage } from "../../types.ts";
import * as Account from "../../app/account.ts";
import * as Bot from "../../lib/bot.ts";

const Commands = new Map<string, (c: string, m: TgMessage) => unknown>();

Commands.set("bind", async (content, msg) => {
  const name = content.trim();
  if (name.length === 0) {
    //
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text:
"No username specified, please send as this format: /bind [username]. \
eg. /bind alice",
    });
    return;
  }

  await Account.createAccount({
    name,
    display_name: name,
    avatar: "",
    tg_id: msg.from.id,
  });
});

export async function handleCommand(
  cmd: string,
  content: string,
  msg: TgMessage,
) {
  const fn = Commands.get(cmd);

  if (!fn) return;

  try {
    await fn(content, msg);
  } catch (err) {
    console.error(err);
  }
}

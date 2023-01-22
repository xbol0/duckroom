import { TgMessage } from "../../types.ts";
import * as Account from "../../app/account.ts";
import * as Bot from "../../lib/bot.ts";

const Commands = new Map<
  string,
  (c: string, m: TgMessage, q: Request) => unknown
>();

Commands.set("bind", async (content, msg, req) => {
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

  try {
    await Account.createAccount({
      name,
      display_name: name,
      avatar: "",
      tg_id: msg.from.id,
    });

    const u = new URL(req.url);
    const id = `@${name}@${u.hostname}`;
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "Registered successful.\n\nHere is your ID: **" + id +
        "**, you can tell your friends to follow it.",
      parse_mode: "MarkdownV2",
    });

    // TODO: Update this user's commands
  } catch (err) {
    console.error(err);

    await Bot.sendMessage({ chat_id: msg.chat.id, text: err.message });
  }
});

export async function handleCommand(
  cmd: string,
  content: string,
  msg: TgMessage,
  req: Request,
) {
  const fn = Commands.get(cmd);

  if (!fn) return;

  try {
    await fn(content, msg, req);
  } catch (err) {
    console.error(err);
  }
}

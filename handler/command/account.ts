import { TgMessage } from "../../tg_types.ts";
import * as Bot from "../../lib/bot.ts";
import * as Account from "../../app/account.ts";
import { escapeV2 } from "../../lib/tg_util.ts";
import { RegisteredCommands } from "../../constant/commands.ts";

export async function bind(content: string, msg: TgMessage, req: Request) {
  const name = content.trim();
  if (name.length === 0) {
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
      chat_id: msg.chat.id,
    });

    const u = new URL(req.url);
    const id = `@${name}@${u.hostname}`;
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "Registered successful\\.\n\nHere is your ID: *" + escapeV2(id) +
        "*, you can tell your friends to follow it\\.",
      parse_mode: "MarkdownV2",
    });

    console.log("Update user commands");
    await Bot.setMyCommands({
      commands: RegisteredCommands,
      scope: { type: "chat", chat_id: msg.chat.id },
    });

    console.log("Update user commands successful.");
  } catch (err) {
    console.error(err);

    await Bot.sendMessage({ chat_id: msg.chat.id, text: err.message });
  }
}

export async function unbind(content: string, msg: TgMessage, _req: Request) {
  console.log(`User ${msg.from.id} unbind, reason: ${content}`);

  try {
    await Account.delAccount(msg.from.id);
    console.log(`Delete user ${msg.from.id} successfully.`);

    console.log("Update this user's commands");
    await Bot.deleteMyCommands({
      scope: { type: "chat", chat_id: msg.chat.id },
    });

    console.log("Delete user's commands successfully.");
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text:
        "Your account has been shutdowned, your data would be deleted soon.",
    });
  } catch (err) {
    console.error(err);
  }
}

import { TgMessage } from "../../tg_types.ts";
import * as Bot from "../../lib/bot.ts";
import { getSession } from "../../lib/session.ts";
import { db } from "../../database/mod.ts";

export async function getProfile(_: string, msg: TgMessage, _req: Request) {
  const s = await getSession(msg);

  if (!s) {
    console.error(`User ${msg.from.id} is not registered.`);
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "You haven't registered, please register by /bind first.",
    });
    return;
  }

  if (!s.avatar) {
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text:
        "You don't have set an avatar, send a picture with command /avatar to set an avatar.",
    });
  } else {
    await Bot.sendPhoto({ chat_id: msg.chat.id, photo: s.avatar });
  }

  await Bot.sendMessage({
    chat_id: msg.chat.id,
    text: [
      `Username: ${s.name}`,
      `Nickname: ${s.display_name}`,
      `Followers: ${s.followers}`,
      `Following: ${s.following}`,
      `Statuses: ${s.statuses}`,
    ].join("\n"),
  });
}

export async function nickname(content: string, msg: TgMessage, _: Request) {
  const s = await getSession(msg);

  if (content) {
    console.log(`User ${msg.from.id} setup a new nickname: ${content}`);

    await db.updateUserMeta(msg.from.id, "display_name", content);
    console.log(`Update user ${msg.from.id} nickname successfully: ${content}`);

    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "Update successfully, your new nickname: " + content,
    });
    return;
  }

  await Bot.sendMessage({
    chat_id: msg.chat.id,
    text: "Your nickname: " + s!.display_name +
      ".\n\nYou can change it with /nickname [new] command.",
  });
}

export async function avatar(_c: string, msg: TgMessage, _: Request) {
  const s = await getSession(msg);

  if (msg.photo && msg.photo.length) {
    const photos = [...new Set(msg.photo.map((i) => i.file_id))];
    const fileId = photos[0];
    console.log(`User ${msg.from.id} update avatar, file_id: ${fileId}`);

    await db.updateUserMeta(msg.from.id, "avatar", fileId);
    console.log(`Update user ${msg.from.id} successfully.`);

    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: "Your avatar was updated successfully.",
    });
    return;
  }

  if (s!.avatar) {
    await Bot.sendPhoto({ photo: s!.avatar, chat_id: msg.chat.id });
  } else {
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text:
        "You don't have set an avatar, send a picture with command /avatar to set an avatar.",
    });
  }
}

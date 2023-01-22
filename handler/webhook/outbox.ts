import { getSession } from "../../lib/session.ts";
import { TgMessage } from "../../types.ts";
import * as Bot from "../../lib/bot.ts";
import * as AP from "../../constant/activitypub.ts";
import { newId } from "../../lib/activitypub.ts";
import { db } from "../../database/mod.ts";

export async function handleOutbox(msg: TgMessage, req: Request) {
  const s = await getSession(msg);

  if (!s) return;

  const u = new URL(req.url);
  const id = `${u.origin}/status?id=${newId()}`;

  async function answerMessage() {
    await Bot.sendMessage({
      chat_id: msg.chat.id,
      text: `Your post was created: ${id}`,
      disable_web_page_preview: true,
    });
  }

  if (msg.text) {
    // Text only message
    const data = {
      type: "Create",
      actor: `${u.origin}/user?id=${s.name}`,
      to: [`${u.origin}/followers?id=${s.name}`],
      cc: [AP.ActivityStreamPublic],
      object: {
        id,
        type: "Note",
        published: new Date().toISOString(),
        attributedTo: `${u.origin}/user?id=${s.name}`,
        to: [AP.ActivityStreamPublic],
        content: msg.text,
      },
      id,
    };
    console.log(data);

    await db.addOutbox(data);

    console.log("outbox created");

    await answerMessage();
  }
  // TODO: handle other type messages
  // TODO: forward to other instances
}

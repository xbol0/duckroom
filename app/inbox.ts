import { AP_Follow, AP_Inbox } from "../ap_types.ts";
import { db } from "../database/mod.ts";
import { parseUsername } from "../lib/activitypub.ts";
import * as Bot from "../lib/bot.ts";

export function handleInbox(input: AP_Inbox, req: Request) {
  if (input.type === "Follow") {
    return handleFollow(input, req);
  }

  console.log(`Unsupport type '${input.type}'`);
}

async function handleFollow(input: AP_Follow, req: Request) {
  if (typeof input.object !== "string") {
    throw new Error("Invalid object");
  }

  const u = new URL(req.url);
  const objectUrl = new URL(input.object);
  if (u.origin !== objectUrl.origin) {
    // May be one followed cc to you.
    return;
  }

  // TODO: implement support manually approve follow request
  // Now test for implement Telegram bot.

  const id = objectUrl.searchParams.get("id");
  if (!id) return;

  const user = await db.getUserByName(id);
  if (!user) return;

  const from = await parseUsername(input.actor);
  await Bot.sendMessage({
    chat_id: Number(user.chat_id),
    text: `${from} requests to follow you.`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Accept", callback_data: "accept" },
          { text: "Reject", callback_data: "reject" },
        ],
      ],
    },
  });
}

import { AP_Follow, AP_Inbox } from "../ap_types.ts";
import { db } from "../database/mod.ts";
import { parseUsername } from "../lib/activitypub.ts";
import * as Bot from "../lib/bot.ts";

export function handleInbox(input: AP_Inbox, req: Request) {
  if (input.type === "Follow") {
    return handleFollow(input, req);
  }

  throw new Error(`'${input.type}' is not implemented`);
}

async function handleFollow(input: AP_Follow, req: Request) {
  if (typeof input.object !== "string") {
    throw new Error("Invalid object");
  }

  const u = new URL(req.url);
  const objectUrl = new URL(input.object);
  if (u.origin !== objectUrl.origin) {
    throw new Error(`${input.object} is not belongs to this instance.`);
  }

  // TODO: implement support manually approve follow request
  // Now test for implement Telegram bot.

  const id = objectUrl.searchParams.get("id");
  if (!id) return;

  const user = await db.getUserByName(id);
  if (!user) throw new Error(`User '${id}' not found`);

  const from = await parseUsername(input.actor);
  const actor = await db.getActor(input.actor);

  if (!actor) throw new Error(`Actor '${input.actor}' not found`);

  console.log("save follow request to database");
  // @ts-ignore delete activitypub context
  delete input["@context"];
  const qid = await db.addFollowRequest({
    actor: actor.id,
    data: input,
    name: user.name,
  });

  await Bot.sendMessage({
    chat_id: Number(user.chat_id),
    text: `${from} requests to follow you.`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Accept", callback_data: `accept:${qid}` },
          { text: "Reject", callback_data: `reject:${qid}` },
        ],
      ],
    },
  });
}

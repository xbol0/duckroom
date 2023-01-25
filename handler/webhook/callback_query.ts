import { db } from "../../database/mod.ts";
import { acceptFollow } from "../../lib/ap_call.ts";
import { TgCallbackQuery } from "../../tg_types.ts";
import * as Bot from "../../lib/bot.ts";

export async function handleCallbackQuery(cq: TgCallbackQuery, req: Request) {
  // TODO: other ways to handle empty data callbacks
  if (!cq.data) return;

  if (cq.data.startsWith("accept:")) {
    await handleAcceptCallback(cq, req);
  }
}

async function handleAcceptCallback(cq: TgCallbackQuery, _: Request) {
  const id = parseInt(cq.data!.slice(7));
  console.log(`Accept ${id} follow request`);

  try {
    const request = await db.getFollowRequest(id);
    if (!request) return;

    const [user, actor] = await Promise.all([
      db.getUserByTgid(cq.from.id),
      db.getActor(request.actor),
    ]);

    if (!user || !actor) return;
    await acceptFollow(user, actor, request.data);
    console.log("send ap message success");

    console.log(`delete follow request ${id}`);
    await db.delFollowRequest(id);

    console.log("answer callback query");
    await Bot.answerCallbackQuery({
      callback_query_id: cq.id,
      text: "Accept follow request successful",
    });

    console.log("delete message");
    await Bot.deleteMessage({
      chat_id: cq.message!.chat.id,
      message_id: cq.message!.message_id,
    });

    console.log("handle accept event success");
  } catch (err) {
    console.error(err);
  }
}

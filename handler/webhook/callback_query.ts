import { db } from "../../database/mod.ts";
import { acceptFollow } from "../../lib/ap_call.ts";
import { TgCallbackQuery } from "../../tg_types.ts";

export async function handleCallbackQuery(cq: TgCallbackQuery, req: Request) {
  // TODO: other ways to handle empty data callbacks
  if (!cq.data) return;

  if (cq.data.startsWith("accept:")) {
    await handleAcceptCallback(cq, req);
  }
}

async function handleAcceptCallback(cq: TgCallbackQuery, _: Request) {
  const id = cq.data!.slice(7);
  console.log(`Accept ${id} follow request`);

  try {
    const request = await db.getFollowRequest(+id);
    if (!request) return;

    const [user, actor] = await Promise.all([
      db.getUserByTgid(cq.from.id),
      db.getActor(request.actor),
    ]);

    if (!user || !actor) return;
    await acceptFollow(user, actor, request.data);
  } catch (err) {
    console.error(err);
  }
}

import { Actor, User } from "../types.ts";
import { signAndSend } from "./activitypub.ts";
import * as AP from "../constant/activitypub.ts";

export function acceptFollow(from: User, actor: Actor, object: unknown) {
  return signAndSend(from, actor, {
    "@context": AP.ActivityStream,
    type: "Accept",
    actor: from.href,
    object,
  });
}

import { db } from "../database/mod.ts";
import { ErrorRes } from "../deps.ts";
import { respond } from "../server/response.ts";
import * as AP from "../constant/activitypub.ts";
import { verifyInbox } from "../lib/activitypub.ts";
import { handleInbox } from "../app/inbox.ts";
import { AP_Inbox } from "../ap_types.ts";

export async function user(req: Request) {
  const { id, origin } = getId(req);
  const u = await db.getUserByName(id);

  if (!u) return respond(null, 404);

  return respond({
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],

    id: `${origin}/user?id=${u.name}`,
    type: "Person",
    preferredUsername: u.name,
    name: u.display_name,
    inbox: `${origin}/inbox?id=${u.name}`,
    outbox: `${origin}/outbox?id=${u.name}`,
    followers: `${origin}/followers?id=${u.name}`,

    publicKey: {
      id: `${origin}/user?id=${u.name}#main-key`,
      owner: `${origin}/user?id=${u.name}`,
      publicKeyPem: u.public_key,
    },
  });
}

export async function status(req: Request) {
  getId(req);

  const res = await db.getOutbox(req.url);
  if (!res) return respond(null, 404);

  return respond(res);
}

export async function inbox(req: Request) {
  try {
    const json = await verifyInbox<AP_Inbox>(req);
    console.log(json);
    queueMicrotask(async () => {
      try {
        await handleInbox(json, req);
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);

    return respond(err, 400);
  }

  return respond(null, 202);
}

export async function followers(req: Request) {
  const { id, origin } = getId(req);

  const u = new URL(req.url);
  const next = u.searchParams.get("next");

  const total = Number(await db.getFollowerTotal(id));

  if (typeof next === "string") {
    const [list, lastItem] = await db.listFollowers(id, next);

    return respond({
      "@context": [AP.ActivityStream],
      type: "OrderedCollectionPage",
      totalItems: total,
      id: `${origin}/followers?id=${id}&next=${next}`,
      orderedItems: list,
      next: list.length
        ? `${origin}/followers?id=${id}&next=${lastItem}`
        : void 0,
    });
  } else {
    return respond({
      "@context": [AP.ActivityStream],
      type: "OrderedCollection",
      totalItems: total,
      id: `${origin}/followers?id=${id}`,
      first: `${origin}/followers?id=${id}&next=`,
    });
  }
}

export async function outbox(req: Request) {
  const { id, origin } = getId(req);

  const u = new URL(req.url);
  const next = u.searchParams.get("next");

  const total = Number(await db.getOutboxTotal(`${origin}/user?id=${id}`));

  if (typeof next === "string") {
    const list = await db.listOutbox(
      `${origin}/user?id=${id}`,
      next ? `${origin}/status?id=${next}` : "",
    );
    const lastItem = list.pop()?.id;

    return respond({
      "@context": [AP.ActivityStream],
      type: "OrderedCollectionPage",
      totalItems: total,
      id: `${origin}/outbox?id=${id}&next=${next}`,
      orderedItems: list,
      next: list.length
        ? `${origin}/outbox?id=${id}&next=${
          lastItem && new URL(lastItem).searchParams.get("id")
        }`
        : void 0,
    });
  } else {
    return respond({
      "@context": [AP.ActivityStream],
      type: "OrderedCollection",
      totalItems: total,
      id: `${origin}/outbox?id=${id}`,
      first: `${origin}/outbox?id=${id}&next=`,
    });
  }
}

function getId(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id");

  if (!id) throw new ErrorRes("Required ID");

  return { id, origin: u.origin };
}

import { db } from "../database/mod.ts";
import { ErrorRes } from "../deps.ts";
import { respond } from "../server/response.ts";

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
  return respond(null, 202);
}

export async function outbox(req: Request) {
  return respond(null, 202);
}

function getId(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id");

  if (!id) throw new ErrorRes("Required ID");

  return { id, origin: u.origin };
}

import { base64, hex } from "../deps.ts";
import * as AP from "../constant/activitypub.ts";
import { db } from "../database/mod.ts";
import { Actor } from "../types.ts";

export function newId() {
  const ts = (~~(Date.now() / 1000)).toString(16);
  const rnd = hex.encode(crypto.getRandomValues(new Uint8Array(6)));
  return ts + rnd;
}

export async function ensurePublicKey(id: string) {
  const e = await db.getActor(id);
  if (e) {
    console.log(`Actor ${id} exists, skip fetch`);
    return;
  }

  console.log("fetch", id);
  const res = await fetch(id, {
    headers: {
      accept: "application/activity+json",
      "user-agent": "Duckroom",
    },
  });

  if (res.status !== 200) {
    console.log(res.status);
    throw new Error("Request fail: " + res.status);
  }

  const json = await res.json();
  console.log(json);

  if (!("@context" in json) || json["@context"] instanceof Array) {
    throw new Error("Invalid format, may not be an activitypub instance.");
  }

  const data: Record<string, unknown> = { id };

  if (json["@context"].includes(AP.ActivityStream)) {
    if (
      "preferredUsername" in json && typeof json.preferredUsername === "string"
    ) data.username = json.preferredUsername;
    if ("name" in json && typeof json.name === "string") {
      data.nickname = json.name;
    }
    if ("summary" in json && typeof json.summary === "string") {
      data.summary = json.summary;
    }
    if ("inbox" in json && typeof json.inbox === "string") {
      data.inbox = json.inbox;
    }
    if ("outbox" in json && typeof json.outbox === "string") {
      data.outbox = json.outbox;
    }
    if (
      "endpoints" in json && typeof json.endpoints === "object" &&
      "sharedInbox" in json.endpoints &&
      typeof json.endpoints.sharedInbox === "string"
    ) {
      data.shared_inbox = json.endpoints.shared_inbox;
    }
  }

  if (json["@context"].includes(AP.ActivitySecurity)) {
    if (
      "publicKey" in json && typeof json.publicKey === "object" &&
      "publicKeyPem" in json.publicKey &&
      typeof json.publicKey.publicKeyPem === "string"
    ) {
      const str = json.publicKey.publicKeyPem.trim().split("\n").slice(1, -1)
        .join("");
      const raw = base64.decode(str);
      data.public_key = await crypto.subtle.importKey(
        "spki",
        raw,
        { name: "RSA-PSS", hash: "SHA-256" },
        true,
        ["sign"],
      );
    }
  }

  console.log(data);

  await db.setActor(data as Actor);
  console.log("set actor successful.");
}

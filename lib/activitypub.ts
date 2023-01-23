import { base64, ErrorRes, hex } from "../deps.ts";
import * as AP from "../constant/activitypub.ts";
import { db } from "../database/mod.ts";
import { Actor } from "../types.ts";
import { AP_Person } from "../ap_types.ts";

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
  const json = await fetchActivity(id);

  console.log(json);

  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid format, may not be an activitypub instance. 1");
  }
  if (!("@context" in json)) {
    throw new Error("Invalid format, may not be an activitypub instance. 2");
  }
  if (
    json["@context"] !== AP.ActivityStream &&
    !(json["@context"] instanceof Array &&
      json["@context"].includes(AP.ActivityStream))
  ) {
    throw new Error("Invalid format, may not be an activitypub instance. 3");
  }
  if (!("type" in json) || json.type !== "Person") {
    throw new Error("Object type is not a Person.");
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
      json.endpoints && "sharedInbox" in json.endpoints &&
      typeof json.endpoints.sharedInbox === "string"
    ) {
      data.shared_inbox = json.endpoints.sharedInbox;
    }
  }

  if (json["@context"].includes(AP.ActivitySecurity)) {
    if (
      "publicKey" in json && typeof json.publicKey === "object" &&
      json.publicKey && "publicKeyPem" in json.publicKey &&
      typeof json.publicKey.publicKeyPem === "string"
    ) {
      const str = json.publicKey.publicKeyPem.trim().split("\n").slice(1, -1)
        .join("");
      data.public_key = base64.decode(str);
    }
  }

  console.log(data);

  await db.setActor(data as Actor);
  console.log("set actor successful.");
}

export async function verifyInbox<T>(req: Request): Promise<T> {
  const digest = req.headers.get("digest"),
    originSign = req.headers.get("signature"),
    date = req.headers.get("date"),
    host = req.headers.get("host"),
    u = new URL(req.url);

  if (host !== u.hostname) throw new ErrorRes("Forbidden");
  if (!date || Date.now() - new Date(date).getTime() > 30000) {
    throw new ErrorRes("Forbidden");
  }
  if (!digest || !originSign) throw new ErrorRes("Forbidden");
  console.log(digest);
  console.log(originSign);

  const buf = await req.arrayBuffer();
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  const hash64 = "SHA-256=" + base64.encode(hash);
  console.log(hash64);

  if (digest !== hash64) throw new ErrorRes("Unmatched content hash.");

  const signObj = parseSignature(originSign);
  console.log(signObj);

  const owner = await getKeyOwner(signObj.keyId);
  console.log("key owner:", owner);

  await ensurePublicKey(owner);
  const actor = await db.getActor(owner);
  if (!actor) throw new ErrorRes(`Actor ${owner} not found`);

  const key = await crypto.subtle.importKey(
    "spki",
    actor.public_key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["verify"],
  );
  let strToSign = `(request-target): ${req.method.toLowerCase()} ${u.pathname}`;
  const headersPart = signObj.headers.map((i) => `${i}: ${req.headers.get(i)}`)
    .join("\n");
  strToSign += "\n" + headersPart;

  console.log(strToSign);

  const v = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", saltLength: 32 },
    key,
    signObj.sign,
    new TextEncoder().encode(strToSign),
  );

  if (!v) {
    throw new ErrorRes("Unverified signature");
  }
  return JSON.parse(new TextDecoder().decode(buf)) as T;
}

function parseSignature(str: string) {
  const arr = str.trim().split(",");
  const keySection = arr.find((i) => i.startsWith('keyId="'));
  if (!keySection) throw new Error("Invalid keyId section");

  const headersSection = arr.find((i) => i.startsWith('headers="'));
  if (!headersSection) throw new Error("Invalid headers section");

  const signSection = arr.find((i) => i.startsWith('signature="'));
  if (!signSection) throw new Error("Invalid signature section");

  const algSection = arr.find((i) => i.startsWith('algorithm="'));
  if (algSection) {
    if (algSection.slice(11, -1) !== "rsa-sha256") {
      throw new Error("Unsupported signature method");
    }
  }

  const keyId = keySection.slice(7, -1);
  const sign = base64.decode(signSection.slice(11, -1));
  const headers = headersSection.slice(9, -1).split(" ").slice(1);

  return { keyId, headers, sign };
}

async function getKeyOwner(keyId: string) {
  const json = await fetchActivity<AP_Person>(keyId);

  console.log(json);
  if (typeof json.id !== "string") throw new Error("Invalid ID format");

  return json.id;
}

export async function fetchActivity<T extends { type: string }>(
  url: string,
): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Duckroom" },
  });

  if (res.status !== 200) throw new Error("Fetch data fail.");
  const json = await res.json();

  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid data format");
  }

  if (!("@context" in json)) throw new Error("Invalid context");
  if (
    !(typeof json["@context"] === "string" &&
      json["@context"] === AP.ActivityStream) &&
    !(json["@context"] instanceof Array &&
      json["@context"].includes(AP.ActivityStream))
  ) {
    throw new Error("Context not contained ActivityStream.");
  }

  return json as T;
}

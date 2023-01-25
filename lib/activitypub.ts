import { base64, ErrorRes, hex } from "../deps.ts";
import * as AP from "../constant/activitypub.ts";
import { db } from "../database/mod.ts";
import { Actor, User } from "../types.ts";
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

// Decode user id and return user meta via webfinger
// eg. @alice@xxx.com
export async function decodeUserId(id: string) {
  const [_, name, host] = id.split("@");
  if (!name || !host) throw new Error("Invalid user id.");
  const res = await fetch(
    `https://${host}/.well-known/webfinger?resource=acct:${name}@${host}`,
    { headers: { accept: "application/json" } },
  );
  if (res.status !== 200) {
    throw new Error("Request fail, status: " + res.status);
  }

  const json = await res.json();
  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid body");
  }

  if (!("links" in json)) {
    throw new Error("Invalid body, not found links.");
  }

  if (!(json.links instanceof Array)) {
    throw new Error("Invalid links format.");
  }

  const list = json.links as { type: string; href: string }[];
  const f = list.find((i) => i.type === "application/activity+json");

  if (!f) throw new Error("Not found activitypub link");

  if (typeof f.href !== "string") throw new Error("Invalid href type");
  return f.href;
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

export async function parseUsername(id: string) {
  const res = await db.getActor(id);
  if (!res) throw new Error(`Actor ${id} not found.`);
  const u = new URL(id);
  return `@${res.username}@${u.hostname}`;
}

export async function signAndSend(from: User, to: Actor, data: unknown) {
  console.log("Sign and send activitypub data:");
  console.log(data);
  const buf = new TextEncoder().encode(JSON.stringify(data));
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const digest = "SHA-256=" + base64.encode(hash);
  const date = new Date().toUTCString();
  const u = new URL(to.inbox);
  const host = u.host;

  const strToSign = [
    `(request-target): post ${u.pathname}`,
    `host: ${host}`,
    `date: ${date}`,
    `digest: ${digest}`,
    `content-type: ${AP.ActivityContentType}`,
  ].join("\n");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    from.private_key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"],
  );
  const signBuf = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", saltLength: 32 },
    key,
    new TextEncoder().encode(strToSign),
  );
  const signature = base64.encode(signBuf);
  const signPayload =
    `keyId="${from.href}#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest content-type",signature="${signature}"`;

  const res = await fetch(to.inbox, {
    method: "POST",
    body: buf,
    headers: {
      "content-type": AP.ActivityContentType,
      date,
      host,
      signature: signPayload,
      digest,
    },
  });
  console.log(res.status);
  console.log(await res.text());
}

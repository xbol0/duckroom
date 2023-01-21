import { bytes, ed25519, hex } from "../deps.ts";

const endpoint = Deno.args.at(0);
const privatekey = Deno.args.at(1);

if (!endpoint) throw new Error("Invalid endpoint");
if (!privatekey || !/^[a-f0-9]{64}$/i.test(privatekey)) {
  throw new Error("Invalid private key");
}
console.log("Test endpoint:", endpoint);

const key = hex.decode(privatekey);
const url = new URL(endpoint);
const now = new Date().toISOString();
const nonce = crypto.randomUUID();
const body = JSON.stringify({});

const digest = hex.encode(
  bytes(await crypto.subtle.digest("SHA-256", bytes(body))),
);
const sign = hex.encode(
  await ed25519.sign(bytes([digest, now, nonce].join("\n")), key),
);

console.log(digest, sign);
const res = await fetch(url, {
  method: "POST",
  body,
  headers: {
    "content-type": "application/json",
    digest,
    authorization: sign,
    "x-api-nonce": nonce,
    date: now,
  },
});
console.log(res.status, await res.text());

import { base64 } from "../deps.ts";

export async function generateKeypair() {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign"],
  );

  const pub = await crypto.subtle.exportKey("spki", keys.publicKey);
  const publicKey = "-----BEGIN PUBLIC KEY-----\n" + base64.encode(pub) +
    "\n-----END PUBLIC KEY-----";

  const privateKey = await crypto.subtle.exportKey("pkcs8", keys.privateKey);

  return { publicKey, privateKey: new Uint8Array(privateKey) };
}

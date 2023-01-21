import { config } from "../config.ts";
import { bytes, ed25519, ErrorRes, hex } from "../deps.ts";
import { bloomReduce } from "./bloom.ts";

export async function adminAuth<T>(req: Request) {
  const auth = req.headers.get("authorization");
  const hash = req.headers.get("digest");
  const nonce = req.headers.get("x-api-nonce");
  const date = req.headers.get("date");

  if (!auth) throw new ErrorRes("Required Authorization", 403);
  if (!hash) throw new ErrorRes("Required Digest", 403);
  if (!nonce) throw new ErrorRes("Required Nonce", 403);
  if (!date) throw new ErrorRes("Required Date", 403);

  if (/^[a-f0-9]{128}$/i.test(auth)) {
    throw new ErrorRes("Invalid authorization");
  }
  if (/^[a-f0-9]{64}$/i.test(hash)) throw new ErrorRes("Invalid hash");
  if (Date.now() - new Date(date).getTime() > 5000) {
    throw new ErrorRes("Request expired", 400);
  }

  const strToSign = [hash, date, nonce].join("\n");
  if (
    !await ed25519.verify(
      hex.decode(auth),
      bytes(strToSign),
      config.adminPublicKey,
    )
  ) {
    throw new ErrorRes("Unauthorized signature", 401);
  }
  const body = await req.arrayBuffer();
  const bodyHash = bytes(await crypto.subtle.digest("SHA-256", body));

  if (hex.encode(bodyHash) != hash) {
    throw new ErrorRes("Unmatched body hash", 401);
  }

  await bloomReduce(nonce);
  return JSON.parse(new TextDecoder().decode(body)) as T;
}

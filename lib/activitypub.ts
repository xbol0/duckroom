import { hex } from "../deps.ts";

export function newId() {
  const ts = (~~(Date.now() / 1000)).toString(16);
  const rnd = hex.encode(crypto.getRandomValues(new Uint8Array(6)));
  return ts + rnd;
}

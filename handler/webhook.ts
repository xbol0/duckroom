import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";
import { respond } from "../server/response.ts";

export async function webhook(req: Request) {
  const ht = req.headers.get("x-telegram-bot-api-secret-token");
  if (ht !== config.tgSecret) {
    throw new ErrorRes("Illegal request", 403);
  }

  console.log(await req.json());
  return respond(null, 202);
}

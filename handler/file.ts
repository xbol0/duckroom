import { respond } from "../server/response.ts";
import * as Bot from "../lib/bot.ts";
import { config } from "../config.ts";

export async function getFile(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id");

  if (!id) return respond(null, 404);

  try {
    const data = await Bot.getFile(id);
    console.log(data);

    if (!data.file_path) return respond(null, 403);

    return fetch(
      `https://api.telegram.org/file/bot${config.tgToken}/${data.file_path}`,
    );
  } catch (err) {
    console.error(err);

    return respond(null, 404);
  }
}

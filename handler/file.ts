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

    const res = await fetch(
      `https://api.telegram.org/file/bot${config.tgToken}/${data.file_path}`,
    );

    const name = data.file_path.split("/").pop();

    return respond(res.body, 200, {
      "content-disposition": `attachment; filename="${name}"`,
      "content-type": res.headers.get("content-type") ||
        "application/octet-stream",
    });
  } catch (err) {
    console.error(err);

    return respond(null, 404);
  }
}

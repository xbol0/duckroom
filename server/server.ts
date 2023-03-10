import { http } from "../deps.ts";
import { respond } from "./response.ts";
import { Router } from "./router.ts";

export function start(port: number) {
  http.serve(async (req) => {
    const path = new URL(req.url).pathname;
    const key = req.method + path;
    console.log(req.method, req.url);
    console.log(req.headers.get("user-agent"));

    const fn = Router.get(key);

    if (!fn) return respond({ error: "Not found" }, 404);

    try {
      return await fn(req);
    } catch (err) {
      return respond(err);
    }
  }, { port });
}

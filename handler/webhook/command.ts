import { TgMessage } from "../../types.ts";
import * as Account from "../command/account.ts";

const Commands = new Map<
  string,
  (c: string, m: TgMessage, q: Request) => unknown
>([
  ["bind", Account.bind],
  ["unbind", Account.unbind],
]);

export async function handleCommand(
  cmd: string,
  content: string,
  msg: TgMessage,
  req: Request,
) {
  const fn = Commands.get(cmd);

  if (!fn) return;

  try {
    await fn(content, msg, req);
  } catch (err) {
    console.error(err);
  }
}

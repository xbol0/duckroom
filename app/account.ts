import { db } from "../database/mod.ts";
import { ErrorRes } from "../deps.ts";
import { generateKeypair } from "../lib/account.ts";
import { CreateUser } from "../types.ts";

export async function createAccount(
  meta: Omit<CreateUser, "public_key" | "private_key">,
) {
  const [e1, e2] = await Promise.all([
    db.getUserByTgid(meta.tg_id),
    db.getUserByName(meta.name),
  ]);

  if (e1) throw new ErrorRes("This telegram account has been registered");
  if (e2) throw new ErrorRes("This username has been registered");

  const k = await generateKeypair();

  await db.createUser({
    ...meta,
    public_key: k.publicKey,
    private_key: k.privateKey,
  });
}

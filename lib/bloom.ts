import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";

function getBloomProvider() {
  if (config.bloom.startsWith("deta://")) {
    const params = config.bloom.slice(7);
    const [secret, project, base] = params.split("/");
    return (nonce: string) => bloomDeta(nonce, secret, project, base);
  }

  return (_: string) => Promise.resolve(void 0);
}

async function bloomDeta(
  nonce: string,
  secret: string,
  project: string,
  base: string,
) {
  let res: Response;
  try {
    res = await fetch(
      `https://database.deta.sh/v1/${project}/${base}/items`,
      {
        method: "POST",
        body: JSON.stringify({
          item: { key: nonce, __expires: ~~(Date.now() / 1000 + 300) },
        }),
        headers: {
          "x-api-key": secret,
          "content-type": "application/json",
        },
      },
    );
    await res.body?.cancel();
  } catch (err) {
    throw new ErrorRes(err.message, 400);
  }

  if (res.status !== 201) throw new ErrorRes("Invalid nonce", 400);
}

export const bloomReduce = getBloomProvider();

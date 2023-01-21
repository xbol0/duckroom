import { ErrorRes } from "../deps.ts";

export function respond(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
) {
  if (data instanceof ErrorRes) {
    return data.toResponse();
  } else if (data === null) {
    return new Response(null, { status, headers });
  } else if (data instanceof Response) {
    return data;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

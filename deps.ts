export * as http from "https://deno.land/std@0.170.0/http/server.ts";
export * as ed25519 from "https://esm.sh/@noble/ed25519@1.7.1";
export * as pg from "https://deno.land/x/postgres@v0.17.0/mod.ts";
export * as jsonschema from "https://esm.sh/jsonschema@1.4.1";

import * as _hex from "https://deno.land/std@0.165.0/encoding/hex.ts";
export const hex = {
  encode: (input: Uint8Array) => new TextDecoder().decode(_hex.encode(input)),
  decode: (input: string) => _hex.decode(new TextEncoder().encode(input)),
};

export function bytes(input: string | ArrayBuffer) {
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  } else {
    return new Uint8Array(input);
  }
}

export function log(...args: unknown[]) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

export class ErrorRes extends Error {
  status = 400;

  constructor(message?: string, status?: number) {
    super(message);
    if (status) this.status = status;
  }

  toResponse(headers?: Record<string, string>) {
    return new Response(JSON.stringify({ error: this.message }), {
      status: this.status,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
    });
  }
}

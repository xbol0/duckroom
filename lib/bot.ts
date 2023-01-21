import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";
import {
  TgCommandInput,
  TgResponse,
  TgWebhookInfo,
  WebhookParams,
} from "../types.ts";

export function getWebhookInfo() {
  return GET<TgWebhookInfo>("getWebhookInfo");
}

export function getMe() {
  return GET("getMe");
}

export function setWebhook(data: WebhookParams) {
  return POST("setWebhook", data);
}

export function resetWebhook() {
  return POST("setWebhookInfo", {});
}

export function setMyCommands(data: TgCommandInput) {
  return POST("setMyCommands", data);
}

async function GET<T>(method: string): Promise<T> {
  const res = await fetch(
    `https://api.telegram.org/bot${config.tgToken}/${method}`,
  );
  const json = await res.json() as TgResponse<T>;
  if (!json.ok) {
    throw new ErrorRes(
      `Request ${method} fail: [${json.error_code}] ${json.description}`,
    );
  }

  return json.result;
}

async function POST<T>(method: string, data: unknown): Promise<T> {
  const res = await fetch(
    `https://api.telegram.org/bot${config.tgToken}/${method}`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "content-type": "application/json" },
    },
  );
  const json = await res.json() as TgResponse<T>;
  if (!json.ok) {
    throw new ErrorRes(
      `Request ${method} fail: [${json.error_code}] ${json.description}`,
    );
  }

  return json.result;
}

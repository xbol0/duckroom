import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";
import {
  SendMessageParams,
  SendPhotoParams,
  TgFile,
  TgMe,
} from "../tg_types.ts";
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
  return GET<TgMe>("getMe");
}

export function setWebhook(data: WebhookParams) {
  return POST("setWebhook", data);
}

export async function resetWebhook() {
  console.log("Delete webhook");
  await POST("deleteWebhook", {});

  console.log("Delete default commands");
  await deleteMyCommands({});
}

export function setMyCommands(data: TgCommandInput) {
  return POST("setMyCommands", data);
}

export function getMyCommands(data: Omit<TgCommandInput, "commands">) {
  return POST("getMyCommands", data);
}

export function deleteMyCommands(data: Omit<TgCommandInput, "commands">) {
  return POST("deleteMyCommands", data);
}

export function sendMessage(data: SendMessageParams) {
  return POST("sendMessage", data);
}

export function getFile(id: string): Promise<TgFile> {
  return POST("getFile", { file_id: id });
}

export function sendPhoto(data: SendPhotoParams) {
  return POST("sendPhoto", data);
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

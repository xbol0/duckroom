export type WebhookParams = {
  url: string;
  secret_token: string;
  max_connections?: number;
};

export type TgResponse<T> = TgResult<T> | TgFail;
export type TgFail = {
  ok: false;
  error_code: number;
  description: string;
};
export type TgResult<T> = {
  ok: true;
  result: T;
};

export type TgEmpty = TgResponse<Record<string, never>>;
export type TgWebhookInfo = {
  url: string;
  max_connections?: number;
};

export type TgMe = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
};

export type TgCommandInput = {
  commands: { command: string; description: string }[];
  scope?: { type: string; chat_id?: number; user_id?: number };
};
export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
};

export type TgMessage = {
  message_id: number;
  date: number;
  from: TgUser;
  chat: TgChat;
  text?: string;
  caption?: string;
  entities?: TgEntity[];
  caption_entities?: TgEntity[];
  photo?: TgPhotoSize[];
};

export type TgCallbackQuery = {
  id: string;
  from: TgUser;
  message?: TgMessage;
  chat_instance: string;
  data?: string;
};

export type TgPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TgFile = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

export type TgUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
};

export type TgChat = {
  id: number;
  type: "private";
  first_name: string;
  username: string;
};

export type TgEntity = {
  type: string;
  offset: number;
  length: number;
};

export type SendMessageParams = {
  chat_id: number;
  text: string;
  parse_mode?: string;
  entities?: TgEntity[];
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
};

export type SendPhotoParams = {
  chat_id: number;
  photo: string;
  caption?: string;
  parse_mode?: string;
  reply_markup?: unknown;
  has_spoiler?: boolean;
  caption_entities?: TgEntity[];
};

export type InlineKeyboardMarkup = {
  inline_keyboard: {
    text: string;
    url?: string;
    callback_data?: string;
    web_app?: { url: string };
  }[][];
};

export type AnswerCallbackQuery = {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
  url?: string;
  cache_time?: number;
};

export type DeleteMessage = {
  chat_id: number;
  message_id: number;
};

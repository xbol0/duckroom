import * as wellknown from "../handler/wellknown.ts";
import * as webhook from "../handler/webhook.ts";
import * as admin from "../handler/admin.ts";
import * as file from "../handler/file.ts";
import { Handler } from "../types.ts";

export const Router = new Map<string, Handler>();

Router.set("GET/.well-known/nodeinfo", wellknown.nodeinfo);
Router.set("GET/.well-known/webfinger", wellknown.webfinger);
Router.set("GET/.well-known/webhook", wellknown.webhook);
Router.set("GET/nodeinfo", wellknown.nodeinfo);
Router.set("GET/botinfo", admin.getBotInfo);
Router.set("GET/file", file.getFile);

Router.set("POST/webhook", webhook.webhook);
Router.set("POST/init", admin.initBot);

Router.set("DELETE/uninstall", admin.uninstall);

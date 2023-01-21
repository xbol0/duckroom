import { config } from "../config.ts";
import { ErrorRes } from "../deps.ts";
import { respond } from "../server/response.ts";

export function nodeinfo(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/.well-known/nodeinfo") {
    return respond({
      links: [{
        rel: "http://nodeinfo.diaspora.software/ns/schema/2.0",
        href: `${config.host || url.origin}/nodeinfo`,
      }],
    });
  }

  return respond({
    version: "2.0",
    software: { name: "Duckroom", version: "0.1.0" },
    protocols: ["activitypub"],
    services: { outbound: [], inbound: [] },
    usage: {
      users: { total: 1, activeMonth: 1, activeHalfyear: 1 },
      localPosts: 0,
    },
    openRegistrations: false,
    metadata: {},
  });
}

export function webhook(req: Request) {
  const origin = config.host || new URL(req.url).origin;
  return respond({
    links: [{
      rel: "self",
      href: `${origin}/webhook`,
    }],
  });
}

export function webfinger(req: Request) {
  const url = new URL(req.url);
  const origin = config.host || new URL(req.url).origin;
  const resource = url.searchParams.get("resource");

  if (!resource || !resource.startsWith("acct:")) {
    throw new ErrorRes(
      "Please make sure 'resource' parameter with 'acct:name@host' format in your request",
    );
  }

  const name = resource.slice(5, resource.indexOf("@", 5));

  return respond({
    subject: resource,
    aliases: [`${origin}/user?name=${name}`],
    links: [{
      rel: "self",
      type: "application/activity+json",
      href: `${origin}/@${name}`,
    }],
  });
}

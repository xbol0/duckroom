export type AP_Inbox = AP_Follow;

export type AP_Follow = {
  type: "Follow";
  id: string;
  actor: string;
  object: string;
};

export type AP_Person = {
  type: "Person";
  id: string;
  following: string;
  followers: string;
  inbox: string;
  outbox: string;
  endpoints?: { sharedInbox?: string };
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
};

export type AP_FollowRequest = {
  id: string;
  type: "Follow";
  actor: string;
  object: string;
};

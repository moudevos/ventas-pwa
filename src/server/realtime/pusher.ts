import "server-only";

import Pusher from "pusher";

let client: Pusher | null = null;

export function getPusherServer() {
  if (client) return client;
  const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !NEXT_PUBLIC_PUSHER_KEY || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null;
  }
  client = new Pusher({
    appId: PUSHER_APP_ID,
    key: NEXT_PUBLIC_PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });
  return client;
}

export async function publishOrderEvent(orderId: string, event: string, payload: unknown) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(`private-order-${orderId}`, event, payload);
  await pusher.trigger("private-orders", event, payload);
}

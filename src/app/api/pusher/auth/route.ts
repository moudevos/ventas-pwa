import { getPusherServer } from "@/server/realtime/pusher";
import { requireUser } from "@/server/auth/guards";
import { error } from "@/server/http/responses";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const pusher = getPusherServer();
  if (!pusher) return error("Pusher is not configured", 503);
  const form = await request.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!channel.startsWith("private-")) return error("Invalid channel", 403);
  return Response.json(pusher.authorizeChannel(socketId, channel));
}

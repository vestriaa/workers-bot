const nacl = require("tweetnacl");
import { Buffer } from "node:buffer";

export default {
  async fetch(request, env, ctx) {

    // Verify Discord request
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    const isVerified =
      signature &&
      timestamp &&
      nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, "hex"),
        Buffer.from(env.PUBLIC_KEY, "hex")
      );

    if (!isVerified) {
      return new Response("invalid request signature", { status: 401 });
    }

    const json = JSON.parse(body);

    // Ping
    if (json.type === 1) {
      return Response.json({ type: 1 });
    }

    // Slash command
    if (json.type === 2 && json.data.name === "lastactive") {

      const userId = json.data.options?.find(o => o.name === "user_id")?.value;

      if (!userId) {
        return Response.json({
          type: 4,
          data: {
            content: "You must provide a user_id.",
            allowed_mentions: { parse: [] }
          }
        });
      }

      try {
        const response = await fetch(
          `https://api.slin.dev/grab/v1/get_user_stats?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        if (!data.last_active_timestamp) {
          return Response.json({
            type: 4,
            data: {
              content: "No activity data found for that user.",
              allowed_mentions: { parse: [] }
            }
          });
        }

        const unixSeconds = Math.floor(data.last_active_timestamp / 1000);

        return Response.json({
          type: 4,
          data: {
            content:
              `Last active: <t:${unixSeconds}:R>\n` +
              `(<t:${unixSeconds}:F>)`,
            allowed_mentions: { parse: [] }
          }
        });

      } catch (err) {
        return Response.json({
          type: 4,
          data: {
            content: "Failed to fetch user data.",
            allowed_mentions: { parse: [] }
          }
        });
      }
    }

    return new Response("invalid request type", { status: 400 });
  },
};

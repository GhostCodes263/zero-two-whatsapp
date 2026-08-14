import admin from "../../security/admin.js";
import database from "../../database/database.js";
import whatsappClient from "../../whatsapp/client.js";

const pendingBroadcasts = new Map();

const broadcastCommand = {
  name: "broadcast",

  aliases: ["bc"],

  category: "admin",

  description:
    "Send a message to all registered users.",

  async execute({
    chatId,
    sender,
    args,
    reply
  }) {
    if (!admin.isAdmin(sender)) {
      await reply(
        chatId,
        [
          "🌸 Ehehe~ Nice try, darling.",
          "",
          "✦ This command is for Zero Two's admins only. ♡"
        ].join("\n")
      );

      return;
    }

    const input =
      args?.join(" ").trim();

    /*
     * Confirmation.
     */
    if (
      input?.toLowerCase() === "yes" &&
      pendingBroadcasts.has(chatId)
    ) {
      const message =
        pendingBroadcasts.get(chatId);

      pendingBroadcasts.delete(chatId);

      const users =
        database
          .getUsers(1000)
          .filter(
            (user) =>
              !database.isBanned(user.chat_id)
          );

      if (!users.length) {
        await reply(
          chatId,
          [
            "🌸 There aren't any registered users yet, darling.",
            "",
            "♡ Nobody to broadcast to~"
          ].join("\n")
        );

        return;
      }

      await reply(
        chatId,
        [
          "🌸 Broadcasting...",
          "",
          `✦ Recipients: *${users.length}*`,
          "♡ Ehehe~ Give me a moment, darling."
        ].join("\n")
      );

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await whatsappClient.sendText(
            user.chat_id,
            message
          );

          sent++;

          /*
           * Small delay prevents us from firing
           * every message at WhatsApp simultaneously.
           */
          await new Promise(
            (resolve) =>
              setTimeout(resolve, 250)
          );
        } catch (error) {
          failed++;
        }
      }

      await reply(
        chatId,
        [
          "👑 ZERO TWO — BROADCAST",
          "━━━━━━━━━━━━━━━━━━",
          "",
          `🌸 Sent: *${sent}*`,
          `✦ Failed: *${failed}*`,
          `♡ Total: *${users.length}*`,
          "",
          "━━━━━━━━━━━━━━━━━━",
          "Ehehe~ Broadcast complete, darling. 💗"
        ].join("\n")
      );

      return;
    }

    /*
     * Cancel a pending broadcast.
     */
    if (
      input?.toLowerCase() === "no" &&
      pendingBroadcasts.has(chatId)
    ) {
      pendingBroadcasts.delete(chatId);

      await reply(
        chatId,
        [
          "🌸 Broadcast cancelled~",
          "",
          "♡ Nothing was sent, darling."
        ].join("\n")
      );

      return;
    }

    /*
     * Create a new broadcast.
     */
    if (!input) {
      await reply(
        chatId,
        [
          "🌸 Ehehe~ What should I broadcast, darling?",
          "",
          "♡ Example:",
          "*.broadcast Hello everyone! 🌸*"
        ].join("\n")
      );

      return;
    }

    /*
     * Prevent accidentally replacing an existing
     * pending broadcast.
     */
    if (pendingBroadcasts.has(chatId)) {
      await reply(
        chatId,
        [
          "💗 You already have a broadcast waiting for confirmation.",
          "",
          "♡ Send *.broadcast yes* to send it.",
          "✦ Send *.broadcast no* to cancel it."
        ].join("\n")
      );

      return;
    }

    pendingBroadcasts.set(
      chatId,
      input
    );

    const users =
      database.getUsers(1000);

    await reply(
      chatId,
      [
        "👑 ZERO TWO — BROADCAST",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `🌸 Recipients: *${users.length}*`,
        "",
        "✦ Message:",
        input,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "♡ Send *.broadcast yes* to send.",
        "✦ Send *.broadcast no* to cancel.",
        "",
        "⚠️ This will message every registered user."
      ].join("\n")
    );
  }
};

export default broadcastCommand;

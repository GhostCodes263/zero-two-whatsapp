import admin from "../../security/admin.js";
import database from "../../database/database.js";
import whatsappClient from "../../whatsapp/client.js";

const statsCommand = {
  name: "stats",

  aliases: ["status"],

  category: "admin",

  description: "Show Zero Two bot statistics.",

  async execute({ chatId, sender, reply }) {
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

    const stats =
      database.getBotStats();

    const status =
      whatsappClient.getStatus();

    await reply(
      chatId,
      [
        "👑 ZERO TWO — STATS",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `🌸 Users: *${stats.users}*`,
        `✦ Messages: *${stats.messages}*`,
        `♡ Commands: *${stats.commands}*`,
        "",
        `📡 WhatsApp: *${status?.connected ? "ONLINE" : "OFFLINE"}*`,
        `🤖 AI: *${process.env.FEATURE_AI === "true" ? "ENABLED" : "DISABLED"}*`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "Ehehe~ Here's how we're doing, darling. 💗"
      ].join("\n")
    );
  }
};

export default statsCommand;

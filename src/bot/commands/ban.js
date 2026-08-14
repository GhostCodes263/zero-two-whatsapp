import admin from "../../security/admin.js";
import database from "../../database/database.js";

function normalizeNumber(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "");
}

const banCommand = {
  name: "ban",

  category: "admin",

  description:
    "Ban a user from interacting with Zero Two.",

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

    const number =
      normalizeNumber(args?.[0]);

    if (!number) {
      await reply(
        chatId,
        [
          "🌸 Please provide a phone number, darling.",
          "",
          "♡ Example:",
          "*.ban 263717961373*"
        ].join("\n")
      );

      return;
    }

    const target =
      `${number}@s.whatsapp.net`;

    if (admin.isOwner(target)) {
      await reply(
        chatId,
        [
          "👑 Ehehe~ Nice try, darling.",
          "",
          "♡ The owner is completely immune to moderation.",
          "✦ You cannot ban Zero Two's owner. 💗"
        ].join("\n")
      );

      return;
    }

    const reason =
      args.slice(1).join(" ").trim() ||
      "No reason provided.";

    database.banUser(
      target,
      reason,
      sender
    );

    await reply(
      chatId,
      [
        "🔨 ZERO TWO — BAN",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `👤 User: *${number}*`,
        `✦ Reason: ${reason}`,
        "",
        "♡ User has been banned.",
        "━━━━━━━━━━━━━━━━━━"
      ].join("\n")
    );
  }
};

export default banCommand;

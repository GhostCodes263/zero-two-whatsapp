import admin from "../../security/admin.js";
import database from "../../database/database.js";

function normalizeNumber(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "");
}

const unbanCommand = {
  name: "unban",

  category: "admin",

  description:
    "Remove a user's Zero Two ban.",

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
          "*.unban 263717961373*"
        ].join("\n")
      );

      return;
    }

    const target =
      `${number}@s.whatsapp.net`;

    const result =
      database.unbanUser(target);

    if (!result.changes) {
      await reply(
        chatId,
        [
          "🌸 That user isn't banned, darling.",
          "",
          `✦ Number: *${number}*`
        ].join("\n")
      );

      return;
    }

    await reply(
      chatId,
      [
        "🌸 ZERO TWO — UNBAN",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `👤 User: *${number}*`,
        "",
        "♡ Ban removed successfully.",
        "✦ Welcome back~"
      ].join("\n")
    );
  }
};

export default unbanCommand;

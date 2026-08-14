import admin from "../../security/admin.js";
import database from "../../database/database.js";

const bannedCommand = {
  name: "banned",

  aliases: ["bans"],

  category: "admin",

  description:
    "List currently banned users.",

  async execute({
    chatId,
    sender,
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

    const users =
      database.getBannedUsers();

    if (!users.length) {
      await reply(
        chatId,
        [
          "🌸 ZERO TWO — BANS",
          "━━━━━━━━━━━━━━━━━━",
          "",
          "♡ No users are currently banned.",
          "",
          "Ehehe~ Everyone is behaving... for now. 💗"
        ].join("\n")
      );

      return;
    }

    const lines =
      users.map(
        (user, index) => {
          const number =
            user.chat_id
              .split("@")[0];

          return [
            `${index + 1}. *${number}*`,
            `   ✦ ${user.reason || "No reason"}`
          ].join("\n");
        }
      );

    await reply(
      chatId,
      [
        "👑 ZERO TWO — BANNED USERS",
        "━━━━━━━━━━━━━━━━━━",
        "",
        ...lines,
        "",
        "━━━━━━━━━━━━━━━━━━",
        `🌸 Total: *${users.length}*`
      ].join("\n")
    );
  }
};

export default bannedCommand;

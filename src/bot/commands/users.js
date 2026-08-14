import admin from "../../security/admin.js";
import database from "../../database/database.js";

const usersCommand = {
  name: "users",

  aliases: ["members"],

  category: "admin",

  description:
    "List registered Zero Two users.",

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
      database.getUsers(15);

    if (!users.length) {
      await reply(
        chatId,
        [
          "🌸 No users yet, darling.",
          "",
          "♡ I'll remember everyone who talks to me~"
        ].join("\n")
      );

      return;
    }

    const lines = [
      "👑 ZERO TWO — USERS",
      "━━━━━━━━━━━━━━━━━━",
      "",
      `🌸 Registered users: *${users.length}*`,
      ""
    ];

    users.forEach((user, index) => {
      lines.push(
        `${index + 1}. *${user.push_name || "Unknown"}*`,
        `   ♡ Messages: ${user.message_count}`,
        `   ✦ ID: ${user.chat_id}`,
        ""
      );
    });

    lines.push(
      "━━━━━━━━━━━━━━━━━━",
      "Ehehe~ That's everyone I've met so far. 💗"
    );

    await reply(
      chatId,
      lines.join("\n")
    );
  }
};

export default usersCommand;

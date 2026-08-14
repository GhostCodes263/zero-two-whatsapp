import admin from "../../security/admin.js";

const adminCommand = {
  name: "admin",

  aliases: ["owner"],

  category: "admin",

  description: "Check admin access.",

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

    await reply(
      chatId,
      [
        "👑 ZERO TWO — ADMIN",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "♡ Access: *AUTHORIZED*",
        "✦ Role: *ADMIN*",
        "🌸 Status: *ACTIVE*",
        "",
        "Ehehe~ Welcome back, darling. ♡"
      ].join("\n")
    );
  }
};

export default adminCommand;

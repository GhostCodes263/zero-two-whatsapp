import database from "../../database/database.js";

const profileCommand = {
  name: "profile",

  aliases: ["me", "whoami"],

  category: "general",

  description: "View your Zero Two profile.",

  async execute({ chatId, pushName, reply }) {
    const user = database.getUserStats(chatId);

    const name =
      user?.push_name ||
      pushName ||
      "Darling";

    const messageCount =
      user?.message_count || 0;

    const firstSeen =
      user?.first_seen ||
      "Just now";

    const lastSeen =
      user?.last_seen ||
      "Just now";

    await reply(
      chatId,
      [
        "🌸 ZERO TWO — PROFILE",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `♡ Name: *${name}*`,
        `✦ Messages: *${messageCount}*`,
        "",
        `🌷 First seen: ${firstSeen}`,
        `💗 Last seen: ${lastSeen}`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "Ehehe~ Nice to see you again, darling. ♡"
      ].join("\n")
    );
  }
};

export default profileCommand;

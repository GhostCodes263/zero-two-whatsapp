import admin from "../../security/admin.js";
import database from "../../database/database.js";
import config from "../../config/config.js";

function normalize(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "");
}

function isConfiguredAdminNumber(target) {
  const targetNumber = normalize(target);

  if (!targetNumber) {
    return false;
  }

  return config.admins.numbers.some(
    (number) =>
      normalize(number) === targetNumber
  );
}

const userCommand = {
  name: "user",

  aliases: ["lookup"],

  category: "admin",

  description:
    "Look up a registered user's information.",

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

    const target = args?.[0];

    if (!target) {
      await reply(
        chatId,
        [
          "🌸 Ehehe~ Give me a user number or chat ID, darling.",
          "",
          "♡ Examples:",
          "*.user 263717961373*",
          "*.user 203813931753538@lid*"
        ].join("\n")
      );

      return;
    }

    let user = null;

    /*
     * Exact chat ID lookup.
     */
    if (target.includes("@")) {
      user =
        database.getUserStats(target);
    }

    /*
     * Normal WhatsApp phone-number JID.
     */
    if (!user) {
      user =
        database.getUserStats(
          `${target}@s.whatsapp.net`
        );
    }

    /*
     * If the requested number is one of the
     * configured admin numbers, the current
     * authenticated admin's chatId is the
     * authoritative LID.
     *
     * This handles:
     *
     *   .user 263717961373
     *
     * when the actual incoming sender is:
     *
     *   203813931753538@lid
     */
    if (
      !user &&
      isConfiguredAdminNumber(target)
    ) {
      user =
        database.getUserStats(chatId);
    }

    if (!user) {
      await reply(
        chatId,
        [
          "💗 I couldn't find that user, darling.",
          "",
          `✦ Lookup: *${target}*`,
          "",
          "♡ Try their exact WhatsApp chat ID.",
          "♡ Example: *.user 203813931753538@lid*"
        ].join("\n")
      );

      return;
    }

    await reply(
      chatId,
      [
        "👑 ZERO TWO — USER",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `🌸 Name: *${user.push_name || "Unknown"}*`,
        `✦ Chat ID: *${user.chat_id}*`,
        `♡ Messages: *${user.message_count}*`,
        "",
        `📅 First seen: ${user.first_seen}`,
        `🕐 Last seen: ${user.last_seen}`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "Ehehe~ There you go, darling. 💗"
      ].join("\n")
    );
  }
};

export default userCommand;

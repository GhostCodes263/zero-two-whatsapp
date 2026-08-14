import admin from "../../security/admin.js";
import database from "../../database/database.js";
import whatsappClient from "../../whatsapp/client.js";
import config from "../../config/config.js";

function normalizeNumber(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "");
}

const warnCommand = {
  name: "warn",

  category: "admin",

  description:
    "Warn a user in a group.",

  async execute({
    chatId,
    sender,
    isGroup,
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

    if (!isGroup) {
      await reply(
        chatId,
        [
          "🌸 This command only works inside a group, darling.",
          "",
          "♡ Try *.warn* in the group where the user is."
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
          "🌸 Please provide the user's phone number.",
          "",
          "♡ Example:",
          "*.warn 263717961373 spamming*"
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
          "♡ The owner is completely immune to warnings.",
          "✦ Zero Two protects her owner. 💗"
        ].join("\n")
      );

      return;
    }

    const reason =
      args
        ?.slice(1)
        .join(" ")
        .trim() ||
      "No reason provided.";

    database.addWarning(
      chatId,
      target,
      reason,
      sender
    );

    const count =
      database.getWarningCount(
        chatId,
        target
      );

    const kickThreshold =
      config.moderation.warningsBeforeKick;

    /*
     * Moderation escalation.
     *
     * The owner check above is deliberately before
     * this block, so the owner can never reach the
     * automatic kick path.
     */
    if (
      config.moderation.enabled &&
      count >= kickThreshold
    ) {
      try {
        await whatsappClient.removeGroupParticipant(
          chatId,
          target
        );

        database.clearWarnings(
          chatId,
          target
        );

        await reply(
          chatId,
          [
            "🔨 ZERO TWO — USER REMOVED",
            "━━━━━━━━━━━━━━━━━━",
            "",
            `👤 User: *${number}*`,
            `✦ Warnings: *${count}*`,
            `♡ Reason: ${reason}`,
            "",
            `🌸 ${kickThreshold} warnings reached.`,
            "✦ The user has been removed from the group.",
            "",
            "━━━━━━━━━━━━━━━━━━",
            "Ehehe~ Please behave, darling. 💗"
          ].join("\n")
        );

        return;
      } catch (error) {
        await reply(
          chatId,
          [
            "⚠️ ZERO TWO — MODERATION",
            "━━━━━━━━━━━━━━━━━━",
            "",
            `👤 User: *${number}*`,
            `✦ Warnings: *${count}*`,
            "",
            "🌸 The warning was recorded, but I couldn't remove the user.",
            "♡ Make sure Zero Two is an admin in this group."
          ].join("\n")
        );

        return;
      }
    }

    await reply(
      chatId,
      [
        "⚠️ ZERO TWO — WARNING",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `👤 User: *${number}*`,
        `✦ Warning: *#${count}*`,
        `♡ Reason: ${reason}`,
        "",
        `🌸 ${kickThreshold - count} warning${kickThreshold - count === 1 ? "" : "s"} remaining before removal.`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "Ehehe~ Please behave, darling. 💗"
      ].join("\n")
    );
  }
};

export default warnCommand;

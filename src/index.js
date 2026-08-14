import config from "./config/config.js";
import logger from "./core/logger.js";
import events from "./core/events.js";
import whatsappClient from "./whatsapp/client.js";

async function main() {
  logger.info(
    {
      bot: config.bot.name,
      environment: config.nodeEnv
    },
    "Starting Zero Two..."
  );

  logger.info(
    "Core configuration loaded."
  );

  /*
   * WhatsApp connection events.
   */
  events.on(
    "whatsapp.ready",
    ({ user }) => {
      logger.info(
        {
          phone: user?.id,
          name: user?.name,
          lid: user?.lid
        },
        "Zero Two is ready for messages."
      );
    }
  );

  events.on(
    "whatsapp.disconnected",
    ({
      statusCode,
      shouldReconnect
    }) => {
      logger.warn(
        {
          statusCode,
          shouldReconnect
        },
        "Zero Two disconnected from WhatsApp."
      );
    }
  );

  /*
   * Raw WhatsApp message batch.
   *
   * Kept for compatibility with the existing
   * event architecture.
   */
  events.on(
    "whatsapp.messages",
    ({
      messages,
      type
    }) => {
      logger.debug(
        {
          count:
            messages?.length || 0,
          type
        },
        "WhatsApp message event received."
      );
    }
  );

  /*
   * Clean individual incoming message.
   *
   * This is the event future command handlers,
   * AI, moderation, memory, games, etc. should
   * subscribe to.
   */
  events.on(
    "whatsapp.message",
    ({
      chatId,
      sender,
      isGroup,
      pushName,
      text,
      messageType
    }) => {
      logger.debug(
        {
          chatId,
          sender,
          isGroup,
          pushName,
          text,
          messageType
        },
        "WhatsApp message received by Zero Two."
      );
    }
  );

  /*
   * Text-only messages.
   */
  events.on(
    "whatsapp.text",
    ({
      chatId,
      sender,
      text
    }) => {
      logger.info(
        {
          chatId,
          sender,
          text
        },
        "Incoming WhatsApp text."
      );
    }
  );

  /*
   * Group participant events.
   */
  events.on(
    "whatsapp.group.participants",
    (update) => {
      logger.info(
        {
          groupId: update.id,
          action: update.action,
          participants:
            update.participants
        },
        "Group participant event received."
      );
    }
  );

  /*
   * Initialize WhatsApp.
   */
  await whatsappClient.initialize();

  logger.info(
    "Zero Two core boot completed."
  );
}

async function shutdown(signal) {
  logger.info(
    {
      signal
    },
    "Shutdown signal received."
  );

  try {
    await whatsappClient.disconnect();
  } catch (error) {
    logger.error(
      {
        error
      },
      "Error while shutting down."
    );
  }

  process.exit(0);
}

process.once(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.once(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

main().catch((error) => {
  logger.error(
    {
      error
    },
    "Fatal startup error."
  );

  process.exit(1);
});
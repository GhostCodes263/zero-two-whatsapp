import config from "./config/config.js";
import logger from "./core/logger.js";
import events from "./core/events.js";
import whatsappClient from "./whatsapp/client.js";
import botHandler from "./bot/handler.js";

let isBooted = false;
let shutdownStarted = false;

function registerEventHandlers() {
  /*
   * Prevent duplicate application listeners.
   */
  if (isBooted) {
    logger.debug(
      "Zero Two event handlers are already registered."
    );

    return;
  }

  isBooted = true;

  /*
   * WhatsApp connection ready.
   */
  events.on(
    "whatsapp.ready",
    handleWhatsAppReady
  );

  /*
   * WhatsApp disconnected.
   */
  events.on(
    "whatsapp.disconnected",
    handleWhatsAppDisconnected
  );

  /*
   * Raw WhatsApp message batch.
   */
  events.on(
    "whatsapp.messages",
    handleWhatsAppMessages
  );

  /*
   * Clean individual WhatsApp message.
   */
  events.on(
    "whatsapp.message",
    handleWhatsAppMessage
  );

  /*
   * Text-only WhatsApp messages.
   *
   * The actual bot logic is handled by
   * botHandler.
   */
  events.on(
    "whatsapp.text",
    handleWhatsAppText
  );

  /*
   * Group participant events.
   */
  events.on(
    "whatsapp.group.participants",
    handleGroupParticipants
  );

  logger.debug(
    "Zero Two application event handlers registered."
  );
}

function handleWhatsAppReady({
  user
}) {
  logger.info(
    {
      phone: user?.id,
      name: user?.name,
      lid: user?.lid
    },
    "Zero Two application is ready."
  );
}

function handleWhatsAppDisconnected({
  statusCode,
  shouldReconnect
}) {
  logger.warn(
    {
      statusCode,
      shouldReconnect
    },
    "Zero Two disconnected from WhatsApp."
  );
}

function handleWhatsAppMessages({
  messages,
  type
}) {
  logger.debug(
    {
      count:
        messages?.length || 0,
      type
    },
    "WhatsApp message batch received."
  );
}

function handleWhatsAppMessage({
  chatId,
  sender,
  isGroup,
  pushName,
  text,
  messageType
}) {
  logger.debug(
    {
      chatId,
      sender,
      isGroup,
      pushName,
      text,
      messageType
    },
    "Zero Two received normalized WhatsApp message."
  );
}

function handleWhatsAppText({
  chatId,
  sender,
  isGroup,
  pushName,
  text
}) {
  logger.info(
    {
      chatId,
      sender,
      isGroup,
      pushName,
      text
    },
    "Zero Two received incoming text."
  );
}

function handleGroupParticipants(
  update
) {
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

async function main() {
  /*
   * Register application listeners first.
   */
  registerEventHandlers();

  /*
   * Register the actual bot logic.
   */
  botHandler.register();

  logger.info(
    {
      bot: config.bot.name,
      environment:
        config.nodeEnv
    },
    "Starting Zero Two..."
  );

  logger.info(
    "Core configuration loaded."
  );

  /*
   * Start WhatsApp.
   */
  await whatsappClient.initialize();

  logger.info(
    "Zero Two core boot completed."
  );
}

async function shutdown(
  signal
) {
  /*
   * Prevent multiple shutdown
   * handlers from running.
   */
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;

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
  () => {
    shutdown("SIGINT");
  }
);

process.once(
  "SIGTERM",
  () => {
    shutdown("SIGTERM");
  }
);

main().catch(
  (error) => {
    logger.error(
      {
        error
      },
      "Fatal startup error."
    );

    process.exit(1);
  }
);
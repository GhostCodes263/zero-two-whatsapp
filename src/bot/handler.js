import logger from "../core/logger.js";
import events from "../core/events.js";
import whatsappClient from "../whatsapp/client.js";

class BotHandler {
  constructor() {
    this.isRegistered = false;
  }

  register() {
    if (this.isRegistered) {
      logger.debug(
        "Bot message handler is already registered."
      );

      return;
    }

    this.isRegistered = true;

    events.on(
      "whatsapp.text",
      async (message) => {
        await this.handleTextMessage(
          message
        );
      }
    );

    logger.info(
      "Zero Two bot message handler registered."
    );
  }

  async handleTextMessage(message) {
    if (!message) {
      return;
    }

    const {
      chatId,
      sender,
      isGroup,
      pushName,
      text
    } = message;

    if (!chatId) {
      return;
    }

    if (!text) {
      return;
    }

    const cleanText =
      text.trim();

    if (!cleanText) {
      return;
    }

    logger.info(
      {
        chatId,
        sender,
        isGroup,
        pushName,
        text: cleanText
      },
      "Zero Two is processing message."
    );

    const normalizedText =
      cleanText.toLowerCase();

    /*
     * Basic greeting responses.
     */
    if (
      normalizedText === "hi" ||
      normalizedText === "hie" ||
      normalizedText === "hello" ||
      normalizedText === "hey" ||
      normalizedText === "hey zero two" ||
      normalizedText === "hi zero two" ||
      normalizedText === "hello zero two"
    ) {
      await this.sendReply(
        chatId,
        this.getGreeting(pushName)
      );

      return;
    }

    /*
     * Bot status command.
     */
    if (
      normalizedText ===
      ".ping"
    ) {
      await this.sendReply(
        chatId,
        "🏓 Pong!\n\nZero Two is online and connected to WhatsApp."
      );

      return;
    }

    /*
     * Help command.
     */
    if (
      normalizedText ===
        ".help" ||
      normalizedText ===
        "help"
    ) {
      await this.sendReply(
        chatId,
        [
          "🤖 *Zero Two*",
          "",
          "I'm online and ready.",
          "",
          "Available commands:",
          "• .ping — Check if I'm online",
          "• .help — Show this help",
          "",
          "More features are coming."
        ].join("\n")
      );

      return;
    }

    /*
     * Simple identity command.
     */
    if (
      normalizedText ===
        ".bot" ||
      normalizedText ===
        ".about"
    ) {
      await this.sendReply(
        chatId,
        [
          "🤖 *Zero Two*",
          "",
          "WhatsApp assistant",
          "Status: Online 🟢",
          "",
          "More features are being built."
        ].join("\n")
      );

      return;
    }

    /*
     * Unknown messages currently do nothing.
     *
     * This is intentional.
     *
     * Later, this section will pass the message
     * to the command router / AI handler.
     */
    logger.debug(
      {
        chatId,
        sender,
        text: cleanText
      },
      "No bot handler matched the incoming message."
    );
  }

  getGreeting(pushName) {
    const name =
      pushName ||
      "there";

    return [
      `Hey ${name}! 👋`,
      "",
      "I'm Zero Two.",
      "I'm online and ready for messages. 🤖",
      "",
      "Send *.help* to see what I can do."
    ].join("\n");
  }

  async sendReply(
    chatId,
    text
  ) {
    try {
      if (
        !whatsappClient.getStatus()
          .connected
      ) {
        logger.warn(
          {
            chatId
          },
          "Cannot send bot reply because WhatsApp is not connected."
        );

        return;
      }

      await whatsappClient.sendText(
        chatId,
        text
      );

      logger.info(
        {
          chatId,
          text
        },
        "Zero Two sent WhatsApp reply."
      );
    } catch (error) {
      logger.error(
        {
          chatId,
          error
        },
        "Failed to send Zero Two WhatsApp reply."
      );
    }
  }
}

const botHandler =
  new BotHandler();

export default botHandler;
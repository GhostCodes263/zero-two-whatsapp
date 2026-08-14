import logger from "../core/logger.js";
import events from "../core/events.js";
import config from "../config/config.js";
import commandRouter from "./router.js";
import whatsappClient from "../whatsapp/client.js";
import zeroTwoStyle from "./style.js";
import groq from "../ai/groq.js";
import memory from "../ai/memory.js";
import database from "../database/database.js";
import admin from "../security/admin.js";

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
        try {
          await this.handleTextMessage(message);
        } catch (error) {
          logger.error(
            {
              error
            },
            "Unhandled error while processing WhatsApp message."
          );
        }
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

    if (!chatId || !text) {
      return;
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return;
    }

    /*
     * Block users who are banned from interacting
     * with Zero Two.
     */
    try {
      if (
        !admin.isOwner(sender) &&
        database.isBanned(chatId)
      ) {
        logger.warn(
          {
            chatId,
            sender
          },
          "Ignoring message from banned user."
        );

        return;
      }
    } catch (error) {
      logger.error(
        {
          chatId,
          error
        },
        "Failed to check user ban status."
      );
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

    /*
     * Keep basic user information updated.
     */
    try {
      database.upsertUser(
        chatId,
        pushName || null
      );
    } catch (error) {
      logger.error(
        {
          chatId,
          error
        },
        "Failed to update user record."
      );
    }

    /*
     * Commands always take priority.
     */
    if (cleanText.startsWith(".")) {
      try {
        database.addMessage(
          chatId,
          "user",
          cleanText,
          true
        );

        const handled =
          await commandRouter.handle({
            ...message,
            text: cleanText,
            reply: this.sendReply.bind(this)
          });

        if (handled) {
          logger.debug(
            {
              chatId,
              text: cleanText
            },
            "Bot command handled successfully."
          );

          return;
        }

        await this.sendReply(
          chatId,
          zeroTwoStyle.unknownCommand()
        );

        return;
      } catch (error) {
        logger.error(
          {
            chatId,
            text: cleanText,
            error
          },
          "Failed to process bot command."
        );

        await this.sendReply(
          chatId,
          zeroTwoStyle.error()
        );

        return;
      }
    }

    /*
     * Natural AI conversation.
     */
    if (config.features.ai) {
      try {
        const history =
          memory.getHistory(chatId);

        const messages = [
          ...history,
          {
            role: "user",
            content: cleanText
          }
        ];

        const answer =
          await groq.ask(messages);

        memory.addMessage(
          chatId,
          "user",
          cleanText
        );

        memory.addMessage(
          chatId,
          "assistant",
          answer
        );

        await this.sendReply(
          chatId,
          zeroTwoStyle.ai(answer)
        );

        return;
      } catch (error) {
        logger.error(
          {
            chatId,
            text: cleanText,
            error
          },
          "Natural AI response failed."
        );

        return;
      }
    }

    /*
     * AI disabled.
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

  async sendReply(chatId, text) {
    try {
      const status =
        whatsappClient.getStatus();

      if (!status?.connected) {
        logger.warn(
          {
            chatId
          },
          "Cannot send bot reply because WhatsApp is not connected."
        );

        return false;
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

      return true;
    } catch (error) {
      logger.error(
        {
          chatId,
          error
        },
        "Failed to send Zero Two WhatsApp reply."
      );

      return false;
    }
  }
}

const botHandler =
  new BotHandler();

export default botHandler;

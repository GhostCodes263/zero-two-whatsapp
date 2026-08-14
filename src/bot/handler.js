import logger from "../core/logger.js";
import events from "../core/events.js";
import config from "../config/config.js";
import commandRouter from "./router.js";
import whatsappClient from "../whatsapp/client.js";
import zeroTwoStyle from "./style.js";
import groq from "../ai/groq.js";
import memory from "../ai/memory.js";

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

    if (!chatId) {
      return;
    }

    if (!text) {
      return;
    }

    const cleanText = text.trim();

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

    /*
     * Commands
     *
     * Commands always take priority over normal conversation.
     */
    if (cleanText.startsWith(".")) {
      try {
        const handled = await commandRouter.handle({
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
     * Basic greeting responses.
     *
     * Greetings use AI when enabled so Zero Two
     * can respond naturally while remembering context.
     */
    const normalizedText =
      cleanText.toLowerCase();

    const isGreeting =
      normalizedText === "hi" ||
      normalizedText === "hie" ||
      normalizedText === "hello" ||
      normalizedText === "hey" ||
      normalizedText === "hey zero two" ||
      normalizedText === "hi zero two" ||
      normalizedText === "hello zero two";

    if (isGreeting) {
      if (config.features.ai) {
        const handledByAI =
          await this.handleAIMessage(
            chatId,
            cleanText
          );

        if (handledByAI) {
          return;
        }
      }

      await this.sendReply(
        chatId,
        zeroTwoStyle.greeting(pushName)
      );

      return;
    }

    /*
     * Natural AI conversation.
     *
     * Any normal message can be answered by Zero Two
     * when the AI feature is enabled.
     */
    if (config.features.ai) {
      await this.handleAIMessage(
        chatId,
        cleanText
      );

      return;
    }

    /*
     * Unknown normal messages currently do nothing
     * when AI is disabled.
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

  async handleAIMessage(chatId, prompt) {
    try {

      const history =
        memory.getHistory(chatId);

      const messages = [
        ...history,
        {
          role: "user",
          content: prompt
        }
      ];

      const answer =
        await groq.ask(messages);

      memory.addMessage(
        chatId,
        "user",
        prompt
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

      return true;
    } catch (error) {
      logger.error(
        {
          chatId,
          prompt,
          error
        },
        "AI response failed."
      );

      /*
       * AI failures should still feel like Zero Two,
       * not like a raw technical error.
       */
      await this.sendReply(
        chatId,
        zeroTwoStyle.aiError()
      );

      return false;
    }
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

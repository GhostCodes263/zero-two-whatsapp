import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import fs from "node:fs";
import path from "node:path";

import qrcode from "qrcode-terminal";

import config from "../config/config.js";
import logger from "../core/logger.js";
import events from "../core/events.js";

class WhatsAppClient {
  constructor() {
    this.socket = null;

    this.reconnectTimer = null;

    this.isConnecting = false;

    this.isConnected = false;

    this.shouldReconnect = true;

    this.messageIds = new Set();
  }

  async initialize() {
    if (this.isConnecting) {
      logger.warn(
        "WhatsApp connection attempt already in progress."
      );

      return;
    }

    if (this.isConnected) {
      logger.debug(
        "WhatsApp client is already connected."
      );

      return;
    }

    this.isConnecting = true;

    this.shouldReconnect = true;

    try {
      const authDir = path.resolve(
        config.whatsapp.authDir
      );

      fs.mkdirSync(
        authDir,
        {
          recursive: true
        }
      );

      const {
        state,
        saveCreds
      } = await useMultiFileAuthState(
        authDir
      );

      let version;

      try {
        const latest =
          await fetchLatestBaileysVersion();

        version = latest.version;

        logger.info(
          {
            version: version.join("."),
            isLatest: latest.isLatest
          },
          "Using WhatsApp Web version."
        );
      } catch (error) {
        logger.warn(
          {
            error: error.message
          },
          "Unable to fetch latest WhatsApp Web version. Using library default."
        );
      }

      /*
       * WhatsApp socket configuration.
       *
       * IMPORTANT:
       *
       * fireInitQueries is disabled because the automatic
       * Baileys initialization queries are timing out with
       * HTTP 408 after the socket is already connected.
       *
       * The bot is still able to receive messages normally.
       *
       * History synchronization is also disabled because
       * Zero Two only needs live incoming messages.
       */
      const socketOptions = {
        auth: state,

        logger: logger.child({
          component: "baileys"
        }),

        printQRInTerminal: false,

        browser: [
          config.bot.name,
          "Codespaces",
          "1.0.0"
        ],

        /*
         * Keep the WhatsApp account offline unless
         * the application explicitly changes presence.
         */
        markOnlineOnConnect: false,

        /*
         * We do not need historical chat synchronization
         * during startup.
         */
        syncFullHistory: false,

        shouldSyncHistoryMessage: () => false,

        /*
         * IMPORTANT:
         *
         * Disable Baileys automatic initialization queries.
         *
         * Without this, the socket connects successfully,
         * receives messages, and then approximately 60 seconds
         * later Baileys reports:
         *
         *     unexpected error in 'init queries'
         *     Error: Timed Out
         *     statusCode: 408
         *
         * Live messaging does not require these startup queries.
         */
        fireInitQueries: false,

        /*
         * We don't need automatic high-quality link preview
         * generation at the WhatsApp transport layer.
         */
        generateHighQualityLinkPreview: false,

        /*
         * Keep the WebSocket alive.
         */
        keepAliveIntervalMs: 30000,

        /*
         * Give the initial WebSocket connection enough time
         * to establish in Codespaces.
         */
        connectTimeoutMs: 30000,

        /*
         * Retry failed requests with a small delay.
         */
        retryRequestDelayMs: 250,

        /*
         * Maximum message retry attempts.
         */
        maxMsgRetryCount: 5
      };

      if (version) {
        socketOptions.version = version;
      }

      this.socket =
        makeWASocket(
          socketOptions
        );

      this.registerConnectionEvents();

      this.registerCredentialEvents(
        saveCreds
      );

      this.registerMessageEvents();

      this.registerGroupEvents();

      logger.info(
        "WhatsApp client initialized."
      );
    } catch (error) {
      logger.error(
        {
          error
        },
        "Failed to initialize WhatsApp client."
      );

      this.isConnecting = false;

      this.scheduleReconnect();
    }
  }

  registerCredentialEvents(saveCreds) {
    this.socket.ev.on(
      "creds.update",
      async () => {
        try {
          await saveCreds();

          logger.debug(
            "WhatsApp credentials saved."
          );
        } catch (error) {
          logger.error(
            {
              error
            },
            "Failed to save WhatsApp credentials."
          );
        }
      }
    );
  }

  registerConnectionEvents() {
    this.socket.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
          qr
        } = update;

        if (qr) {
          logger.info(
            "WhatsApp QR code received."
          );

          console.log("\n");

          console.log(
            "=========================================="
          );

          console.log(
            "        ZERO TWO WHATSAPP LOGIN"
          );

          console.log(
            "=========================================="
          );

          console.log(
            "Scan this QR code with WhatsApp:"
          );

          console.log("\n");

          qrcode.generate(
            qr,
            {
              small: true
            }
          );

          console.log("\n");
        }

        if (connection === "connecting") {
          logger.info(
            "Connecting to WhatsApp..."
          );

          this.isConnecting = true;

          this.isConnected = false;
        }

        if (connection === "open") {
          this.isConnected = true;

          this.isConnecting = false;

          logger.info(
            "=========================================="
          );

          logger.info(
            "Zero Two is now connected to WhatsApp."
          );

          logger.info(
            {
              user: this.socket.user
            },
            "WhatsApp account connected."
          );

          logger.info(
            "=========================================="
          );

          events.emitBotEvent(
            "whatsapp.ready",
            {
              socket: this.socket,
              user: this.socket.user
            }
          );
        }

        if (connection === "close") {
          this.isConnected = false;

          this.isConnecting = false;

          const statusCode =
            lastDisconnect?.error?.output
              ?.statusCode;

          const loggedOut =
            statusCode ===
            DisconnectReason.loggedOut;

          const shouldReconnect =
            !loggedOut &&
            this.shouldReconnect;

          logger.warn(
            {
              statusCode,
              shouldReconnect,
              loggedOut
            },
            "WhatsApp connection closed."
          );

          events.emitBotEvent(
            "whatsapp.disconnected",
            {
              statusCode,
              shouldReconnect
            }
          );

          if (shouldReconnect) {
            this.scheduleReconnect();
          } else if (loggedOut) {
            logger.error(
              "WhatsApp logged out. Automatic reconnection disabled."
            );
          } else {
            logger.info(
              "WhatsApp client shutdown requested. Automatic reconnection disabled."
            );
          }
        }
      }
    );
  }

  registerMessageEvents() {
    this.socket.ev.on(
      "messages.upsert",
      async (messageUpdate) => {
        try {
          const {
            messages = [],
            type,
            requestId
          } = messageUpdate;

          /*
           * Security:
           *
           * Ignore suspicious messages.upsert events
           * containing a requestId.
           */
          if (requestId) {
            logger.warn(
              {
                requestId
              },
              "Ignoring suspicious WhatsApp message event."
            );

            return;
          }

          /*
           * Only process newly delivered messages.
           */
          if (type !== "notify") {
            logger.debug(
              {
                type,
                count: messages.length
              },
              "Ignoring non-notify WhatsApp message event."
            );

            return;
          }

          for (const message of messages) {
            await this.handleIncomingMessage(
              message
            );
          }

          /*
           * Preserve the existing batch event for
           * backwards compatibility.
           */
          events.emitBotEvent(
            "whatsapp.messages",
            {
              messages,
              type
            }
          );
        } catch (error) {
          logger.error(
            {
              error
            },
            "Error processing incoming WhatsApp messages."
          );
        }
      }
    );
  }

  async handleIncomingMessage(message) {
    if (!message) {
      return;
    }

    if (!message.key) {
      return;
    }

    /*
     * Ignore messages without actual content.
     */
    if (!message.message) {
      return;
    }

    /*
     * Ignore messages sent by Zero Two itself.
     */
    if (message.key.fromMe) {
      return;
    }

    const remoteJid =
      message.key.remoteJid;

    if (!remoteJid) {
      return;
    }

    /*
     * Ignore WhatsApp status updates.
     */
    if (
      remoteJid ===
      "status@broadcast"
    ) {
      return;
    }

    /*
     * Prevent duplicate processing.
     */
    const messageId =
      message.key.id;

    if (messageId) {
      if (
        this.messageIds.has(
          messageId
        )
      ) {
        logger.debug(
          {
            messageId
          },
          "Ignoring duplicate WhatsApp message."
        );

        return;
      }

      this.messageIds.add(
        messageId
      );

      /*
       * Keep the in-memory set bounded.
       */
      if (
        this.messageIds.size >
        5000
      ) {
        const firstId =
          this.messageIds
            .values()
            .next()
            .value;

        if (firstId) {
          this.messageIds.delete(
            firstId
          );
        }
      }
    }

    const messageText =
      this.extractMessageText(
        message
      );

    const isGroup =
      remoteJid.endsWith(
        "@g.us"
      );

    const sender =
      isGroup
        ? (
            message.key.participant ||
            message.key.remoteJid
          )
        : message.key.remoteJid;

    const messageData = {
      message,

      messageId,

      chatId:
        remoteJid,

      sender,

      isGroup,

      pushName:
        message.pushName ||
        null,

      text:
        messageText.text,

      messageType:
        messageText.type,

      timestamp:
        message.messageTimestamp
          ? Number(
              message.messageTimestamp
            )
          : null
    };

    logger.info(
      {
        chatId:
          remoteJid,

        sender,

        isGroup,

        messageType:
          messageText.type,

        text:
          messageText.text
      },
      "Incoming WhatsApp message."
    );

    /*
     * Main normalized message event.
     */
    events.emitBotEvent(
      "whatsapp.message",
      messageData
    );

    /*
     * Text-specific event.
     */
    if (messageText.text) {
      events.emitBotEvent(
        "whatsapp.text",
        messageData
      );
    }
  }

  extractMessageText(message) {
    const content =
      message?.message;

    if (!content) {
      return {
        text: "",
        type: "unknown"
      };
    }

    /*
     * Normal text message.
     */
    if (content.conversation) {
      return {
        text:
          content.conversation,

        type:
          "conversation"
      };
    }

    /*
     * Extended text message.
     */
    if (
      content.extendedTextMessage
    ) {
      return {
        text:
          content
            .extendedTextMessage
            .text ||
          "",

        type:
          "extendedTextMessage"
      };
    }

    /*
     * Image caption.
     */
    if (
      content.imageMessage
    ) {
      return {
        text:
          content
            .imageMessage
            .caption ||
          "",

        type:
          "imageMessage"
      };
    }

    /*
     * Video caption.
     */
    if (
      content.videoMessage
    ) {
      return {
        text:
          content
            .videoMessage
            .caption ||
          "",

        type:
          "videoMessage"
      };
    }

    /*
     * Document caption.
     */
    if (
      content.documentMessage
    ) {
      return {
        text:
          content
            .documentMessage
            .caption ||
          "",

        type:
          "documentMessage"
      };
    }

    /*
     * Buttons response.
     */
    if (
      content.buttonsResponseMessage
    ) {
      return {
        text:
          content
            .buttonsResponseMessage
            .selectedDisplayText ||
          "",

        type:
          "buttonsResponseMessage"
      };
    }

    /*
     * List response.
     */
    if (
      content.listResponseMessage
    ) {
      return {
        text:
          content
            .listResponseMessage
            .title ||
          content
            .listResponseMessage
            .description ||
          "",

        type:
          "listResponseMessage"
      };
    }

    /*
     * Template button response.
     */
    if (
      content.templateButtonReplyMessage
    ) {
      return {
        text:
          content
            .templateButtonReplyMessage
            .selectedDisplayText ||
          "",

        type:
          "templateButtonReplyMessage"
      };
    }

    /*
     * Reaction.
     */
    if (
      content.reactionMessage
    ) {
      return {
        text:
          content
            .reactionMessage
            .text ||
          "",

        type:
          "reactionMessage"
      };
    }

    /*
     * Poll creation.
     */
    if (
      content.pollCreationMessage
    ) {
      return {
        text: "",

        type:
          "pollCreationMessage"
      };
    }

    /*
     * Location.
     */
    if (
      content.locationMessage
    ) {
      return {
        text: "",

        type:
          "locationMessage"
      };
    }

    /*
     * Contact.
     */
    if (
      content.contactMessage
    ) {
      return {
        text: "",

        type:
          "contactMessage"
      };
    }

    /*
     * Sticker.
     */
    if (
      content.stickerMessage
    ) {
      return {
        text: "",

        type:
          "stickerMessage"
      };
    }

    /*
     * Audio.
     */
    if (
      content.audioMessage
    ) {
      return {
        text: "",

        type:
          "audioMessage"
      };
    }

    /*
     * Fallback.
     */
    const type =
      Object.keys(
        content
      )[0] ||
      "unknown";

    return {
      text: "",

      type
    };
  }

  registerGroupEvents() {
    this.socket.ev.on(
      "group-participants.update",
      async (update) => {
        try {
          logger.info(
            {
              groupId:
                update.id,

              action:
                update.action,

              participants:
                update.participants
            },
            "Group participant update received."
          );

          events.emitBotEvent(
            "whatsapp.group.participants",
            update
          );
        } catch (error) {
          logger.error(
            {
              error
            },
            "Error processing group participant update."
          );
        }
      }
    );
  }

  scheduleReconnect(
    delay = 5000
  ) {
    if (
      !this.shouldReconnect
    ) {
      return;
    }

    if (
      this.reconnectTimer
    ) {
      return;
    }

    if (
      this.isConnecting
    ) {
      return;
    }

    logger.info(
      {
        delay
      },
      "Scheduling WhatsApp reconnect."
    );

    this.reconnectTimer =
      setTimeout(
        async () => {
          this.reconnectTimer =
            null;

          if (
            !this.shouldReconnect
          ) {
            return;
          }

          try {
            await this.initialize();
          } catch (error) {
            logger.error(
              {
                error
              },
              "WhatsApp reconnect attempt failed."
            );

            this.scheduleReconnect(
              Math.min(
                delay * 2,
                60000
              )
            );
          }
        },
        delay
      );
  }

  async disconnect() {
    this.shouldReconnect =
      false;

    if (
      this.reconnectTimer
    ) {
      clearTimeout(
        this.reconnectTimer
      );

      this.reconnectTimer =
        null;
    }

    const socket =
      this.socket;

    this.socket = null;

    this.isConnected =
      false;

    this.isConnecting =
      false;

    if (!socket) {
      logger.info(
        "WhatsApp client disconnected."
      );

      return;
    }

    try {
      logger.info(
        "Stopping WhatsApp client..."
      );

      /*
       * Do NOT call socket.logout().
       *
       * logout() removes the WhatsApp session.
       *
       * end() only closes the current socket.
       *
       * We intentionally do not pass an Error object here
       * because doing so causes Baileys to log:
       *
       *     connection errored
       *
       * with "Zero Two shutting down."
       *
       * The shutdown itself is expected.
       */
      socket.end();

      logger.info(
        "WhatsApp client disconnected."
      );
    } catch (error) {
      logger.warn(
        {
          error:
            error.message
        },
        "Error while stopping WhatsApp client."
      );
    }
  }

  async sendMessage(
    jid,
    content,
    options = {}
  ) {
    if (
      !this.socket ||
      !this.isConnected
    ) {
      throw new Error(
        "WhatsApp client is not connected."
      );
    }

    if (!jid) {
      throw new Error(
        "A WhatsApp JID is required."
      );
    }

    return this.socket.sendMessage(
      jid,
      content,
      options
    );
  }

  async sendText(
    jid,
    text,
    options = {}
  ) {
    if (
      typeof text !==
      "string"
    ) {
      throw new Error(
        "WhatsApp message text must be a string."
      );
    }

    return this.sendMessage(
      jid,
      {
        text
      },
      options
    );
  }

  getSocket() {
    return this.socket;
  }

  getStatus() {
    return {
      connected:
        this.isConnected,

      connecting:
        this.isConnecting,

      user:
        this.socket?.user ||
        null
    };
  }
}

const whatsappClient =
  new WhatsAppClient();

export default whatsappClient;
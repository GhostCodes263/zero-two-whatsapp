import config from "../config/config.js";
import logger from "../core/logger.js";

class CommandRouter {
  constructor() {
    this.commands = new Map();
  }

  register(command) {
    if (
      !command?.name ||
      typeof command.execute !== "function"
    ) {
      throw new TypeError(
        "A command must have a name and an execute function."
      );
    }

    const names = [
      command.name,
      ...(command.aliases || [])
    ];

    for (const name of names) {
      this.commands.set(
        String(name).toLowerCase(),
        command
      );
    }
  }

  registerMany(commands = []) {
    for (const command of commands) {
      this.register(command);
    }
  }

  getPrefix() {
    return config.bot.prefix || ".";
  }

  parse(text) {
    const prefix = this.getPrefix();

    if (!text.startsWith(prefix)) {
      return null;
    }

    const withoutPrefix =
      text.slice(prefix.length).trim();

    if (!withoutPrefix) {
      return null;
    }

    const parts =
      withoutPrefix.split(/\s+/);

    const name =
      parts.shift()?.toLowerCase();

    if (!name) {
      return null;
    }

    return {
      name,
      args: parts,
      rawArgs: parts.join(" "),
      prefix
    };
  }

  async handle(message) {
    const parsed =
      this.parse(message.text);

    if (!parsed) {
      return false;
    }

    const command =
      this.commands.get(parsed.name);

    if (!command) {
      logger.debug(
        {
          chatId: message.chatId,
          command: parsed.name
        },
        "Unknown bot command."
      );

      return false;
    }

    try {
      await command.execute({
        ...message,
        ...parsed,
        router: this
      });
    } catch (error) {
      logger.error(
        {
          chatId: message.chatId,
          command: parsed.name,
          error
        },
        "Bot command failed."
      );

      throw error;
    }

    return true;
  }

  getCommands() {
    return [
      ...new Set(
        this.commands.values()
      )
    ];
  }
}

const commandRouter =
  new CommandRouter();

export default commandRouter;
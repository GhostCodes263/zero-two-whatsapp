import commandRouter from "../router.js";

const CATEGORY_ORDER = [
  "general",
  "ai",
  "fun",
  "utility",
  "moderation",
  "economy",
  "games",
  "events",
  "memory"
];

const CATEGORY_LABELS = {
  general: "🌸 General",
  ai: "🤖 AI",
  fun: "💗 Fun",
  utility: "🛠️ Utility",
  moderation: "🛡️ Moderation",
  economy: "💰 Economy",
  games: "🎮 Games",
  events: "🎉 Events",
  memory: "🧠 Memory"
};

const helpCommand = {
  name: "help",

  aliases: ["h", "menu"],

  description: "Show Zero Two's command menu.",

  category: "general",

  async execute({ chatId, reply }) {
    const commands = commandRouter
      .getCommands()
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    const categories = new Map();

    for (const command of commands) {
      const category =
        command.category || "general";

      if (!categories.has(category)) {
        categories.set(category, []);
      }

      categories
        .get(category)
        .push(command);
    }

    const lines = [
      "🌸 ZERO TWO — COMMAND MENU 🌸",
      "",
      "♡ Welcome, darling~",
      "✦ Choose something from my little world:",
      ""
    ];

    const orderedCategories = [
      ...CATEGORY_ORDER,
      ...[...categories.keys()]
        .filter(
          category =>
            !CATEGORY_ORDER.includes(category)
        )
    ];

    for (const category of orderedCategories) {
      const categoryCommands =
        categories.get(category);

      if (!categoryCommands?.length) {
        continue;
      }

      lines.push(
        CATEGORY_LABELS[category] ||
          `✦ ${category.toUpperCase()}`
      );

      for (const command of categoryCommands) {
        const aliases =
          command.aliases?.length
            ? ` • ${command.aliases
                .map(alias => `.${alias}`)
                .join(", ")}`
            : "";

        lines.push(
          `  ♡ *.${command.name}*${aliases}`,
          `     ${command.description || "No description available."}`
        );
      }

      lines.push("");
    }

    lines.push(
      "━━━━━━━━━━━━━━━━━━",
      "🌸 Prefix: *.*",
      "♡ Example: *.ping*",
      "",
      "Ehehe~ Pick a command, darling! ✦"
    );

    await reply(
      chatId,
      lines.join("\n")
    );
  }
};

export default helpCommand;

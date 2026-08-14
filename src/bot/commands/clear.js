import memory from "../../ai/memory.js";

const clearCommand = {
  name: "clear",

  aliases: ["forget"],

  category: "ai",

  description:
    "Clear Zero Two's recent conversation memory.",

  async execute({ chatId, reply }) {
    memory.clearConversation(chatId);

    await reply(
      chatId,
      [
        "🌸 Memory cleared~",
        "",
        "♡ Ehehe, it's like we're meeting again, darling.",
        "✦ What shall we talk about?"
      ].join("\n")
    );
  }
};

export default clearCommand;

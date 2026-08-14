import groq from "../../ai/groq.js";
import memory from "../../ai/memory.js";
import zeroTwoStyle from "../style.js";

const aiCommand = {
  name: "ai",

  aliases: ["ask"],

  category: "ai",

  description: "Talk to Zero Two using AI.",

  async execute({ chatId, args, reply }) {
    if (!args?.length) {
      await reply(
        chatId,
        [
          "🌸 Ehehe~ You need to give me something to think about, darling.",
          "",
          "♡ Example:",
          "*.ai tell me a joke*",
          "*.ask explain black holes*"
        ].join("\n")
      );

      return;
    }

    const prompt = args.join(" ");

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

      await reply(
        chatId,
        zeroTwoStyle.ai(answer)
      );
    } catch (error) {
      await reply(
        chatId,
        zeroTwoStyle.aiError()
      );
    }
  }
};

export default aiCommand;

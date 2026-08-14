import zeroTwoStyle from "../style.js";

const pingCommand = {
  name: "ping",

  aliases: ["p"],

  category: "general",

  description: "Check if Zero Two is online.",

  async execute({ chatId, reply }) {
    await reply(
      chatId,
      zeroTwoStyle.ping()
    );
  }
};

export default pingCommand;

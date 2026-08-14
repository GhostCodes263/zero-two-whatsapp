const zeroTwoStyle = {
  prefix: "🌸",
  heart: "♡",
  sparkle: "✦",
  divider: "━━━━━━━━━━━━━━━━━━",

  unknownCommand() {
    return [
      "🌸 Ehh?~ I don't know that command, darling.",
      "",
      "♡ Send *.help* to see what I can do."
    ].join("\n");
  },

  error() {
    return [
      "💗 Ehehe... something went wrong~",
      "",
      "✦ Don't worry, darling. Try again in a moment. ♡"
    ].join("\n");
  },

  thinking() {
    return [
      "🌸 Zero Two",
      "",
      "♡ Hmm~ let me think about that, darling...",
      "✦ Ehehe~"
    ].join("\n");
  },

  ai(answer) {
    return [
      "🌸 ZERO TWO",
      this.divider,
      "",
      answer,
      "",
      this.divider,
      "♡ Ehehe~ Anything else, darling?"
    ].join("\n");
  },

  aiError() {
    return [
      "💗 ZERO TWO",
      "",
      "Ehh?! My little brain stumbled~",
      "",
      "✦ I couldn't reach my AI brain right now, darling.",
      "♡ Try again in a moment~"
    ].join("\n");
  },

  greeting(name = "darling") {
    return [
      `🌸 Hey ${name}! 👋`,
      "",
      "♡ I'm Zero Two.",
      "✦ I'm online and ready for you~",
      "",
      this.divider,
      "♡ Send *.help* to see what I can do.",
      "♡ Send *.ai <message>* to talk with me.",
      this.divider,
      "",
      "Ehehe~ Don't be shy, darling. 💗"
    ].join("\n");
  },

  ping() {
    return [
      "🏓 PONG!",
      "",
      "🌸 Zero Two is online.",
      "♡ WhatsApp connection: *ACTIVE*",
      "✦ AI systems: *READY*",
      "",
      "Ehehe~ I'm not going anywhere, darling. 💗"
    ].join("\n");
  }
};

export default zeroTwoStyle;

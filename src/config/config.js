import "dotenv/config";

function booleanFromEnv(value, defaultValue = true) {
  if (value === undefined) {
    return defaultValue;
  }

  return String(value).toLowerCase() === "true";
}

function listFromEnv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT || 3000),

  bot: {
    name: process.env.BOT_NAME || "ZeroTwo",
    prefix: process.env.BOT_PREFIX || "!"
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model:
      process.env.GROQ_MODEL ||
      "openai/gpt-oss-120b"
  },

  database: {
    path:
      process.env.DATABASE_PATH ||
      "./data/zero-two.db"
  },

  whatsapp: {
    authDir:
      process.env.WHATSAPP_AUTH_DIR ||
      "./auth_info"
  },

  group: {
    id: process.env.GROUP_ID || ""
  },

  admins: {
    numbers: listFromEnv(
      process.env.ADMIN_NUMBERS
    )
  },

  features: {
    ai: booleanFromEnv(
      process.env.FEATURE_AI
    ),

    moderation: booleanFromEnv(
      process.env.FEATURE_MODERATION
    ),

    verification: booleanFromEnv(
      process.env.FEATURE_VERIFICATION
    ),

    welcome: booleanFromEnv(
      process.env.FEATURE_WELCOME
    ),

    leveling: booleanFromEnv(
      process.env.FEATURE_LEVELING
    ),

    economy: booleanFromEnv(
      process.env.FEATURE_ECONOMY
    ),

    games: booleanFromEnv(
      process.env.FEATURE_GAMES
    ),

    utility: booleanFromEnv(
      process.env.FEATURE_UTILITY
    ),

    events: booleanFromEnv(
      process.env.FEATURE_EVENTS
    ),

    memory: booleanFromEnv(
      process.env.FEATURE_MEMORY
    )
  },

  moderation: {
    enabled: booleanFromEnv(
      process.env.MODERATION_ENABLED
    ),

    warningsBeforeKick: Number(
      process.env.WARNINGS_BEFORE_KICK || 3
    )
  },

  verification: {
    enabled: booleanFromEnv(
      process.env.VERIFICATION_ENABLED
    )
  },

  logging: {
    level:
      process.env.LOG_LEVEL || "info"
  }
};

export default config;
import config from "./config/config.js";
import logger from "./core/logger.js";

async function main() {
  logger.info(
    {
      bot: config.bot.name,
      environment: config.nodeEnv
    },
    "Starting Zero Two..."
  );

  logger.info(
    "Core configuration loaded."
  );

  logger.info(
    "WhatsApp connection will be initialized in the next phase."
  );

  logger.info(
    "AI engine will be initialized in the next phase."
  );

  logger.info(
    "Module system is ready."
  );

  logger.info(
    "Zero Two core boot completed successfully."
  );
}

main().catch((error) => {
  logger.error(
    {
      error
    },
    "Fatal startup error."
  );

  process.exit(1);
});
import pino from "pino";
import config from "../config/config.js";

const logger = pino({
  level: config.logging.level,
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
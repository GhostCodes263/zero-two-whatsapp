import helpCommand from "./help.js";
import pingCommand from "./ping.js";
import aiCommand from "./ai.js";
import clearCommand from "./clear.js";
import profileCommand from "./profile.js";
import adminCommand from "./admin.js";
import statsCommand from "./stats.js";
import usersCommand from "./users.js";
import userCommand from "./user.js";
import broadcastCommand from "./broadcast.js";
import banCommand from "./ban.js";
import unbanCommand from "./unban.js";
import bannedCommand from "./banned.js";
import warnCommand from "./warn.js";

const commands = [
  helpCommand,
  pingCommand,
  aiCommand,
  clearCommand,
  profileCommand,
  adminCommand,
  statsCommand,
  usersCommand,
  userCommand,
  broadcastCommand,
  banCommand,
  unbanCommand,
  bannedCommand,
  warnCommand
];

export default commands;

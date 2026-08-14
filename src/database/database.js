import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import config from "../config/config.js";
import logger from "../core/logger.js";

const databasePath = path.resolve(config.database.path);

fs.mkdirSync(path.dirname(databasePath), {
  recursive: true
});

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL UNIQUE,
    push_name TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    sender TEXT,
    message TEXT NOT NULL,
    is_command INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL UNIQUE,
    reason TEXT,
    banned_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT,
    warned_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id, id)
  );

  CREATE INDEX IF NOT EXISTS idx_warnings_group_user
  ON warnings(group_id, user_id);

  CREATE INDEX IF NOT EXISTS idx_messages_chat_id
  ON messages(chat_id);

  CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages(created_at);
`);

const userColumns = db
  .prepare(`PRAGMA table_info(users)`)
  .all()
  .map((column) => column.name);

if (!userColumns.includes("message_count")) {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN message_count INTEGER DEFAULT 0
  `);
}

function upsertUser(chatId, pushName = null) {
  const statement = db.prepare(`
    INSERT INTO users (
      chat_id,
      push_name
    )
    VALUES (?, ?)
    ON CONFLICT(chat_id)
    DO UPDATE SET
      push_name = COALESCE(excluded.push_name, users.push_name),
      last_seen = CURRENT_TIMESTAMP
  `);

  statement.run(chatId, pushName);
}

function addMessage(
  chatId,
  sender,
  message,
  isCommand = false
) {
  const statement = db.prepare(`
    INSERT INTO messages (
      chat_id,
      sender,
      message,
      is_command
    )
    VALUES (?, ?, ?, ?)
  `);

  const result = statement.run(
    chatId,
    sender,
    message,
    isCommand ? 1 : 0
  );

  db.prepare(`
    UPDATE users
    SET message_count = message_count + 1,
        last_seen = CURRENT_TIMESTAMP
    WHERE chat_id = ?
  `).run(chatId);

  return result.lastInsertRowid;
}


function getUserStats(chatId) {
  return db
    .prepare(`
      SELECT
        chat_id,
        push_name,
        first_seen,
        last_seen,
        message_count
      FROM users
      WHERE chat_id = ?
    `)
    .get(chatId);
}

function getUser(chatId) {
  return db
    .prepare(`
      SELECT *
      FROM users
      WHERE chat_id = ?
    `)
    .get(chatId);
}

function getRecentMessages(chatId, limit = 20) {
  return db
    .prepare(`
      SELECT *
      FROM messages
      WHERE chat_id = ?
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(chatId, limit)
    .reverse();
}

function clearMessages(chatId) {
  db.prepare(`
    DELETE FROM messages
    WHERE chat_id = ?
  `).run(chatId);
}



function getUsers(limit = 10) {
  return db
    .prepare(`
      SELECT
        u.chat_id,
        u.push_name,
        u.first_seen,
        u.last_seen,
        COUNT(m.id) AS message_count
      FROM users u
      LEFT JOIN messages m
        ON m.chat_id = u.chat_id
      GROUP BY
        u.id,
        u.chat_id,
        u.push_name,
        u.first_seen,
        u.last_seen
      ORDER BY message_count DESC, u.last_seen DESC
      LIMIT ?
    `)
    .all(limit);
}

function banUser(
  chatId,
  reason = null,
  bannedBy = null
) {
  return db.prepare(`
    INSERT INTO bans (
      chat_id,
      reason,
      banned_by
    )
    VALUES (?, ?, ?)
    ON CONFLICT(chat_id)
    DO UPDATE SET
      reason = excluded.reason,
      banned_by = excluded.banned_by
  `).run(
    chatId,
    reason,
    bannedBy
  );
}

function unbanUser(chatId) {
  return db.prepare(`
    DELETE FROM bans
    WHERE chat_id = ?
  `).run(chatId);
}

function isBanned(chatId) {
  return Boolean(
    db.prepare(`
      SELECT 1
      FROM bans
      WHERE chat_id = ?
      LIMIT 1
    `).get(chatId)
  );
}

function getBannedUsers() {
  return db.prepare(`
    SELECT
      chat_id,
      reason,
      banned_by,
      created_at
    FROM bans
    ORDER BY created_at DESC
  `).all();
}


function addWarning(
  groupId,
  userId,
  reason = null,
  warnedBy = null
) {
  return db.prepare(`
    INSERT INTO warnings (
      group_id,
      user_id,
      reason,
      warned_by
    )
    VALUES (?, ?, ?, ?)
  `).run(
    groupId,
    userId,
    reason,
    warnedBy
  );
}

function getWarningCount(groupId, userId) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM warnings
    WHERE group_id = ?
      AND user_id = ?
  `).get(
    groupId,
    userId
  ).count;
}

function getWarnings(groupId, userId) {
  return db.prepare(`
    SELECT
      id,
      group_id,
      user_id,
      reason,
      warned_by,
      created_at
    FROM warnings
    WHERE group_id = ?
      AND user_id = ?
    ORDER BY id DESC
  `).all(
    groupId,
    userId
  );
}

function clearWarnings(groupId, userId) {
  return db.prepare(`
    DELETE FROM warnings
    WHERE group_id = ?
      AND user_id = ?
  `).run(
    groupId,
    userId
  );
}

function getBotStats() {
  const users =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM users
    `).get().count;

  const messages =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM messages
    `).get().count;

  const commands =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM messages
      WHERE is_command = 1
    `).get().count;

  return {
    users,
    messages,
    commands
  };
}

function close() {
  if (db.open) {
    db.close();

    logger.info(
      "Database connection closed."
    );
  }
}

logger.info(
  {
    databasePath
  },
  "SQLite database initialized."
);

export default {
  db,
  upsertUser,
  addMessage,
  getUser,
  getUserStats,
  getRecentMessages,
  clearMessages,
  getBotStats,
  getUsers,
  banUser,
  unbanUser,
  isBanned,
  getBannedUsers,

  addWarning,
  getWarningCount,
  getWarnings,
  clearWarnings,
  close
};

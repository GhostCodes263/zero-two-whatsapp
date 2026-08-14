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

  CREATE INDEX IF NOT EXISTS idx_messages_chat_id
  ON messages(chat_id);

  CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages(created_at);
`);

function upsertUser(chatId, pushName = null) {
  const statement = db.prepare(`
    INSERT INTO users (
      chat_id,
      push_name
    )
    VALUES (?, ?)
    ON CONFLICT(chat_id)
    DO UPDATE SET
      push_name = excluded.push_name,
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

  return result.lastInsertRowid;
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
  getRecentMessages,
  clearMessages,
  close
};

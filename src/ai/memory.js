import database from "../database/database.js";

const MAX_MESSAGES = 12;

function getHistory(chatId) {
  const messages =
    database.getRecentMessages(
      chatId,
      MAX_MESSAGES
    );

  return messages.map((message) => ({
    role: message.sender === "assistant"
      ? "assistant"
      : "user",
    content: message.message
  }));
}

function addMessage(
  chatId,
  role,
  content
) {
  database.addMessage(
    chatId,
    role,
    content
  );
}

function clearConversation(chatId) {
  database.clearMessages(chatId);
}

export default {
  getHistory,
  addMessage,
  clearConversation
};

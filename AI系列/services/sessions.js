const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function getSessionsFilePath() {
  return process.env.SESSIONS_FILE_PATH || path.join(__dirname, '..', 'data', 'sessions.json');
}

function ensureSessionsFile() {
  const filePath = getSessionsFilePath();
  const directory = path.dirname(filePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ sessions: [] }, null, 2));
  }

  return filePath;
}

function readStore() {
  const filePath = ensureSessionsFile();
  const raw = fs.readFileSync(filePath, 'utf8');

  if (!raw.trim()) {
    return { sessions: [] };
  }

  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.sessions)) {
    return { sessions: [] };
  }

  return parsed;
}

function writeStore(store) {
  const filePath = ensureSessionsFile();
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function createTimestamp() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function toSessionListItem(session) {
  const previewSource = session.messages[session.messages.length - 1]?.content || '';

  return {
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt,
    preview: previewSource.slice(0, 48),
  };
}

function formatDefaultTitle(sessionCount) {
  return `新会话 ${sessionCount + 1}`;
}

function formatTitleFromMessage(content) {
  return content.replace(/\s+/g, ' ').trim().slice(0, 20) || '新会话';
}

function createMessage(role, content) {
  return {
    id: createId(),
    role,
    content,
    createdAt: createTimestamp(),
  };
}

function listSessions() {
  const store = readStore();

  return store.sessions
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(toSessionListItem);
}

function createSession() {
  const store = readStore();
  const now = createTimestamp();
  const session = {
    id: createId(),
    title: formatDefaultTitle(store.sessions.length),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  store.sessions.push(session);
  writeStore(store);

  return toSessionListItem(session);
}

function getSessionById(sessionId) {
  const store = readStore();
  return store.sessions.find((session) => session.id === sessionId) || null;
}

function appendMessage(sessionId, role, content) {
  const store = readStore();
  const session = store.sessions.find((item) => item.id === sessionId);

  if (!session) {
    return null;
  }

  const message = createMessage(role, content);
  session.messages.push(message);
  session.updatedAt = message.createdAt;

  const userMessages = session.messages.filter((item) => item.role === 'user');
  if (role === 'user' && userMessages.length === 1 && session.title.startsWith('新会话')) {
    session.title = formatTitleFromMessage(content);
  }

  writeStore(store);

  return {
    session,
    message,
  };
}

function getModelMessages(sessionId) {
  const session = getSessionById(sessionId);

  if (!session) {
    return null;
  }

  return session.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

module.exports = {
  appendMessage,
  createSession,
  getModelMessages,
  getSessionById,
  listSessions,
};

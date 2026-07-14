const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/**
 * @function getSessionsFilePath
 * @returns {string}
 * @description 获取会话文件路径
 */
function getSessionsFilePath() {
  //优先从环境变量中获取
  //如果不存在，则从根目录下的data文件夹中获取
  return process.env.SESSIONS_FILE_PATH || path.join(__dirname, '..', 'data', 'sessions.json');
}

/**
 * @function ensureSessionsFile
 * @returns {string}
 * @description 确保会话文件存在
 */
function ensureSessionsFile() {
  //获取文件路径，具体到单个的文件
  const filePath = getSessionsFilePath();
  const directory = path.dirname(filePath);

  //如果不存在对应的文件夹，则创建
  if (!fs.existsSync(directory)) {
    //递归创建
    fs.mkdirSync(directory, { recursive: true });
  }

  //如果不存在对应的文件，则创建
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ sessions: [] }, null, 2));
  }

  //返回具体的文件路径
  return filePath;
}

/**
 * @function readStore
 * @returns {Object}
 * @description 读取会话文件内容
 */
function readStore() {
  //获取到具体的会话文件路径
  const filePath = ensureSessionsFile();
  //同步读取文件内容
  const raw = fs.readFileSync(filePath, 'utf8');

  //如果文件内容为空，则返回空对象
  if (!raw.trim()) {
    return { sessions: [] };
  }

  //将文件中的JSON字符串解析为对象
  const parsed = JSON.parse(raw);
  //如果为空对象，或者sessions字段不是数组，则返回空对象
  if (!parsed || !Array.isArray(parsed.sessions)) {
    return { sessions: [] };
  }

  //返回解析后的对象
  return parsed;
}

/**
 * @function writeStore
 * @param {*} store 
 * @description 写入会话文件内容
 */
function writeStore(store) {
  //获取到具体的会话文件路径
  const filePath = ensureSessionsFile();
  //同步写入文件内容
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

/**
 * @function createTimestamp
 * @returns {string}
 * @description 创建时间戳
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * @function createId
 * @returns {string}
 * @description 创建id
 */
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

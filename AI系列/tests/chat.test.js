const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createServer } = require('../index');
const { parseSseChunk } = require('../public/sse-parser');
const { loadEnvFile } = require('../utils/load-env');

function readSseEvents(raw) {
  return raw
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLines = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => {
          const raw = line.slice(5);
          return raw.startsWith(' ') ? raw.slice(1) : raw;
        });

      return {
        event: eventLine ? eventLine.slice(6).trim() : 'message',
        data: dataLines.join('\n'),
      };
    });
}

async function startServer(target) {
  let listener;

  if (typeof target.address === 'function' && target.address()) {
    listener = target;
  } else {
    listener = await new Promise((resolve) => {
      const createdServer = target.listen(0, () => resolve(createdServer));
    });
  }

  const { port } = listener.address();

  return {
    port,
    close: () => new Promise((resolve, reject) => {
      listener.close((error) => (error ? reject(error) : resolve()));
      if (typeof listener.closeIdleConnections === 'function') {
        listener.closeIdleConnections();
      }
      if (typeof listener.closeAllConnections === 'function') {
        listener.closeAllConnections();
      }
    }),
  };
}

function createTempSessionsFile(initialSessions = []) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-series-sessions-'));
  const filePath = path.join(tempDir, 'sessions.json');

  fs.writeFileSync(filePath, JSON.stringify({ sessions: initialSessions }, null, 2));

  return {
    filePath,
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}

async function createSession(baseUrl) {
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
  });

  assert.equal(response.status, 201);
  return response.json();
}

test('GET / returns the chat workspace page', async () => {
  const sessionsFile = createTempSessionsFile();
  const previousSessionsFilePath = process.env.SESSIONS_FILE_PATH;
  process.env.SESSIONS_FILE_PATH = sessionsFile.filePath;

  const server = createServer();
  const running = await startServer(server);

  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /会话列表/);
    assert.match(html, /chat-layout/);
  } finally {
    await running.close();
    if (previousSessionsFilePath === undefined) {
      delete process.env.SESSIONS_FILE_PATH;
    } else {
      process.env.SESSIONS_FILE_PATH = previousSessionsFilePath;
    }
    sessionsFile.cleanup();
  }
});

test('loadEnvFile reads values from .env without overriding existing env', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-series-env-'));
  const envPath = path.join(tempDir, '.env');

  fs.writeFileSync(envPath, [
    'BASE_URL="https://example.com/v1"',
    'MODEL=test-model',
    '# comment line',
    'API_KEY=from-env-file',
  ].join('\n'));

  const previousBaseUrl = process.env.BASE_URL;
  const previousApiKey = process.env.API_KEY;
  const previousModel = process.env.MODEL;

  process.env.BASE_URL = 'https://keep-existing.example/v1';
  delete process.env.API_KEY;
  delete process.env.MODEL;

  try {
    assert.equal(loadEnvFile(envPath), true);
    assert.equal(process.env.BASE_URL, 'https://keep-existing.example/v1');
    assert.equal(process.env.API_KEY, 'from-env-file');
    assert.equal(process.env.MODEL, 'test-model');
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = previousBaseUrl;
    }

    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }

    if (previousModel === undefined) {
      delete process.env.MODEL;
    } else {
      process.env.MODEL = previousModel;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('parseSseChunk preserves leading spaces in token data', () => {
  const events = parseSseChunk([
    'event: token',
    'data: Hello',
    '',
    'event: token',
    'data:  world',
    '',
  ].join('\n'));

  assert.deepEqual(events, [
    { event: 'token', data: 'Hello' },
    { event: 'token', data: ' world' },
  ]);
});

test('session APIs create and read persisted conversations', async () => {
  const sessionsFile = createTempSessionsFile();
  const previousSessionsFilePath = process.env.SESSIONS_FILE_PATH;
  process.env.SESSIONS_FILE_PATH = sessionsFile.filePath;

  const server = createServer();
  const running = await startServer(server);

  try {
    const baseUrl = `http://127.0.0.1:${running.port}`;
    const createPayload = await createSession(baseUrl);

    assert.match(createPayload.session.title, /新会话/);

    const listResponse = await fetch(`${baseUrl}/api/sessions`);
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.sessions.length, 1);
    assert.equal(listPayload.sessions[0].id, createPayload.session.id);

    const detailResponse = await fetch(`${baseUrl}/api/sessions/${createPayload.session.id}`);
    const detailPayload = await detailResponse.json();

    assert.equal(detailResponse.status, 200);
    assert.equal(detailPayload.session.messages.length, 0);
  } finally {
    await running.close();
    if (previousSessionsFilePath === undefined) {
      delete process.env.SESSIONS_FILE_PATH;
    } else {
      process.env.SESSIONS_FILE_PATH = previousSessionsFilePath;
    }
    sessionsFile.cleanup();
  }
});

test('POST /chat/stream returns 400 when sessionId is missing', async () => {
  const sessionsFile = createTempSessionsFile();
  const previousSessionsFilePath = process.env.SESSIONS_FILE_PATH;
  process.env.SESSIONS_FILE_PATH = sessionsFile.filePath;

  const server = createServer();
  const running = await startServer(server);

  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: '你好' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'sessionId 字段不能为空');
  } finally {
    await running.close();
    if (previousSessionsFilePath === undefined) {
      delete process.env.SESSIONS_FILE_PATH;
    } else {
      process.env.SESSIONS_FILE_PATH = previousSessionsFilePath;
    }
    sessionsFile.cleanup();
  }
});

test('POST /chat/stream returns SSE error when model config is missing', async () => {
  const sessionsFile = createTempSessionsFile();
  const previousSessionsFilePath = process.env.SESSIONS_FILE_PATH;
  const previousBaseUrl = process.env.BASE_URL;
  const previousApiKey = process.env.API_KEY;
  const previousModel = process.env.MODEL;

  process.env.SESSIONS_FILE_PATH = sessionsFile.filePath;
  delete process.env.BASE_URL;
  delete process.env.API_KEY;
  delete process.env.MODEL;

  const server = createServer();
  const running = await startServer(server);

  try {
    const baseUrl = `http://127.0.0.1:${running.port}`;
    const created = await createSession(baseUrl);
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: created.session.id, message: '你好' }),
    });
    const body = await response.text();
    const events = readSseEvents(body);

    assert.equal(response.status, 200);
    assert.deepEqual(events, [
      {
        event: 'error',
        data: JSON.stringify({
          error: '缺少模型配置，请设置 BASE_URL、API_KEY、MODEL',
        }),
      },
    ]);
  } finally {
    await running.close();
    if (previousSessionsFilePath === undefined) {
      delete process.env.SESSIONS_FILE_PATH;
    } else {
      process.env.SESSIONS_FILE_PATH = previousSessionsFilePath;
    }

    if (previousBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = previousBaseUrl;
    }

    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }

    if (previousModel === undefined) {
      delete process.env.MODEL;
    } else {
      process.env.MODEL = previousModel;
    }

    sessionsFile.cleanup();
  }
});

test('POST /chat/stream forwards full history and persists the assistant reply', async () => {
  const initialSessions = [
    {
      id: 'session-1',
      title: '历史会话',
      createdAt: '2026-07-14T10:00:00.000Z',
      updatedAt: '2026-07-14T10:05:00.000Z',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'Hello',
          createdAt: '2026-07-14T10:00:00.000Z',
        },
        {
          id: 'message-2',
          role: 'assistant',
          content: 'Hi there',
          createdAt: '2026-07-14T10:00:01.000Z',
        },
      ],
    },
  ];
  const sessionsFile = createTempSessionsFile(initialSessions);
  const previousSessionsFilePath = process.env.SESSIONS_FILE_PATH;
  const previousBaseUrl = process.env.BASE_URL;
  const previousApiKey = process.env.API_KEY;
  const previousModel = process.env.MODEL;

  process.env.SESSIONS_FILE_PATH = sessionsFile.filePath;

  let receivedBody;
  const upstreamServer = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
      res.writeHead(404).end();
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    receivedBody = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    res.write('data: {"choices":[{"delta":{"content":"I am"}}]}\n\n');
    res.write('data: {"choices":[{"delta":{"content":" fine"}}]}\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
  });

  const upstreamRunning = await startServer(upstreamServer);

  process.env.BASE_URL = `http://127.0.0.1:${upstreamRunning.port}/v1`;
  process.env.API_KEY = 'test-key';
  process.env.MODEL = 'test-model';

  const server = createServer();
  const running = await startServer(server);

  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: 'session-1', message: 'How are you?' }),
    });
    const body = await response.text();
    const events = readSseEvents(body);

    assert.equal(response.status, 200);
    assert.equal(receivedBody.model, 'test-model');
    assert.deepEqual(receivedBody.messages, [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'How are you?' },
    ]);
    assert.deepEqual(events, [
      {
        event: 'start',
        data: JSON.stringify({
          message: 'stream started',
          sessionId: 'session-1',
          title: '历史会话',
        }),
      },
      { event: 'token', data: 'I am' },
      { event: 'token', data: ' fine' },
      {
        event: 'end',
        data: JSON.stringify({ message: 'stream finished' }),
      },
    ]);

    const persisted = JSON.parse(fs.readFileSync(sessionsFile.filePath, 'utf8'));
    assert.equal(persisted.sessions[0].messages.length, 4);
    assert.equal(persisted.sessions[0].messages[2].content, 'How are you?');
    assert.equal(persisted.sessions[0].messages[3].content, 'I am fine');
  } finally {
    await running.close();
    await upstreamRunning.close();

    if (previousSessionsFilePath === undefined) {
      delete process.env.SESSIONS_FILE_PATH;
    } else {
      process.env.SESSIONS_FILE_PATH = previousSessionsFilePath;
    }

    if (previousBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = previousBaseUrl;
    }

    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }

    if (previousModel === undefined) {
      delete process.env.MODEL;
    } else {
      process.env.MODEL = previousModel;
    }

    sessionsFile.cleanup();
  }
});

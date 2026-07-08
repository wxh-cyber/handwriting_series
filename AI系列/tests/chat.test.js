const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createServer } = require('../index');
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
        .map((line) => line.slice(5).trimStart());

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

test('GET / returns the demo page', async () => {
  const server = createServer();
  const running = await startServer(server);

  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /AI 大模型 SSE 演示/);
  } finally {
    await running.close();
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

test('POST /chat/stream returns 400 when message is missing', async () => {
  const server = createServer();
  const running = await startServer(server);

  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'message 字段不能为空');
  } finally {
    await running.close();
  }
});

test('POST /chat/stream returns SSE error when model config is missing', async () => {
  delete process.env.BASE_URL;
  delete process.env.API_KEY;
  delete process.env.MODEL;

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
  }
});

test('POST /chat/stream forwards upstream chunks as SSE tokens', async () => {
  const upstreamServer = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    res.write('data: {"choices":[{"delta":{"content":"你"}}]}\n\n');
    res.write('data: {"choices":[{"delta":{"content":"好"}}]}\n\n');
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
      body: JSON.stringify({ message: '你好' }),
    });
    const body = await response.text();
    const events = readSseEvents(body);

    assert.equal(response.status, 200);
    assert.deepEqual(events, [
      {
        event: 'start',
        data: JSON.stringify({ message: 'stream started' }),
      },
      {
        event: 'token',
        data: '你',
      },
      {
        event: 'token',
        data: '好',
      },
      {
        event: 'end',
        data: JSON.stringify({ message: 'stream finished' }),
      },
    ]);
  } finally {
    await running.close();
    await upstreamRunning.close();
  }
});

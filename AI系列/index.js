const path = require('node:path');
const express = require('express');

const { loadEnvFile } = require('./utils/load-env');
const chatRouter = require('./routes/chat');
const sessionsRouter = require('./routes/sessions');

loadEnvFile();

function createServer() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api/sessions', sessionsRouter);
  app.use('/chat', chatRouter);

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({
      error: '服务器内部错误',
    });
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const app = createServer();

  app.listen(port, () => {
    console.log(`AI SSE demo server is running at http://127.0.0.1:${port}`);
  });
}

module.exports = {
  createServer,
};

const express = require('express');

const { streamChatCompletion, getConfigError } = require('../services/llm');

const router = express.Router();

function writeSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);

  //检查payload的data字段是否为字符串，如果不是，则将其转换为字符串
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const line of payload.split('\n')) {
    res.write(`data: ${line}\n`);
  }

  res.write('\n');
}

router.post('/stream', async (req, res) => {
  //后端从请求体中获取message字段
  const { message } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    //如果message字段为空，则返回400错误
    res.status(400).json({
      error: 'message 字段不能为空',
    });

    return;
  }

  //设置响应头
  res.status(200);
  //表明这是一个SSE响应
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  //检查配置是否正确
  const configError = getConfigError();
  if (configError) {
    //如果配置错误，则停止流式响应
    writeSseEvent(res, 'error', { error: configError });
    res.end();
    return;
  }

  //创建一个AbortController对象，用于控制流式响应的中止
  const abortController = new AbortController();
  res.on('close', () => {
    abortController.abort();
  });

  //给前端发送一个start事件
  writeSseEvent(res, 'start', { message: 'stream started' });

  try {
    await streamChatCompletion({
      message: message.trim(),
      signal: abortController.signal,
      onToken(token) {
        writeSseEvent(res, 'token', token);
      },
    });

    writeSseEvent(res, 'end', { message: 'stream finished' });
  } catch (error) {
    const errorMessage = error && error.message ? error.message : '流式请求失败';
    writeSseEvent(res, 'error', { error: errorMessage });
  } finally {
    res.end();
  }
});

module.exports = router;

const promptInput = document.querySelector('#prompt');
const sendButton = document.querySelector('#sendButton');
const statusText = document.querySelector('#status');
const output = document.querySelector('#output');

function setPendingState(pending) {
  sendButton.disabled = pending;
  statusText.textContent = pending ? '请求进行中...' : '等待输入';
}

function updateStatus(text) {
  statusText.textContent = text;
}

function parseSseChunk(chunk) {
  return chunk
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() || 'message';
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');

      return { event, data };
    });
}

async function sendMessage() {
  const message = promptInput.value.trim();
  if (!message) {
    updateStatus('请输入 message');
    output.textContent = '';
    return;
  }

  setPendingState(true);
  updateStatus('正在连接 SSE...');
  output.textContent = '';

  try {
    const response = await fetch('/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `请求失败：${response.status}`);
    }

    if (!response.body) {
      throw new Error('浏览器未收到可读取的响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const event of parseSseChunk(parts.join('\n\n'))) {
        if (event.event === 'start') {
          updateStatus('开始接收模型输出...');
        } else if (event.event === 'token') {
          output.textContent += event.data;
          updateStatus('流式输出中...');
        } else if (event.event === 'end') {
          updateStatus('输出完成');
        } else if (event.event === 'error') {
          const payload = JSON.parse(event.data);
          throw new Error(payload.error || '流式调用失败');
        }
      }
    }
  } catch (error) {
    output.textContent = error.message;
    updateStatus('请求失败');
  } finally {
    setPendingState(false);
  }
}

sendButton.addEventListener('click', sendMessage);

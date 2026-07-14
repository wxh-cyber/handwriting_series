//从页面上获取输入框，按钮，状态栏和输出结果
const promptInput = document.querySelector('#prompt');
const sendButton = document.querySelector('#sendButton');
const statusText = document.querySelector('#status');
const output = document.querySelector('#output');
const sessionList = document.querySelector('#sessionList');
const sessionTitle = document.querySelector('#sessionTitle');
const sessionMeta = document.querySelector('#sessionMeta');
const newSessionButton = document.querySelector('#newSessionButton');
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebarToggle');
const sidebarToggleCompact = document.querySelector('#sidebarToggleCompact');

const state = {
  sessions: [],
  activeSessionId: null,
  messages: [],
  isSidebarCollapsed: false,
  isStreaming: false,
  currentRequestController: null,
};

/**
 * @function setPendingState
 * @param {boolean} pending 
 * @description 设置请求进行中状态
 */
function setPendingState(pending) {
  //如果是pending状态，则禁用按钮，显示请求进行中状态
  //否则，启用按钮，显示等待输入状态
  state.isStreaming = pending;
  sendButton.disabled = pending || !state.activeSessionId;
  promptInput.disabled = pending || !state.activeSessionId;
  newSessionButton.disabled = pending;
  statusText.textContent = pending ? '请求进行中...' : '等待输入';
  renderSessionList();
}

/**
 * @function updateStatus
 * @param {*} text 
 * @description 更新状态
 */
function updateStatus(text) {
  statusText.textContent = text;
}

function renderEmptyState(title, description) {
  output.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const copy = document.createElement('p');
  copy.textContent = description;

  wrapper.appendChild(heading);
  wrapper.appendChild(copy);
  output.appendChild(wrapper);
}

function formatSessionTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getActiveSession() {
  return state.sessions.find((session) => session.id === state.activeSessionId) || null;
}

function syncHeader() {
  const activeSession = getActiveSession();

  if (!activeSession) {
    sessionTitle.textContent = '请选择一个会话';
    sessionMeta.textContent = '左侧可创建或切换不同会话，当前系统会保留上下文。';
    return;
  }

  sessionTitle.textContent = activeSession.title;
  sessionMeta.textContent = activeSession.preview
    ? `最近更新：${formatSessionTime(activeSession.updatedAt)}`
    : '当前会话暂时没有消息，开始你的第一轮提问吧。';
}

function renderSessionList() {
  sessionList.innerHTML = '';

  if (!state.sessions.length) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'empty-state';
    emptyItem.innerHTML = '<h3>暂无会话</h3><p>点击“新建会话”即可开始一段新的对话。</p>';
    sessionList.appendChild(emptyItem);
    return;
  }

  for (const session of state.sessions) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `session-item${session.id === state.activeSessionId ? ' active' : ''}`;
    item.disabled = state.isStreaming;

    const avatar = document.createElement('span');
    avatar.className = 'session-avatar';
    avatar.textContent = session.title.slice(0, 1);

    const content = document.createElement('div');
    content.className = 'session-content';

    const title = document.createElement('p');
    title.className = 'session-title';
    title.textContent = session.title;

    const preview = document.createElement('p');
    preview.className = 'session-preview';
    preview.textContent = session.preview || '暂无消息';

    const time = document.createElement('p');
    time.className = 'session-time';
    time.textContent = formatSessionTime(session.updatedAt);

    content.appendChild(title);
    content.appendChild(preview);
    content.appendChild(time);

    item.appendChild(avatar);
    item.appendChild(content);
    item.addEventListener('click', () => {
      if (!state.isStreaming) {
        selectSession(session.id).catch((error) => {
          updateStatus(error.message || '加载会话失败');
        });
      }
    });

    sessionList.appendChild(item);
  }
}

function renderMessages() {
  syncHeader();

  if (!state.activeSessionId) {
    renderEmptyState('先选择一个会话', '创建新会话后，右侧会显示该会话的消息详情，并保留完整上下文。');
    return;
  }

  if (!state.messages.length) {
    renderEmptyState('准备开始对话', '当前会话为空。输入你的第一条消息，AI 回复会以流式气泡形式显示。');
    return;
  }

  output.innerHTML = '';

  for (const message of state.messages) {
    const row = document.createElement('div');
    row.className = `message-row ${message.role}`;

    const bubble = document.createElement('article');
    bubble.className = 'message-bubble';

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const role = document.createElement('span');
    role.className = 'message-role';
    role.textContent = message.role === 'user' ? '你' : 'AI';

    const time = document.createElement('span');
    time.className = `message-status${message.status === 'error' ? ' error' : ''}`;
    time.textContent = message.status === 'streaming'
      ? '正在输出...'
      : message.status === 'error'
        ? '回复失败'
        : formatMessageTime(message.createdAt);

    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = message.content || (message.status === 'streaming' ? '...' : '');

    meta.appendChild(role);
    meta.appendChild(time);
    bubble.appendChild(meta);
    bubble.appendChild(content);
    row.appendChild(bubble);
    output.appendChild(row);
  }

  output.scrollTop = output.scrollHeight;
}

function applySidebarState() {
  sidebar.classList.toggle('collapsed', state.isSidebarCollapsed);
  sidebarToggle.textContent = state.isSidebarCollapsed ? '展开' : '收起';
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `请求失败：${response.status}`);
  }

  return payload;
}

async function loadSessions(preferredSessionId = state.activeSessionId) {
  const payload = await fetchJson('/api/sessions');
  state.sessions = payload.sessions || [];
  renderSessionList();

  const nextSessionId = state.sessions.some((session) => session.id === preferredSessionId)
    ? preferredSessionId
    : state.sessions[0]?.id || null;

  if (!nextSessionId) {
    state.activeSessionId = null;
    state.messages = [];
    renderMessages();
    setPendingState(false);
    return;
  }

  if (nextSessionId !== state.activeSessionId) {
    await selectSession(nextSessionId);
  } else {
    syncHeader();
  }
}

async function selectSession(sessionId) {
  const payload = await fetchJson(`/api/sessions/${sessionId}`);
  state.activeSessionId = payload.session.id;
  state.messages = payload.session.messages || [];
  renderSessionList();
  renderMessages();
  setPendingState(false);
}

async function createNewSession() {
  if (state.isStreaming) {
    return;
  }

  updateStatus('正在创建会话...');
  const payload = await fetchJson('/api/sessions', {
    method: 'POST',
  });

  await selectSession(payload.session.id);
  await loadSessions(payload.session.id);
  setPendingState(false);
  promptInput.focus();
}

function updateLocalSessionPreview(message) {
  const session = getActiveSession();

  if (!session) {
    return;
  }

  if (!session.preview) {
    session.title = message.slice(0, 20);
  }

  session.preview = message.slice(0, 48);
  session.updatedAt = new Date().toISOString();
  renderSessionList();
  syncHeader();
}

function safeParseEventData(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function sendMessage() {
  // 从输入框中获取输入的消息，并去除两端空格
  const message = promptInput.value.trim();

  // 如果消息为空，则提示用户输入
  if (!message) {
    updateStatus('请输入 message');
    output.textContent = '';
    return;
  }

  if (!state.activeSessionId) {
    updateStatus('请先新建一个会话');
    return;
  }

  const userMessage = {
    id: `local-user-${Date.now()}`,
    role: 'user',
    content: message,
    createdAt: new Date().toISOString(),
    status: 'done',
  };
  const assistantMessage = {
    id: `local-assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
    status: 'streaming',
  };
  const sessionId = state.activeSessionId;

  state.messages = [...state.messages, userMessage, assistantMessage];
  updateLocalSessionPreview(message);
  renderMessages();

  // 禁用按钮，显示请求进行中状态
  setPendingState(true);
  updateStatus('正在连接 SSE...');
  // 清空输出结果
  promptInput.value = '';

  let shouldRefreshSession = false;
  const controller = new AbortController();
  state.currentRequestController = controller;

  try {
    // 发起 POST 请求到 /chat/stream
    const response = await fetch('/chat/stream', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal,
    });

    // 如果响应状态码不是 200，则抛出异常
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `请求失败：${response.status}`);
    }

    // 如果响应体为空，则抛出异常
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

      for (const event of window.parseSseChunk(parts.join('\n\n'))) {
        if (event.event === 'start') {
          const payload = safeParseEventData(event.data);
          if (payload?.title) {
            const session = getActiveSession();
            if (session) {
              session.title = payload.title;
              renderSessionList();
              syncHeader();
            }
          }
          updateStatus('开始接收模型输出...');
        } else if (event.event === 'token') {
          assistantMessage.content += event.data;
          updateStatus('流式输出中...');
          renderMessages();
        } else if (event.event === 'end') {
          assistantMessage.status = 'done';
          shouldRefreshSession = true;
          updateStatus('输出完成');
        } else if (event.event === 'error') {
          const payload = safeParseEventData(event.data);
          throw new Error(payload.error || '流式调用失败');
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      assistantMessage.status = 'done';
      updateStatus('当前回复已停止');
    } else {
      assistantMessage.status = 'error';
      assistantMessage.content = assistantMessage.content || error.message;
      updateStatus('请求失败');
    }

    renderMessages();
  } finally {
    //无论请求成功还是失败，都将按钮重置为显示等待输入状态
    if (state.currentRequestController === controller) {
      state.currentRequestController = null;
    }

    setPendingState(false);

    if (shouldRefreshSession) {
      await loadSessions(sessionId);
      if (state.activeSessionId === sessionId) {
        await selectSession(sessionId);
      }
    } else {
      renderSessionList();
      syncHeader();
    }
  }
}

async function initialize() {
  try {
    await loadSessions();
  } catch (error) {
    renderEmptyState('加载失败', error.message || '无法初始化会话列表');
    updateStatus('加载失败');
  }
}

sidebarToggle.addEventListener('click', () => {
  state.isSidebarCollapsed = !state.isSidebarCollapsed;
  applySidebarState();
});

sidebarToggleCompact.addEventListener('click', () => {
  state.isSidebarCollapsed = !state.isSidebarCollapsed;
  applySidebarState();
});

newSessionButton.addEventListener('click', () => {
  createNewSession().catch((error) => {
    updateStatus(error.message || '创建会话失败');
  });
});

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage().catch((error) => {
      updateStatus(error.message || '发送失败');
    });
  }
});

// 监听按钮点击事件
sendButton.addEventListener('click', () => {
  sendMessage().catch((error) => {
    updateStatus(error.message || '发送失败');
  });
});

applySidebarState();
initialize();

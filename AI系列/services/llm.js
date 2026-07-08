//模型配置环境参数列表
const REQUIRED_ENV_KEYS = ['BASE_URL', 'API_KEY', 'MODEL'];

/**
 * @function getConfigError
 * @description 检查模型配置环境参数是否设置
 * @returns {string | null}
 */
function getConfigError() {
  //从当前环境变量中获取缺失的环境变量
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

  //如果没有缺失的环境变量，则返回 null
  if (!missingKeys.length) {
    return null;
  }

  //否则返回缺少的环境变量列表
  return '缺少模型配置，请设置 BASE_URL、API_KEY、MODEL';
}

/**
 * @function normalizeBaseUrl
 * @description 规范化 BASE_URL 结尾的斜杠
 * @param {*} baseUrl 
 * @returns {*}
 */
function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * @note payload字段
 * {
 *    id: "chatcmpl-xxx",
 *    object: "chat.completion.chunk",
 *    created: 1720000000,
 *    model: "gpt-4o-mini",
 *    choices: [
 *      {
 *        index: 0,
 *        delta: {
 *          role: "assistant",
 *          content: "你好"
 *        },
 *        finish_reason: null
 *      }
 *    ]
 *  }
 */
/**
 * @function extractToken
 * @description 从流式响应中提取 token
 * @param {*} payload
 * @returns {string}
 */
function extractToken(payload) {
  //从响应中提取出choices数组中的第一个元素
  const choice = payload && Array.isArray(payload.choices) ? payload.choices[0] : null;
  //从choices数组中的第一个元素中提取出delta对象
  const delta = choice && choice.delta ? choice.delta : null;

  return typeof delta?.content === 'string' ? delta.content : '';
}

/**
 * @function streamChatCompletion
 * @description 流式调用上游模型
 * @param {string} message - 用户输入的消息
 * @param {*} signal - 中断信号
 * @param {Function} onToken - 回调函数，用于处理token
 * @returns {Promise<void>}
 */
async function streamChatCompletion({ message, signal, onToken }) {
  //在当前获取到的base_url后面拼接上/chat/completions
  const response = await fetch(`${normalizeBaseUrl(process.env.BASE_URL)}/chat/completions`, {
    method: 'POST',

    //消息头需要指定API_KEY
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.API_KEY}`,
    },

    //消息体需要指定model、stream、messages
    body: JSON.stringify({
      model: process.env.MODEL,                        //从环境变量中获取model
      stream: true,                                    //采用流式输出
      messages: [
        {
          role: 'user',
          content: message,                            //填充prompt
        },
      ],
    }),

    /**
     * 思考：为什么这里需要传入signal？
     * 答：这里的signal不是给模型看的，而是给fetch看的，用来中断这次上游的HTTP流式请求。
     *     请求链路：
     *         1.浏览器请求/chat/stream
     *         2.服务端在 routes/chat.js 中再去调用上游大模型
     *         3.上游是一个长流式返回，不是一下子结束
     *         4.如果前端断开了、刷新页面了、关闭页面了，你的服务端就没必要继续傻等上游流
     * 
     *     所以这里会先建一个 AbortController，然后把它的 signal 传给 `streamChatCompletion`，最终传给 fetch(..., { signal })。
     * 
     *     核心作用有两个：
     *         1.前端断开时，及时取消上游请求
     *         2.避免资源浪费
     *             如果不传signal:
     *                 - 浏览器已关闭
     *                 - Node服务继续读上游模型流
     *                 - 白白占着连接、带宽、token、时间
     * 
     *   因此signal的本质是取消控制。
     */
    signal,
  });

  //如果响应状态码不是200，则抛出异常
  if (!response.ok) {
    let details = '';

    try {
      //获取到异常相关信息
      details = await response.text();
    } catch (error) {
      details = '';
    }

    throw new Error(`上游模型接口调用失败：${response.status}${details ? ` ${details}` : ''}`);
  }

  //如果没有返回可读取的流，则抛出异常
  if (!response.body) {
    throw new Error('上游模型没有返回可读取的流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of response.body) {
    //通过设置decode的stream参数为true，就可以实现逐帧读取数据
    buffer += decoder.decode(chunk, { stream: true });
    const frames = buffer.split('\n\n');                          //按SSE格式分割成一个个帧
    buffer = frames.pop() ?? '';

    /**
     * @note 这里为什么要遍历frames？
     * 答：因为上游返回的是一个SSE响应，而不是一个完整的JSON对象。
     * 
     * @note buffer的数据结构 - 带有\n\n的字符串
     * data: {"choices":[{"delta":{"content":"你"}}]}
     *
     * data: {"choices":[{"delta":{"content":"好"}}]}
     *
     * data: [DONE]
     * 
     * @note frames的数据结构 - 本质是一个字符串数组
     * [
     *   'data: {"choices":[{"delta":{"content":"你"}}]}',
     *   'data: {"choices":[{"delta":{"content":"好"}}]}',
     *   'data: [DONE]',
     *   ''
     * ]
     * 
     * @note frame - 一个完整的帧
     * 'data: {"choices":[{"delta":{"content":"你"}}]}'
     */
    for (const frame of frames) {
      const lines = frame
        .split('\n')                                              //去除单个字符串的换行符以及多余空格
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'));              //确保是data开头的

      for (const line of lines) {
        const data = line.slice(5).trim();                        //去除data:前缀，得到真正的数据内容

        if (!data) {                                              //如果数据为空，则跳过
          continue;
        }

        if (data === '[DONE]') {                                  //如果是[DONE]，则表示流式响应结束
          return;
        }

        let payload;
        try {
          //解析JSON数据
          /**
           * @note payload 数据结构
           * {
           *   choices: [
           *     {
           *       delta: {
           *         content: "你"
           *       }
           *     }
           *   ]
           * }
           */
          payload = JSON.parse(data);
        } catch (error) {
          continue;
        }

        const token = extractToken(payload);                             //从payload中提取token
        if (token) {
          //如果token不为空，则调用onToken回调函数
          onToken(token);
        }
      }
    }
  }

  if (buffer.trim()) {
    throw new Error('上游流式响应异常结束');
  }
}

/**
 * @exports
 * @note 导出函数，供其他模块调用
 */
module.exports = {
  getConfigError,
  streamChatCompletion,
};

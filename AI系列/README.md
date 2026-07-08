# AI 系列 - Express 最小 AI 流式调用案例

这是一个基于 `Express 5` 的最小 AI 大模型流式调用示例，演示：

- 浏览器页面如何调用后端
- 后端如何通过 `SSE` 向浏览器持续推送结果
- 后端如何对接 OpenAI 兼容接口

## 目录结构

```text
AI系列/
├─ index.js
├─ public/
│  ├─ app.js
│  └─ index.html
├─ routes/
│  └─ chat.js
├─ services/
│  └─ llm.js
├─ tests/
│  └─ chat.test.js
├─ .env.example
└─ package.json
```

## 运行方式

项目启动时会自动读取当前目录下的 `.env` 文件。

## `.env` 配置

可以直接在 `AI系列/.env` 里配置：

```env
BASE_URL=https://your-openai-compatible-host/v1
API_KEY=your_api_key
MODEL=your_model_name
PORT=3000
```

说明：

- 启动时会自动加载 `.env`
- 如果你同时在系统环境变量里也设置了同名字段，系统环境变量优先

## 运行方式

直接启动即可。

### PowerShell

```powershell
npm start
```

启动后访问：

```text
http://127.0.0.1:3000
```

## 接口说明

### `POST /chat/stream`

请求体：

```json
{
  "message": "请解释一下什么是 SSE"
}
```

返回：

- `event: start`：开始
- `event: token`：增量文本
- `event: end`：结束
- `event: error`：异常

## 测试

```powershell
node --test .\tests\chat.test.js
```

# 人生回忆录文案生成器

基于 Figma 设计的现代极简风格前端（React + Vite + Tailwind）。用户填写基本信息与「人生五部曲」问卷后，使用**内置模板**在本地拼出**导演分镜脚本**（标题 + 四乐章旁白），并支持照片数量建议。**默认不调用外网、不需要 OpenAI 密钥。**

源码仓库：<https://github.com/sylvica/memoirs2>

设计稿：[Figma](https://www.figma.com/design/8Ds8WdwTf23dnxKN3Cdfpu/%E4%BA%BA%E7%94%9F%E5%9B%9E%E5%BF%86%E5%BD%95%E6%96%87%E6%A1%88%E7%94%9F%E6%88%90%E5%99%A8)

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开终端里提示的地址（一般为 `http://localhost:5173`），填写问卷后点「生成回忆录」即可。

### 可选：同时起本地 Node 接口（仅在你自行对接 `api/` 云函数调试时需要）

```bash
npm run dev:full
```

会并行启动 `api/dev-server.ts`（需 `.env` 中 `OPENAI_API_KEY`）与 Vite；**日常使用只跑 `npm run dev` 即可。**

仓库内 `api/` 目录保留 **Vercel Serverless** 示例（`generate-memoir`），部署时可配置 `OPENAI_API_KEY` 使用大模型；与当前前端默认的**本地模板生成**相互独立。

## 构建

```bash
npm run build
```

产物在 `dist/`，可部署到任意静态托管。

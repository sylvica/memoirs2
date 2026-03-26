/**
 * 本地开发用：在 127.0.0.1 默认 PORT（见下方）提供 POST /api/generate-memoir（无需 vercel dev）
 * 默认端口 3001，避免与本机常用 3000（其它工具）冲突；可在 .env 中设置 PORT=。
 * 环境变量：必须从「项目根目录」的 .env 读取（文件名必须是 .env，不能是 .env.txt / .env copy.example）
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { handleGenerateMemoirPost } from './lib/handleGenerateMemoir';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const PORT = Number(process.env.PORT || 3001);
const hasOpenAiKey = Boolean(
  process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim(),
);

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0] || '';

  if (req.method === 'POST' && url === '/api/generate-memoir') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    let body: unknown;
    try {
      body = raw.trim() ? JSON.parse(raw) : null;
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '请求体不是合法 JSON' }));
      return;
    }

    const out = await handleGenerateMemoirPost(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    res.writeHead(out.status, headers);
    res.end(JSON.stringify(out.json));
    return;
  }

  if (req.method === 'GET' && url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: true,
        service: 'generate-memoir-dev',
        openaiConfigured: hasOpenAiKey,
      }),
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[dev-api] 端口 ${PORT} 已被占用（EADDRINUSE）。\n` +
        `  · 请结束占用该端口的进程（例如：任务管理器结束旧的 node / 或曾运行的 vercel dev），\n` +
        `  · 或在项目根目录 .env 中设置 PORT=其它空闲端口（如 3002），保存后重新执行 npm run dev:full。\n` +
        `    Vite 会读取同一份 .env 的 PORT，代理到同一端口。`,
    );
  } else {
    console.error('[dev-api]', err);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[dev-api] POST http://127.0.0.1:${PORT}/api/generate-memoir`);
  console.log(`[dev-api] GET  http://127.0.0.1:${PORT}/api/health`);
  console.log(`[dev-api] 已从 ${path.join(projectRoot, '.env')} 加载环境变量`);
  if (!hasOpenAiKey) {
    console.warn(
      '[dev-api] 未检测到 OPENAI_API_KEY。请在项目根目录创建文件 **.env**（文件名只能是 .env），并写入：\n' +
        '  OPENAI_API_KEY=sk-你的密钥\n' +
        '可复制 .env.example 为 .env 再填写。若文件名是「.env copy.example」等，请重命名为 .env。',
    );
  } else {
    console.log('[dev-api] OPENAI_API_KEY 已配置');
  }
});

import type { VercelRequest, VercelResponse } from './vercel-types';
import { handleGenerateMemoirPost } from './lib/handleGenerateMemoir';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: '请求体不是合法 JSON' });
    }
  }

  const out = await handleGenerateMemoirPost(body);
  if (out.status === 200) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  return res.status(out.status).json(out.json);
}

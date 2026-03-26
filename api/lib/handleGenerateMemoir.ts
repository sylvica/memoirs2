import {
  generateDirectorScript,
  ModelJsonParseError,
  type GenerateRequestBody,
} from './directorLlm';

/** 与 Vercel 路由、本地 dev-server 共用的生成逻辑 */
export async function handleGenerateMemoirPost(body: unknown): Promise<{
  status: number;
  json: unknown;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: 500, json: { error: '服务器未配置 OPENAI_API_KEY' } };
  }

  if (!body || typeof body !== 'object') {
    return { status: 400, json: { error: '缺少 JSON 请求体' } };
  }

  try {
    const result = await generateDirectorScript(body as GenerateRequestBody, {
      apiKey,
    });
    return { status: 200, json: result };
  } catch (e) {
    if (e instanceof ModelJsonParseError) {
      return {
        status: 500,
        json: { error: e.message, rawData: e.rawContent },
      };
    }
    const msg = e instanceof Error ? e.message : '生成失败';
    return { status: 500, json: { error: msg } };
  }
}

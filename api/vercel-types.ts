/**
 * Vercel Serverless 请求/响应最小类型（不依赖 @vercel/node，减少 npm audit 噪音）
 */
export interface VercelRequest {
  method?: string;
  body?: unknown;
}

export interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

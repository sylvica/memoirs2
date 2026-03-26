/**
 * 纪录片配音旁白 + 分镜字段：System Prompt + OpenAI JSON 模式（Vercel Serverless / Node）
 */

export const DIRECTOR_SYSTEM_PROMPT = `你是一位顶级的传记纪录片配音编剧。你需要将用户提供的问卷答案（包含感官记忆、硬核事业成就以及大量自由补充的故事），改写成全程以第一人称（"我"）进行的纯旁白自传台词（Voice-over）。

【旁白撰写四大铁律】
1. 纯净输出与第一人称：voice_over 字段只能包含要念出来的纯文字！绝对禁止出现括号备注（如"叹气"）、分镜指示或特殊符号。全程使用"我"来讲述。
2. 骨肉相连的叙事：必须把用户的"感官细节（温度/气味/物件）"作为引子，自然铺陈出他们的"事业奋斗与人生成就"。不要空洞煽情，用细节和画面感说话。
3. 动态篇幅扩展（极度重要）：仔细阅读用户的输入。如果用户在"自由补充（q_extra）"字段提供了大量经历，你必须将这些细节完整编织进剧本，**大幅增加该乐章 voice_over 的字数**，尽情展开故事的起承转合。不要压缩用户丰富的人生！
4. 无缝连贯：输出的四个乐章拼在一起，必须是一篇语义首尾相连、逻辑递进的单人演讲。上一段结尾必须自然滑入下一段开头（如："回想起来，那份踏实……"、"但真正的考验，才刚开始……"）。

【严格的 JSON 输出格式】（不包含任何配乐字段）
{
  "title": "回忆录标题（文艺、大气且切合自传主题，如《炉火与图纸：我的四十年》）",
  "chapters": [
    {
      "chapter_name": "第一乐章：原乡",
      "voice_over": "很多年以后，哪怕我已经带队走过了无数个大工程，脑子里最常闻到的，还是小时候老屋灶台里的那股柴火味。那时候家里条件不好，每次听见父亲那辆破自行车的铃铛声，我就在想，什么时候我能凭自己的双手，造出真正响当当的东西。那时候我的梦很简单，就是想当个能修好所有东西的工程师……（注意：如果用户提供了 extra 补充内容，请在此处继续流畅地扩写）",
      "visual_prompt": "【视觉画面指导】精细描述画面，适合 AI 生成老照片。如：70年代老屋灶台，柴火燃烧的暖色调，胶片质感。"
    },
    {
      "chapter_name": "第二乐章：入行",
      "voice_over": "……带着这份心思，我终于踏进了行业的大门。我还记得，拿到第一笔奖金时，我咬牙去供销社买了一块上海牌手表。戴上它的那一刻，我就告诉自己，这辈子做事得像表针一样严丝合缝……",
      "visual_prompt": "80年代工厂车间，一个年轻人戴着上海牌手表专注地看着图纸。"
    }
  ]
}
注意：chapters 数组必须生成 4 个对象，覆盖人生的起步、奋斗、成就与传承。示例中仅展示前两个乐章的结构；实际输出须包含 4 个完整 chapter 对象。请仅返回合法 JSON，不要使用 markdown 代码块，不要任何说明文字。`;

export const LIFE_FIVE_KEYS = [
  'q_childhood_sense',
  'q_early_dream',
  'q_extra_childhood',
  'q_youth_item',
  'q_first_achievement',
  'q_love_marriage',
  'q_extra_youth',
  'q_hardest_moment',
  'q_career_peak',
  'q_children',
  'q_extra_adult',
  'q_legacy',
  'q_extra_middle_age',
  'q_final_message',
] as const;

export type LifeFiveKey = (typeof LIFE_FIVE_KEYS)[number];
export type LifeFiveAnswers = Record<LifeFiveKey, string>;

export interface GenerateRequestBody {
  basicInfo?: Record<string, unknown>;
  lifeFiveAnswers?: Partial<Record<string, string>>;
  [key: string]: unknown;
}

export interface DirectorChapter {
  chapter_name: string;
  voice_over: string;
  visual_prompt: string;
}

export interface DirectorScriptPayload {
  title: string;
  chapters: DirectorChapter[];
}

/** 解析失败时携带完整原始文本，便于 API 返回 rawData */
export class ModelJsonParseError extends Error {
  readonly rawContent: string;
  constructor(message: string, rawContent: string) {
    super(message);
    this.name = 'ModelJsonParseError';
    this.rawContent = rawContent;
  }
}

/**
 * 暴力清洗 + 截取首尾 JSON + 解析（应对 markdown、前后废话、不可见控制符）
 * resultText = completion.choices[0].message.content
 */
export function parseModelJsonContent(resultText: string): unknown {
  let cleanedText = resultText;

  try {
    // 先去掉常见 markdown 代码块包裹，便于定位第一个 `{`
    cleanedText = cleanedText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.slice(firstBrace, lastBrace + 1);
    } else {
      throw new Error('大模型返回的内容中没有找到 JSON 对象');
    }

    cleanedText = cleanedText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    const finalJson = JSON.parse(cleanedText);
    return finalJson;
  } catch (error) {
    console.error('【致命错误】JSON 解析失败！');
    console.error('原始字符串长度:', resultText.length);
    console.error('截取后的字符串:', cleanedText);
    const reason = error instanceof Error ? error.message : String(error);
    throw new ModelJsonParseError(`JSON 解析失败：${reason}`, cleanedText);
  }
}

function normalizeLifeFiveAnswers(body: GenerateRequestBody): LifeFiveAnswers {
  const nested = body.lifeFiveAnswers || {};
  const out = {} as Record<string, string>;
  for (const key of LIFE_FIVE_KEYS) {
    const v =
      (nested as Record<string, string>)[key] ??
      (typeof body[key] === 'string' ? (body[key] as string) : '');
    out[key] = typeof v === 'string' ? v : '';
  }
  return out as LifeFiveAnswers;
}

function buildUserContent(
  basicInfo: Record<string, unknown> | undefined,
  answers: LifeFiveAnswers,
): string {
  const payload = { basicInfo: basicInfo ?? {}, lifeFiveAnswers: answers };
  return `以下是用户填写的基本信息与「人生五部曲」问卷答案（JSON）。请严格按系统提示中的配音编剧要求，将其改写成可朗读的旁白与配套字段，并仅输出一个 JSON 对象，不要输出 markdown 代码块或其它说明文字。

${JSON.stringify(payload, null, 2)}`;
}

export async function generateDirectorScript(
  body: GenerateRequestBody,
  options: { apiKey: string; model?: string },
): Promise<DirectorScriptPayload> {
  const apiKey = options.apiKey;
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const lifeFive = normalizeLifeFiveAnswers(body);
  const basicInfo =
    body.basicInfo && typeof body.basicInfo === 'object'
      ? (body.basicInfo as Record<string, unknown>)
      : {};

  const userContent = buildUserContent(basicInfo, lifeFive);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.75,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') {
    throw new Error('大模型未返回有效内容');
  }

  const parsed = parseModelJsonContent(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON 结构无效');
  }

  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title : '';
  const chaptersRaw = obj.chapters;
  if (!Array.isArray(chaptersRaw)) {
    throw new Error('JSON 缺少 chapters 数组');
  }

  const chapters: DirectorChapter[] = chaptersRaw.map((c, i) => {
    if (!c || typeof c !== 'object') {
      throw new Error(`chapters[${i}] 格式错误`);
    }
    const ch = c as Record<string, unknown>;
    return {
      chapter_name: String(ch.chapter_name ?? ''),
      voice_over: String(ch.voice_over ?? ''),
      visual_prompt: String(ch.visual_prompt ?? ''),
    };
  });

  if (chapters.length !== 4) {
    throw new Error(`chapters 必须为 4 个乐章，当前为 ${chapters.length} 个`);
  }

  return { title, chapters };
}

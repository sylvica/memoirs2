import type { MemoirData, DirectorScriptPayload } from '../context/MemoirContext';
import { generatePhotoSuggestions, buildLocalDirectorScript } from './scriptGenerator';

export type MemoirGenerationDeps = {
  memoirData: MemoirData;
  setPhotoSuggestions: (s: unknown) => void;
  setDirectorScript: (d: DirectorScriptPayload | null) => void;
  setGeneratedScript: (s: string) => void;
};

/** 与开屏页翻书时长接近，避免本地生成过快导致过场一闪而过（毫秒） */
export const GENERATING_OVERLAY_MIN_MS = 5600;

/**
 * 纯本地生成：用内置模板把问卷答案拼成四乐章导演分镜与完整旁白，不请求任何外网接口。
 */
export async function runMemoirGeneration(
  deps: MemoirGenerationDeps,
): Promise<{ ok: true }> {
  const t0 = Date.now();

  deps.setPhotoSuggestions(generatePhotoSuggestions(deps.memoirData));

  const director = buildLocalDirectorScript(deps.memoirData);
  deps.setDirectorScript(director);

  const voiceText = director.chapters
    .map(c => c.voice_over?.trim())
    .filter(Boolean)
    .join('\n\n');
  deps.setGeneratedScript(
    director.title ? `${director.title}\n\n${voiceText}` : voiceText,
  );

  const elapsed = Date.now() - t0;
  if (elapsed < GENERATING_OVERLAY_MIN_MS) {
    await new Promise<void>(resolve => {
      setTimeout(resolve, GENERATING_OVERLAY_MIN_MS - elapsed);
    });
  }

  return { ok: true };
}

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy, FileText, Image, Bell,
  ArrowLeft, RefreshCw, Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';
import { memoirPrimary, memoirOutline } from '../styles/memoirButtons';
import { copyToClipboard } from '../utils/copyToClipboard';
import { useMemoir } from '../context/MemoirContext';
import type { DirectorChapter } from '../context/MemoirContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useScrollToTop } from '../hooks/useScrollToTop';

function buildAllVoiceOverText(chapters: DirectorChapter[]): string {
  return chapters
    .map(c => c.voice_over?.trim() || '')
    .filter(Boolean)
    .join('\n\n');
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { memoirData } = useMemoir();
  const [activeTab, setActiveTab] = useState<'script' | 'photos' | 'reminder'>('script');
  const [copied, setCopied] = useState(false);
  const [copiedVoiceOnly, setCopiedVoiceOnly] = useState(false);
  useScrollToTop();

  const { generatedScript, photoSuggestions, directorScript } = memoirData;

  const handleCopyScript = async () => {
    const ok = await copyToClipboard(generatedScript);
    if (ok) {
      setCopied(true);
      toast.success('文案已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败，请长按文案区域手动复制');
    }
  };

  const handleCopyAllVoiceOvers = async () => {
    if (!directorScript?.chapters?.length) {
      toast.error('暂无可复制的旁白');
      return;
    }
    const text = buildAllVoiceOverText(directorScript.chapters);
    if (!text.trim()) {
      toast.error('旁白内容为空');
      return;
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedVoiceOnly(true);
      toast.success('全部旁白已复制，可直接粘贴到剪映');
      setTimeout(() => setCopiedVoiceOnly(false), 2000);
    } else {
      toast.error('复制失败，请长按内容手动复制');
    }
  };

  const handleCopyPhotoList = async () => {
    const ok = await copyToClipboard(generatePhotoListText());
    if (ok) toast.success('照片清单已复制到剪贴板');
    else toast.error('复制失败，请长按内容手动复制');
  };

  const handleCopyReminder = async () => {
    const ok = await copyToClipboard(generateReminderText());
    if (ok) toast.success('准备提醒已复制到剪贴板');
    else toast.error('复制失败，请长按内容手动复制');
  };

  const generatePhotoListText = () => {
    if (!photoSuggestions?.stages) return '';
    let text = '照片准备清单\n\n';
    photoSuggestions.stages.forEach((stage: { title: string; min: number; max: number }, i: number) => {
      text += `${i + 1}. ${stage.title}：${stage.min}–${stage.max}张\n`;
    });
    text += `\n建议总照片数：${photoSuggestions.total.min}–${photoSuggestions.total.max}张`;
    return text;
  };

  const generateReminderText = () => {
    if (!photoSuggestions?.stages) return '';
    let text = '下节课准备提醒\n\n';
    text += `请按人生阶段准备相关照片，建议总数 ${photoSuggestions.total.min}–${photoSuggestions.total.max} 张。\n\n`;
    text += '优先准备：\n';
    photoSuggestions.stages.forEach((stage: { title: string; min: number; max: number }, i: number) => {
      text += `${i + 1}. ${stage.title} ${stage.min}–${stage.max} 张\n`;
    });
    text += '\n如某阶段没有照片，也可以带：毕业证、奖状、工作证、结婚证、旧物件、书信、老照片翻拍件等。';
    return text;
  };

  const tabs = [
    { id: 'script' as const, label: '导演脚本', shortLabel: '脚本', icon: FileText },
    { id: 'photos' as const, label: '照片建议', shortLabel: '照片', icon: Image },
    { id: 'reminder' as const, label: '下节课提醒', shortLabel: '提醒', icon: Bell },
  ];

  const hasDirector = !!(directorScript && directorScript.chapters?.length > 0);

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(to bottom, #FAF8F3, #FFFEF8)' }}
    >
      <div className="max-w-3xl mx-auto">

        <motion.div
          className="text-center mb-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-5">
            <div className="w-10 h-px bg-[#A67C52] opacity-40" />
            <div className="mx-3 w-1.5 h-1.5 rounded-full bg-[#A67C52] opacity-40" />
            <div className="w-10 h-px bg-[#A67C52] opacity-40" />
          </div>
          <h1 className="text-[#4A3F35] mb-3">您的回忆录已生成</h1>
          <p className="text-[#8B7E74] px-2 leading-relaxed text-sm sm:text-base">
            {hasDirector
              ? '以下为导演分镜脚本：按乐章分段呈现旁白，您可直接复制或继续精修。'
              : '这是一篇适合10分钟左右传记视频使用的整体旁白文案，风格温暖、纪实、真诚，您可以直接复制，继续修改，或导出保存。'}
          </p>
        </motion.div>

        <motion.div
          className="flex gap-2 mb-5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3.5 rounded-xl border-2 transition-all min-h-[48px]
                  ${isActive
                    ? 'border-[#A67C52] bg-gradient-to-br from-[#FAF8F3] to-[#FFFEF8] text-[#4A3F35] shadow-lg'
                    : 'border-[#E8DCC8] bg-white text-[#8B7E74] hover:border-[#D4BFA0]'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl border-2 border-[#E8DCC8] overflow-hidden"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >

          {activeTab === 'script' && (
            <div className="p-5 sm:p-8">
              {hasDirector ? (
                <>
                  <div className="mb-6 sm:mb-8 text-center px-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#B8866B] mb-2">导演分镜脚本</p>
                    <h2 className="text-[#4A3F35] text-2xl sm:text-3xl font-serif leading-snug font-medium">
                      {directorScript!.title || '未命名回忆录'}
                    </h2>
                  </div>

                  <div className="mb-6 flex justify-center">
                    <Button
                      onClick={handleCopyAllVoiceOvers}
                      className={cn(
                        memoirPrimary,
                        'w-full sm:w-auto min-h-[48px] px-6 flex items-center justify-center gap-2',
                      )}
                    >
                      {copiedVoiceOnly ? (
                        <><Check className="w-5 h-5 shrink-0" />已复制旁白</>
                      ) : (
                        <><Copy className="w-5 h-5 shrink-0" />一键复制所有旁白</>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-6 sm:space-y-8">
                    {directorScript!.chapters.map((chapter, index) => (
                      <motion.article
                        key={index}
                        className="rounded-2xl border border-[#E8DCC8] bg-gradient-to-br from-[#FFFEF8] to-[#FAF8F3] overflow-hidden shadow-sm"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <header className="px-4 sm:px-6 py-3.5 border-b border-[#E8DCC8] bg-white/70">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                              style={{
                                background: 'linear-gradient(to br, #D4BFA0, #A67C52)',
                              }}
                            >
                              {index + 1}
                            </span>
                            <h3 className="text-[#4A3F35] font-medium text-base sm:text-lg leading-snug">
                              {chapter.chapter_name}
                            </h3>
                          </div>
                        </header>

                        <div className="p-4 sm:p-6">
                          <p className="text-xs uppercase tracking-wider text-[#8B7E74] mb-2">旁白</p>
                          <div
                            className="text-[#4A3F35] text-base sm:text-lg leading-[1.85] whitespace-pre-wrap"
                            style={{ fontFamily: 'Georgia, "Noto Serif SC", serif' }}
                          >
                            {chapter.voice_over || '（暂无旁白）'}
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleCopyAllVoiceOvers}
                      className={cn(memoirOutline, 'min-h-[44px] px-6 flex items-center justify-center gap-2')}
                    >
                      <Copy className="w-4 h-4 shrink-0" />
                      一键复制所有旁白
                    </Button>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 pt-6 border-t border-[#E8DCC8]">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/life-stages')}
                      className={cn(memoirOutline, 'flex items-center justify-center gap-2')}
                    >
                      <RefreshCw className="mr-2 w-5 h-5" />
                      重新生成
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="mb-5 p-4 rounded-xl border flex items-center gap-3"
                    style={{ background: '#FFF8F0', borderColor: '#F4D4A0' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C8924A' }} />
                    <p className="text-sm leading-snug" style={{ color: '#8A5820' }}>
                      风格：温暖 · 纪实 · 真诚 — 适合个人传记视频旁白
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-[#8B7E74] text-sm leading-relaxed mb-1">
                      即使您跳过了部分阶段，系统也会根据已填写内容生成完整、自然的文案。
                    </p>
                    <p className="text-[#B8866B] text-xs">复制后可直接用于视频制作或继续精修。</p>
                  </div>

                  <div
                    className="rounded-xl p-5 sm:p-7 mb-5 border border-[#E8DCC8] max-h-[420px] overflow-y-auto"
                    style={{
                      background: 'linear-gradient(to bottom right, #FFFEF8, #FAF8F3)',
                      backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(166,124,82,0.02) 2px, rgba(166,124,82,0.02) 4px)',
                    }}
                  >
                    <div className="text-[#4A3F35] leading-loose whitespace-pre-wrap">
                      {generatedScript || '暂无生成的文案内容'}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <Button
                      onClick={handleCopyScript}
                      className={cn(memoirPrimary, 'flex-1 sm:flex-none flex items-center justify-center gap-2 px-6')}
                    >
                      {copied ? (
                        <><Check className="mr-2 w-5 h-5" />已复制</>
                      ) : (
                        <><Copy className="mr-2 w-5 h-5" />一键复制整体文案</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => navigate('/life-stages')}
                      className={cn(memoirOutline, 'flex items-center justify-center gap-2')}
                    >
                      <RefreshCw className="mr-2 w-5 h-5" />
                      重新生成
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="p-5 sm:p-8">
              <p className="text-[#8B7E74] mb-5 leading-relaxed">
                根据您的人生内容，建议按阶段准备以下照片或替代素材。
              </p>

              <div className="space-y-3 mb-6">
                {photoSuggestions?.stages?.map((stage: { title: string; min: number; max: number }, index: number) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-4 sm:p-5 rounded-xl border border-[#E8DCC8]"
                    style={{ background: 'linear-gradient(to right, #FFFEF8, #FAF8F3)' }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(to br, #D4BFA0, #A67C52)' }}
                      >
                        <span className="text-sm">{index + 1}</span>
                      </div>
                      <span className="text-[#4A3F35] font-medium">{stage.title}</span>
                    </div>
                    <span className="text-[#A67C52] font-medium flex-shrink-0 ml-2">
                      {stage.min}–{stage.max} 张
                    </span>
                  </motion.div>
                ))}
              </div>

              <div
                className="text-white p-5 rounded-xl mb-5 text-center"
                style={{ background: 'linear-gradient(to br, #A67C52, #B8866B)' }}
              >
                <p className="text-xl font-medium">
                  建议总照片数：{photoSuggestions?.total?.min}–{photoSuggestions?.total?.max} 张
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-amber-900 text-sm leading-relaxed">
                  <strong>提示：</strong>如果某些阶段照片不足，也可以准备毕业证、奖状、工作证、
                  结婚证、旧物件、书信、日记、老房子照片等替代素材。
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyPhotoList}
                  className={cn(memoirPrimary, 'flex-1 sm:flex-none flex items-center justify-center gap-2')}
                >
                  <Copy className="mr-2 w-5 h-5" />
                  复制照片建议
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'reminder' && (
            <div className="p-5 sm:p-8">
              <p className="text-[#8B7E74] mb-5 leading-relaxed">
                这是一段可直接发送给自己、家属或老师的准备提醒文字。
              </p>

              <div
                className="rounded-xl p-5 sm:p-7 mb-5 border-2 border-[#D4BFA0] shadow-lg"
                style={{
                  background: 'linear-gradient(to bottom right, #FFFEF8, #FAF8F3)',
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(166,124,82,0.02) 2px, rgba(166,124,82,0.02) 4px)',
                }}
              >
                <div className="text-[#4A3F35] leading-loose text-sm sm:text-base whitespace-pre-wrap">
                  {generateReminderText()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyReminder}
                  className={cn(memoirPrimary, 'flex-1 sm:flex-none flex items-center justify-center gap-2')}
                >
                  <Copy className="mr-2 w-5 h-5" />
                  一键复制提醒
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="flex justify-center mt-6 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/life-stages')}
            className={cn(memoirOutline, 'px-7 flex items-center justify-center gap-2')}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            返回修改内容
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

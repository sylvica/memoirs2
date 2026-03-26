import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle, Save, Loader2, Check, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';
import { memoirPrimary, memoirOutline } from '../styles/memoirButtons';
import { Textarea } from '../components/ui/textarea';
import VoiceRecorder from '../components/VoiceRecorder';
import { useMemoir } from '../context/MemoirContext';
import type { LifeFivePartKey } from '../context/MemoirContext';
import { toast } from 'sonner';
import { useScrollToTop } from '../hooks/useScrollToTop';
import BookGeneratingOverlay from '../components/BookGeneratingOverlay';
import { runMemoirGeneration } from '../utils/memoirGeneration';

/** 单题配置：必答/选填、自由补充用大号多行框 */
type FieldDef = {
  key: LifeFivePartKey;
  question: string;
  hint: string;
  optional?: boolean;
  supplement?: boolean;
};

const STEPS: { id: string; title: string; subtitle: string; fields: FieldDef[] }[] = [
  {
    id: 's1',
    title: '阶段一：原乡与启蒙',
    subtitle: '（0–18 岁）',
    fields: [
      {
        key: 'q_childhood_sense',
        question:
          '闭上眼睛回想小时候，您脑海里最先听到或闻到的是什么声音、什么气味？',
        hint: '示例：老屋灶台的柴火味、父亲自行车的破铃铛声',
      },
      {
        key: 'q_early_dream',
        question: '那个时候，您最大的梦想是什么？最想干什么工作？',
        hint: '示例：想当个工程师，或者哪怕只是想赶紧长大帮家里赚钱',
      },
      {
        key: 'q_extra_childhood',
        question:
          '在这个阶段，您还有什么想补充的特别故事、重要的人、或是深藏的遗憾吗？',
        hint: '选填，可尽情讲述',
        optional: true,
        supplement: true,
      },
    ],
  },
  {
    id: 's2',
    title: '阶段二：青涩与入行',
    subtitle: '（19–30 岁）',
    fields: [
      {
        key: 'q_youth_item',
        question:
          '刚步入社会那几年，您用自己赚的钱买的第一件“奢侈品”或最舍不得的物件是什么？',
        hint: '示例：一块上海牌手表、一台燕舞牌收录机',
      },
      {
        key: 'q_first_achievement',
        question:
          '在工作的前几年，第一次让您觉得“我干得真不错”、特别有成就感的一件事是什么？',
        hint: '示例：第一次独立修好了一台大机器，师傅拍了拍我的肩膀',
      },
      {
        key: 'q_love_marriage',
        question:
          '关于爱情与婚姻，您记忆中最温馨或最难忘的一个画面是什么？',
        hint: '例如结婚那天借来的自行车，或是两人一起吃苦攒钱的日子。',
        optional: true,
      },
      {
        key: 'q_extra_youth',
        question:
          '关于您的青年时代与初入职场，还有什么波澜壮阔或惊心动魄的经历想补充吗？',
        hint: '选填，可尽情讲述',
        optional: true,
        supplement: true,
      },
    ],
  },
  {
    id: 's3',
    title: '阶段三：风雨与巅峰',
    subtitle: '（31–50 岁）',
    fields: [
      {
        key: 'q_hardest_moment',
        question:
          '为了事业或家庭，您经历过最难熬的一段日子是什么样的？请描述一个具体的画面',
        hint:
          '示例：大冬天连熬三个通宵赶项目，手冻得发紫，只能握着热水杯取暖',
      },
      {
        key: 'q_career_peak',
        question: '这辈子您最骄傲、最拿得出手的一项成就是什么？',
        hint: '示例：带队完成了全县的电网改造，看着万家灯火亮起',
      },
      {
        key: 'q_children',
        question:
          '关于迎来新生命和为人父母，哪一个瞬间让您觉得一切辛苦都值得？',
        hint: '例如孩子第一次叫爸妈，或是送孩子去外地念书时的背影。',
        optional: true,
      },
      {
        key: 'q_extra_adult',
        question:
          '在您事业和家庭的黄金期，还有哪些值得大书特书的成就，或是让您铭记至今的恩人/对手？',
        hint: '选填，可尽情讲述',
        optional: true,
        supplement: true,
      },
    ],
  },
  {
    id: 's4',
    title: '阶段四：沉淀与交棒',
    subtitle: '（51–65 岁）',
    fields: [
      {
        key: 'q_legacy',
        question:
          '在您退休前后，您留给了徒弟、后辈或者这个行业什么最宝贵的经验？',
        hint:
          '示例：我教给徒弟们的不仅是一门手艺，更是做事得凭良心的规矩',
      },
      {
        key: 'q_extra_middle_age',
        question:
          '关于沉淀与交棒，您还有什么特别的人生感悟或故事想要记录下来吗？',
        hint: '选填，可尽情讲述',
        optional: true,
        supplement: true,
      },
    ],
  },
  {
    id: 's5',
    title: '阶段五：回响与寄语',
    subtitle: '（65 岁+）',
    fields: [
      {
        key: 'q_final_message',
        question:
          '如果这部视频留给子孙后代，关于如何面对人生和工作，您最想对他们说的一句心里话是什么？',
        hint: '示例：人这一辈子，别怕吃苦，但也别忘了看看路边的风景',
      },
    ],
  },
];

export default function LifeStagesPage() {
  const navigate = useNavigate();
  const {
    memoirData,
    updateLifeFiveAnswer,
    saveDraft,
    saveStatus,
    setGeneratedScript,
    setDirectorScript,
    setPhotoSuggestions,
  } = useMemoir();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationLockRef = useRef(false);
  useScrollToTop();

  const answers = memoirData.lifeFiveAnswers;

  const handleContentChange = (key: LifeFivePartKey, content: string) => {
    updateLifeFiveAnswer(key, content);
  };

  const handleVoiceTranscript = (key: LifeFivePartKey, transcript: string) => {
    const prev = answers[key]?.trim() ?? '';
    const next = prev ? `${prev}\n\n${transcript}` : transcript;
    updateLifeFiveAnswer(key, next);
  };

  const handleSaveDraft = () => {
    saveDraft();
    toast.success('草稿已保存，下次打开时自动恢复');
  };

  const filledCount = Object.values(answers).filter(
    v => typeof v === 'string' && v.trim(),
  ).length;

  const SaveLabel = () => {
    if (saveStatus === 'saving') {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs hidden sm:inline ml-1">保存中</span>
        </>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <>
          <Check className="w-4 h-4" />
          <span className="text-xs hidden sm:inline ml-1">已保存</span>
        </>
      );
    }
    return (
      <>
        <Save className="w-4 h-4" />
        <span className="text-xs hidden sm:inline ml-1">保存</span>
      </>
    );
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const totalSteps = STEPS.length;

  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigate('/basic-info');
  };

  const handleGenerate = async () => {
    if (generationLockRef.current || isGenerating) return;
    generationLockRef.current = true;
    setIsGenerating(true);
    let navigated = false;
    try {
      const result = await runMemoirGeneration({
        memoirData,
        setPhotoSuggestions,
        setDirectorScript,
        setGeneratedScript,
      });
      if (result.ok) {
        navigated = true;
        navigate('/result');
      }
    } finally {
      generationLockRef.current = false;
      if (!navigated) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <>
    <div
      className={cn(
        'min-h-screen pb-36 px-4 pt-8 transition-opacity duration-200',
        isGenerating && 'opacity-0 pointer-events-none select-none',
      )}
      style={{ background: 'linear-gradient(to bottom, #FAF8F3, #FFFEF8)' }}
      aria-hidden={isGenerating}
    >
      <div className="max-w-2xl mx-auto">

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

          <h1 className="text-[#4A3F35] mb-3">人生五部曲</h1>
          <p className="text-[#8B7E74] leading-relaxed px-2">
            您可以手动填写，也可以点击每道题旁的录音直接说出您的故事。说得越真实，生成的文案就越生动。
          </p>
        </motion.div>

        {filledCount > 0 && (
          <motion.div
            className="mb-5 flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-green-700 text-sm">
              已填写 <strong>{filledCount}</strong> 道题，内容越丰富，文案越生动
            </span>
          </motion.div>
        )}

        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[#8B7E74]">
          <span>第 {currentStep + 1} / {totalSteps} 步</span>
        </div>

        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-8 bg-[#A67C52]'
                  : i < currentStep
                    ? 'w-2 bg-[#A67C52]/60'
                    : 'w-2 bg-[#E8DCC8]',
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl border-2 border-[#D4BFA0] shadow-md overflow-hidden mb-6"
          >
            <div className="p-4 sm:p-5 border-b border-[#E8DCC8] bg-gradient-to-r from-[#FAF8F3] to-[#FFFEF8]">
              <h2 className="text-[#4A3F35] text-lg">{step.title}</h2>
              <p className="text-[#8B7E74] text-sm mt-1">{step.subtitle}</p>
            </div>

            <div className="p-4 sm:p-5 space-y-6">
              {step.fields.map(field => (
                <div key={field.key} className="space-y-3">
                  <p className="text-[#4A3F35] font-medium text-sm leading-relaxed">
                    {field.question}
                    {field.optional && (
                      <span className="text-[#8B7E74] font-normal">（选填）</span>
                    )}
                  </p>

                  <VoiceRecorder
                    key={`${step.id}-${field.key}`}
                    onTranscriptComplete={text => handleVoiceTranscript(field.key, text)}
                  />

                  <Textarea
                    value={answers[field.key] || ''}
                    onChange={e => handleContentChange(field.key, e.target.value)}
                    placeholder="您可以在这里手动输入，或使用上方录音口述。"
                    className={cn(
                      'border-[#E8DCC8] focus:border-[#A67C52] resize-none bg-white p-4 leading-relaxed',
                      field.supplement ? 'min-h-[200px]' : 'min-h-[120px]',
                    )}
                  />

                  <p className="text-sm text-gray-400 leading-relaxed">{field.hint}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-white border-t border-[#E8DCC8] shadow-[0_-4px_24px_rgba(74,63,53,0.12)] px-2 sm:px-4 py-3">
          {/* 单行不换行；极窄屏可横向轻滑查看全部按钮 */}
          <div
            className={cn(
              'max-w-2xl mx-auto flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3',
              'overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none]',
              '[&::-webkit-scrollbar]:hidden',
            )}
          >

            <Button
              variant="outline"
              onClick={goPrev}
              className={cn(
                memoirOutline,
                'shrink-0 min-w-[5.25rem] sm:min-w-[6.5rem] flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-3',
              )}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="whitespace-nowrap text-sm sm:text-base">上一步</span>
            </Button>

            {!isLast ? (
              <Button
                onClick={goNext}
                className={cn(
                  memoirPrimary,
                  'shrink-0 min-w-[6.5rem] sm:min-w-[9rem] flex items-center justify-center gap-1.5 px-3 sm:px-5 py-3 shadow-md',
                )}
              >
                <span className="whitespace-nowrap text-sm sm:text-base">下一步</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={cn(
                  memoirPrimary,
                  'shrink-0 min-w-[7.5rem] sm:min-w-[11rem] flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-3 shadow-md',
                )}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="whitespace-nowrap text-sm sm:text-base">生成回忆录</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className={cn(
                memoirOutline,
                'shrink-0 min-w-[3.75rem] sm:min-w-[4.5rem] px-2 sm:px-4 py-3 flex items-center justify-center gap-1 transition-all',
                saveStatus === 'saved' && 'border-green-400 text-green-700',
              )}
            >
              <SaveLabel />
            </Button>

          </div>
        </div>
      </div>
    </div>
    {isGenerating && <BookGeneratingOverlay />}
    </>
  );
}

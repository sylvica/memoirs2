import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  { text: '正在整理人生片段…', sub: '翻阅您留下的每一段记忆' },
  { text: '正在生成导演分镜脚本…', sub: '纪录片叙事与画面、旁白台词' },
  { text: '正在整理照片建议…', sub: '为每个阶段匹配合适的照片数量' },
];

const floatingWords = ['童年', '青春', '奋斗', '家庭', '传承', '记忆'];

/** 步骤切换节奏与开屏翻书总时长（约 5.4s+）相配 */
const STEP_INTERVAL_MS = 2200;

/**
 * 全屏过场：书本视觉与开屏页（OpeningPage）同源——大书脊、叠页、封面缓翻；
 * 封面循环「合上—翻开」模拟持续翻阅，节奏与源文件一致（约 3s/程 + 缓动）。
 */
export default function BookGeneratingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(stepTimer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: 'linear-gradient(160deg, #F5F0E8 0%, #EAD9C4 55%, #DDD0BA 100%)' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 30% 20%, rgba(166,124,82,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(74,63,53,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-16 left-8 sm:left-16 w-24 h-24 border border-[#A67C52] rounded-full opacity-[0.05]"
          animate={{ scale: [1, 1.15, 1], rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-16 right-8 sm:right-16 w-32 h-32 border border-[#A67C52] rounded-full opacity-[0.05]"
          animate={{ scale: [1, 1.2, 1], rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* 与 OpeningPage 一致的大书本 + 封面缓翻循环 */}
      <div style={{ perspective: '1200px' }}>
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 28, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.43, 0.13, 0.23, 0.96] }}
          style={{ width: '230px', height: '310px' }}
        >
          <motion.div
            className="absolute -bottom-4 left-4 right-4"
            style={{
              height: '24px',
              background:
                'radial-gradient(ellipse at center, rgba(74,63,53,0.4) 0%, transparent 72%)',
              filter: 'blur(5px)',
            }}
            initial={{ opacity: 0, scaleX: 0.7 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.75 }}
          />

          <div
            className="absolute top-0 left-0 h-full z-10"
            style={{
              width: '16px',
              background: 'linear-gradient(to right, #6B5040, #8B6644, #A67C52)',
              borderRadius: '4px 0 0 4px',
              boxShadow: '-3px 0 8px rgba(0,0,0,0.28)',
            }}
          >
            <div className="absolute top-6 left-1 right-1 h-px bg-[#D4BFA0] opacity-50" />
            <div className="absolute bottom-6 left-1 right-1 h-px bg-[#D4BFA0] opacity-50" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 h-px bg-[#D4BFA0] opacity-30" />
          </div>

          {[8, 5, 3].map((offset, i) => (
            <div
              key={i}
              className="absolute top-[3px] bottom-[3px]"
              style={{
                left: `${16 + offset}px`,
                right: `-${offset}px`,
                background: i === 0 ? '#EAE4D9' : i === 1 ? '#F0EBE2' : '#F7F3EC',
                borderRadius: '0 3px 3px 0',
                opacity: 0.8 - i * 0.15,
                boxShadow: i === 0 ? '2px 0 4px rgba(0,0,0,0.08)' : 'none',
              }}
            />
          ))}

          <div
            className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden"
            style={{
              left: '16px',
              right: '0',
              background: 'linear-gradient(to right, #FFFEF8, #FAF8F3)',
              borderRadius: '0 4px 4px 0',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 17px, rgba(166,124,82,0.07) 17px, rgba(166,124,82,0.07) 18px)',
              }}
            />
            <motion.div
              className="relative z-10 text-center px-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.9 }}
            >
              <div className="w-14 h-px bg-[#A67C52] opacity-30 mx-auto mb-4" />
              <p
                className="text-[#8B7E74] italic leading-loose"
                style={{ fontSize: '0.88rem', fontFamily: 'serif' }}
              >
                正在为您<br />整理文稿…
              </p>
              <div className="w-14 h-px bg-[#A67C52] opacity-30 mx-auto mt-4" />
            </motion.div>
          </div>

          {/* 封面：与开屏同源缓动，循环正反翻，单趟约 3s */}
          <motion.div
            className="absolute top-0 bottom-0"
            style={{
              left: '16px',
              right: '0',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              zIndex: 20,
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -172 }}
            transition={{
              duration: 3.0,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: [0.4, 0.0, 0.12, 1.0],
              repeatDelay: 0.35,
            }}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(140deg, #C8B49A 0%, #D4BFA0 45%, #BCA98C 100%)',
                borderRadius: '0 4px 4px 0',
                backfaceVisibility: 'hidden',
                boxShadow:
                  'inset -10px 0 24px rgba(0,0,0,0.13), inset 2px 0 8px rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="absolute inset-0 rounded-r"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 45%, rgba(0,0,0,0.06) 100%)',
                }}
              />
              <div
                className="absolute"
                style={{
                  inset: '10px',
                  border: '1px solid rgba(74,63,53,0.22)',
                  borderRadius: '2px',
                }}
              />
              <div
                className="absolute"
                style={{
                  inset: '16px',
                  border: '1px solid rgba(74,63,53,0.12)',
                  borderRadius: '1px',
                }}
              />

              <div className="relative z-10 text-center px-5 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                  <div className="w-1 h-1 rounded-full bg-[#4A3F35] opacity-35" />
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                </div>
                <p
                  className="text-[#4A3F35] tracking-[0.3em] mb-2"
                  style={{ fontSize: '0.58rem', opacity: 0.55 }}
                >
                  珍 藏 纪 念
                </p>
                <h1
                  className="text-[#4A3F35]"
                  style={{
                    fontSize: '1.45rem',
                    fontFamily: 'serif',
                    letterSpacing: '0.14em',
                    lineHeight: 1.55,
                    textShadow: '0 1px 3px rgba(255,255,255,0.28)',
                  }}
                >
                  人生
                  <br />
                  回忆录
                </h1>
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                  <div className="w-1 h-1 rounded-full bg-[#4A3F35] opacity-35" />
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                </div>
                <p
                  className="text-[#6B5E54] tracking-[0.18em]"
                  style={{ fontSize: '0.55rem', fontFamily: 'serif', opacity: 0.5 }}
                >
                  生成中
                </p>
              </div>

              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 opacity-20">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                  <circle cx="14" cy="14" r="6" stroke="#4A3F35" strokeWidth="0.6" />
                  <circle cx="14" cy="14" r="11" stroke="#4A3F35" strokeWidth="0.4" />
                  <line x1="14" y1="3" x2="14" y2="25" stroke="#4A3F35" strokeWidth="0.4" />
                  <line x1="3" y1="14" x2="25" y2="14" stroke="#4A3F35" strokeWidth="0.4" />
                </svg>
              </div>
            </div>

            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #F5F0E8, #FAF8F3)',
                borderRadius: '0 4px 4px 0',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="mt-7 text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.85 }}
      >
        <p className="text-[#8B7E74] tracking-[0.18em] text-sm">《 人生回忆录 》文案整理</p>
      </motion.div>

      <div className="mt-8 mb-3 min-h-[4rem] flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="text-[#4A3F35] mb-1 text-lg">{steps[currentStep].text}</h2>
            <p className="text-[#8B7E74] text-sm">{steps[currentStep].sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2.5 mb-6">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index <= currentStep ? 'bg-[#A67C52]' : 'bg-[#E8DCC8]'
            }`}
            animate={{ width: index <= currentStep ? '36px' : '8px' }}
          />
        ))}
      </div>

      <motion.p
        className="text-[#8B7E74] text-sm text-center max-w-xs leading-relaxed px-4 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        请稍候，正在用内置模板整理您的问卷，生成导演分镜与旁白。
      </motion.p>
      <motion.p
        className="text-[#B8866B] text-xs text-center px-6 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        全部在浏览器本地完成，无需联网密钥。
      </motion.p>

      <motion.div
        className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        {floatingWords.map((word, index) => (
          <motion.span
            key={word}
            className="text-[#D4BFA0]"
            style={{ fontFamily: 'serif', fontSize: '1.1rem' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ delay: 2 + index * 0.22, duration: 0.85 }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

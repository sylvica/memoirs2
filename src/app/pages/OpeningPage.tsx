import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function OpeningPage() {
  const navigate = useNavigate();
  useScrollToTop();

  useEffect(() => {
    // 动画结束后自动跳转，每次刷新都重新播放
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 5400);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F5F0E8 0%, #EAD9C4 55%, #DDD0BA 100%)' }}
    >
      {/* 背景纹理 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 30% 20%, rgba(166,124,82,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(74,63,53,0.05) 0%, transparent 60%)',
        }}
      />

      {/* ===== 书本主体 ===== */}
      <div style={{ perspective: '1200px' }}>
        {/* 整体出场动画 */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, ease: [0.43, 0.13, 0.23, 0.96] }}
          style={{ width: '230px', height: '310px' }}
        >
          {/* 书本底部投影 */}
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
            transition={{ delay: 0.6, duration: 0.8 }}
          />

          {/* 书脊 */}
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

          {/* 书页叠层（制造厚度感）*/}
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

          {/* 书页内容区（封面翻开后显示）*/}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden"
            style={{
              left: '16px',
              right: '0',
              background: 'linear-gradient(to right, #FFFEF8, #FAF8F3)',
              borderRadius: '0 4px 4px 0',
            }}
          >
            {/* 横线纹理 */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 17px, rgba(166,124,82,0.07) 17px, rgba(166,124,82,0.07) 18px)',
              }}
            />
            {/* 内页文字，翻开后淡入 */}
            <motion.div
              className="relative z-10 text-center px-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6, duration: 1.1 }}
            >
              <div className="w-14 h-px bg-[#A67C52] opacity-30 mx-auto mb-5" />
              <p
                className="text-[#8B7E74] italic leading-loose"
                style={{ fontSize: '0.88rem', fontFamily: 'serif' }}
              >
                翻开人生的<br />这一页
              </p>
              <div className="w-14 h-px bg-[#A67C52] opacity-30 mx-auto mt-5" />
            </motion.div>
          </div>

          {/* ===== 前封面（核心动画：从闭合缓缓翻开）===== */}
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
              delay: 1.0,
              ease: [0.4, 0.0, 0.12, 1.0],
            }}
          >
            {/* 封面正面（用户初始看到的） */}
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
              {/* 封面质感光泽 */}
              <div
                className="absolute inset-0 rounded-r"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 45%, rgba(0,0,0,0.06) 100%)',
                }}
              />
              {/* 双重装饰边框 */}
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

              {/* 封面文字内容 */}
              <div className="relative z-10 text-center px-5 flex flex-col items-center">
                {/* 顶部装饰线 */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                  <div className="w-1 h-1 rounded-full bg-[#4A3F35] opacity-35" />
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                </div>

                <p
                  className="text-[#4A3F35] tracking-[0.3em] mb-3"
                  style={{ fontSize: '0.58rem', opacity: 0.55 }}
                >
                  珍 藏 纪 念
                </p>

                {/* 主标题 */}
                <h1
                  className="text-[#4A3F35]"
                  style={{
                    fontSize: '1.7rem',
                    fontFamily: 'serif',
                    letterSpacing: '0.18em',
                    lineHeight: 1.6,
                    textShadow: '0 1px 3px rgba(255,255,255,0.28)',
                  }}
                >
                  人生
                  <br />
                  回忆录
                </h1>

                {/* 底部装饰 */}
                <div className="flex items-center gap-2 mt-3 mb-3">
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                  <div className="w-1 h-1 rounded-full bg-[#4A3F35] opacity-35" />
                  <div className="w-8 h-px bg-[#4A3F35] opacity-35" />
                </div>

                <p
                  className="text-[#6B5E54] tracking-[0.22em]"
                  style={{ fontSize: '0.58rem', fontFamily: 'serif', opacity: 0.5 }}
                >
                  Life Memoir
                </p>
              </div>

              {/* 底部花纹装饰 */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="6" stroke="#4A3F35" strokeWidth="0.6" />
                  <circle cx="14" cy="14" r="11" stroke="#4A3F35" strokeWidth="0.4" />
                  <line x1="14" y1="3" x2="14" y2="25" stroke="#4A3F35" strokeWidth="0.4" />
                  <line x1="3" y1="14" x2="25" y2="14" stroke="#4A3F35" strokeWidth="0.4" />
                </svg>
              </div>
            </div>

            {/* 封面背面（翻开后贴着内页） */}
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

      {/* 书名副标题（书本出现时淡入）*/}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.9 }}
      >
        <p
          className="text-[#8B7E74] tracking-[0.22em]"
          style={{ fontSize: '0.78rem' }}
        >
          《 人生回忆录 》文案生成器
        </p>
      </motion.div>

      {/* 底部口号（翻开之后出现）*/}
      <motion.p
        className="absolute bottom-10 sm:bottom-14 text-[#8B7E74] tracking-wider text-center px-8"
        style={{ fontSize: '0.8rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.2, duration: 0.9 }}
      >
        让珍贵记忆被温柔记录
      </motion.p>
    </div>
  );
}
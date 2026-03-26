import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mic, FileText, Image, ArrowRight, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';
import { memoirPrimaryLarge, memoirOutline } from '../styles/memoirButtons';
import { useState } from 'react';
import ExampleModal from '../components/ExampleModal';
import { useMemoir } from '../context/MemoirContext';
import { toast } from 'sonner';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [showExample, setShowExample] = useState(false);
  const { hasDraft, clearDraft } = useMemoir();
  useScrollToTop();

  const handleClearDraft = () => {
    clearDraft();
    toast.success('草稿已清除，可以重新开始');
  };

  const features = [
    {
      icon: Mic,
      title: '语音转文字',
      description: '不会打字也没关系，直接说出来，系统自动转为文字。',
    },
    {
      icon: FileText,
      title: '自动生成传记文案',
      description: '根据您填写或口述的经历，整理成适合视频旁白的完整文案。',
    },
    {
      icon: Image,
      title: '智能推荐照片清单',
      description: '根据人生阶段内容，提醒您下次准备相应照片和替代素材。',
    },
  ];

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'linear-gradient(to bottom, #FAF8F3, #FFFEF8)' }}
    >
      <div className="max-w-2xl mx-auto">

        {/* 主标题区域 */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* 装饰线 */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-px bg-[#A67C52] opacity-40" />
            <div className="mx-3 w-2 h-2 rounded-full bg-[#A67C52] opacity-40" />
            <div className="w-12 h-px bg-[#A67C52] opacity-40" />
          </div>

          <h1 className="text-[#4A3F35] mb-4 tracking-wide px-2">
            人生回忆录文案生成器
          </h1>

          <p className="text-[#8B7E74] mb-4 max-w-lg mx-auto leading-relaxed px-2">
            输入或口述自己人生中的重要经历，自动生成适合10分钟传记视频的文案初稿，并智能推荐各阶段照片准备数量。
          </p>

          <p className="text-[#A67C52] text-sm max-w-lg mx-auto leading-relaxed mb-2 px-2">
            默认由本人操作，为自己记录人生故事；也支持为父母、配偶、子女或孙辈整理传记。
          </p>

          <p className="text-[#B8866B] text-sm max-w-lg mx-auto leading-relaxed px-2">
            不想填写或不想说的内容可以直接跳过，不会影响后续文案生成。
          </p>
        </motion.div>

        {/* 恢复草稿提示横幅 */}
        {hasDraft && (
          <motion.div
            className="mb-7 p-4 rounded-2xl border-2 border-[#D4BFA0] flex items-center justify-between gap-3"
            style={{ background: 'linear-gradient(to right, #FFF8F0, #FAF8F3)' }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <RotateCcw className="w-5 h-5 text-[#A67C52] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[#4A3F35] text-sm font-medium">检测到上次未完成的草稿</p>
                <p className="text-[#8B7E74] text-xs mt-0.5">您之前填写的内容已自动恢复，可以继续填写。</p>
              </div>
            </div>
            <button
              onClick={handleClearDraft}
              className="flex-shrink-0 flex items-center gap-1 text-[#8B7E74] hover:text-red-500 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清除
            </button>
          </motion.div>
        )}

        {/* 功能卡片 */}
        <motion.div
          className="grid gap-4 mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-md border border-[#E8DCC8] flex items-start gap-4"
              whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(166, 124, 82, 0.13)' }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(to br, #D4BFA0, #A67C52)' }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#4A3F35] mb-1">{feature.title}</h3>
                <p className="text-[#8B7E74] text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Button
            onClick={() => navigate('/basic-info')}
            className={cn(
              memoirPrimaryLarge,
              'w-full flex items-center justify-center gap-2 transition-all duration-300',
            )}
          >
            开始生成
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            className={cn(memoirOutline, 'w-full py-5 transition-all duration-300')}
            onClick={() => setShowExample(true)}
          >
            查看示例文案
          </Button>
        </motion.div>

        {/* 底部引言 */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="inline-block relative">
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4BFA0] opacity-30" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4BFA0] opacity-30" />
            <p className="text-[#8B7E74] italic px-8 py-4 text-sm">
              "每一段人生都值得被温柔记录"
            </p>
          </div>
        </motion.div>
      </div>

      {/* 示例模态框 */}
      <ExampleModal isOpen={showExample} onClose={() => setShowExample(false)} />
    </div>
  );
}
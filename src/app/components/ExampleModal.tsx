import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExampleModal({ isOpen, onClose }: ExampleModalProps) {
  const exampleScript = `这是张明的人生故事。生于1958年，江苏苏州，从那时起，一段温暖的人生旅程缓慢展开。

关于童年，这段记忆尤为深刻。小时候生活在苏州老城区的一条小巷子里，那是一个青砖黛瓦的院落，家里有爷爷奶奶、父母和两个弟弟。最难忘的是夏天的晚上，全家人坐在院子里乘凉，听爷爷讲过去的故事。那时候生活虽然不富裕，但一家人在一起，心里总是暖暖的。

说起青春求学，心中涌起温暖。1976年高中毕业后，赶上了恢复高考。那段准备考试的日子很辛苦，每天清晨就起来背书，晚上点着煤油灯做题。最终考上了上海的大学，成为家里第一个大学生，父母激动得一夜没睡。

初入社会，毕业后分配到了一家国营工厂做技术员。第一次拿到工资，心里既兴奋又忐忑。刚开始工作时最难的是理论和实践的差距，很多学校学的东西用不上，需要从头学起。但师傅们都很照顾我，手把手地教。

工作与事业，在工厂一干就是二十多年。最自豪的是1990年参与的一个技术改造项目，不仅提高了生产效率，还获得了省级科技进步奖。那段时间虽然加班加点很辛苦，但看到成果出来的那一刻，所有的付出都值得了。

家庭生活中最珍贵的记忆是什么？1985年结婚，妻子是同事介绍认识的，她温柔贤惠，是我一生的伴侣。记得女儿出生那天，我在产房外等了一夜，听到婴儿第一声啼哭，眼泪就下来了。最想感谢的就是妻子，这些年她默默支持着我，把家里打理得井井有条。

在照顾家庭或养育孩子过程中，最难忘的是女儿小时候生病住院的那段时间，我和妻子轮流守在病床边，那种担心和无助至今难忘。好在孩子恢复得很好，现在已经成家立业。家庭责任让我变得更加坚韧，也更懂得珍惜平凡的日子。

近年生活，退休后的日子反而更充实了。每天早上去公园打太极，下午和老朋友们下棋聊天，周末女儿会带外孙来看我们。现在最珍惜的就是健康的身体和家人的陪伴，平平淡淡才是真。

这就是张明的人生故事。每一段记忆，都值得被温柔记录；每一个瞬间，都值得被永远珍藏。`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 模态框 */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border-2 border-[#E8DCC8]">
              
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-[#E8DCC8] bg-gradient-to-r from-[#FAF8F3] to-[#FFFEF8]">
                <h2 className="text-[#4A3F35] text-2xl">文案示例</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-[#E8DCC8] flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-[#8B7E74]" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-8 overflow-y-auto max-h-[calc(80vh-180px)]">
                <div className="bg-gradient-to-br from-[#FFFEF8] to-[#FAF8F3] rounded-xl p-8 border border-[#E8DCC8]"
                     style={{
                       backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(166, 124, 82, 0.02) 2px, rgba(166, 124, 82, 0.02) 4px)',
                     }}
                >
                  <div className="text-[#4A3F35] leading-loose whitespace-pre-wrap text-lg">
                    {exampleScript}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-900 text-sm">
                    <strong>说明：</strong>这是一个基于温馨家庭型风格生成的示例文案。您填写的内容越详细，生成的文案就会越生动、越贴近您的真实人生故事。
                  </p>
                </div>
              </div>

              {/* 底部 */}
              <div className="p-6 border-t border-[#E8DCC8] bg-gradient-to-r from-[#FAF8F3] to-[#FFFEF8] flex justify-center">
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-[#A67C52] to-[#B8866B] hover:from-[#8B6644] hover:to-[#A67C52] 
                           text-white px-12 py-3 rounded-xl"
                >
                  我知道了
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

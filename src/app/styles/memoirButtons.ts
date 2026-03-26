/**
 * 全站主按钮 / 线框按钮样式统一，避免各页 class 不一致。
 * 与 Button 组件组合：className={cn(memoirPrimary, 'flex-1 …')}。
 */
export const memoirPrimary =
  'bg-gradient-to-r from-[#A67C52] to-[#B8866B] hover:from-[#8B6644] hover:to-[#A67C52] text-white rounded-xl shadow-lg min-h-[52px] px-6 py-3.5';

export const memoirPrimaryLarge =
  'bg-gradient-to-r from-[#A67C52] to-[#B8866B] hover:from-[#8B6644] hover:to-[#A67C52] text-white rounded-xl shadow-lg min-h-[56px] px-6 py-4';

export const memoirOutline =
  'border-2 border-[#D4BFA0] text-[#4A3F35] bg-white hover:bg-[#FAF8F3] rounded-xl min-h-[52px] px-5 py-3.5';

export const memoirOutlineMuted =
  'border-2 border-[#E8DCC8] text-[#5C534C] bg-white hover:bg-[#FAF8F3] rounded-xl min-h-[52px] px-5 py-3.5';

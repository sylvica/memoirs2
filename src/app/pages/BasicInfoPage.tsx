import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, SkipForward, Save, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';
import { memoirPrimary, memoirOutline, memoirOutlineMuted } from '../styles/memoirButtons';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useMemoir } from '../context/MemoirContext';
import { toast } from 'sonner';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function BasicInfoPage() {
  const navigate = useNavigate();
  const { memoirData, updateBasicInfo, saveDraft, saveStatus } = useMemoir();
  const [formData, setFormData] = useState(memoirData.basicInfo);
  useScrollToTop();

  // 每次表单变化自动同步到 Context（触发自动保存）
  useEffect(() => {
    updateBasicInfo(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleSubmit = () => {
    navigate('/life-stages');
  };

  const handleSkip = () => {
    navigate('/life-stages');
  };

  const handleSaveDraft = () => {
    saveDraft();
    toast.success('草稿已保存，下次打开时自动恢复');
  };

  const forOptions = ['我自己', '父亲', '母亲', '配偶', '子女', '孙辈', '其他家人'];
  const genderOptions = ['男', '女', '其他 / 不填写'];
  const ageGroups = ['婴幼儿', '儿童', '少年', '青年', '中年', '老年'];

  /** 身份标签预设（不含「其他」） */
  const IDENTITY_PRESETS = [
    '学生', '教师', '工人', '医务人员', '公务人员',
    '农民', '创业者', '家庭主妇', '退休人员',
  ] as const;
  const IDENTITY_OTHER_LABEL = '其他（Other）';

  const isPresetIdentity = useCallback(
    (t: string) => (IDENTITY_PRESETS as readonly string[]).includes(t),
    [],
  );

  /** 草稿里若是自定义/多选，视为「其他」模式以便展示输入框 */
  const [identityOtherMode, setIdentityOtherMode] = useState(() => {
    const tags = memoirData.basicInfo.identityTags;
    if (!tags.length) return false;
    if (tags.length > 1) return true;
    return !isPresetIdentity(tags[0]);
  });

  /** 选中预设：单选，identityTags 存一项 */
  const selectIdentityPreset = (tag: string) => {
    setIdentityOtherMode(false);
    setFormData(prev => ({ ...prev, identityTags: [tag] }));
  };

  /** 选中「其他」：先清空标签，由下方输入框写入 */
  const selectIdentityOther = () => {
    setIdentityOtherMode(true);
    setFormData(prev => ({ ...prev, identityTags: [] }));
  };

  /** 自定义身份：写入 identityTags 为单元素数组，供本地生成与提交使用 */
  const setIdentityCustom = (raw: string) => {
    const v = raw.trim();
    setIdentityOtherMode(true);
    setFormData(prev => ({ ...prev, identityTags: v ? [v] : [] }));
  };

  const otherInputValue =
    formData.identityTags.length === 0
      ? ''
      : formData.identityTags.length === 1 && !isPresetIdentity(formData.identityTags[0])
        ? formData.identityTags[0]
        : formData.identityTags.join('、');

  const showIdentityOtherInput =
    identityOtherMode ||
    formData.identityTags.length > 1 ||
    (formData.identityTags.length === 1 && !isPresetIdentity(formData.identityTags[0]));

  useEffect(() => {
    const tags = formData.identityTags;
    if (tags.length === 1 && isPresetIdentity(tags[0])) {
      setIdentityOtherMode(false);
    }
  }, [formData.identityTags, isPresetIdentity]);

  const tagBase =
    'py-3 px-3 rounded-xl border-2 transition-all text-sm sm:text-base text-center cursor-pointer min-h-[48px] flex items-center justify-center';
  const tagActive = 'border-[#A67C52] bg-[#FAF8F3] text-[#4A3F35] shadow-md';
  const tagInactive = 'border-[#E8DCC8] text-[#8B7E74] hover:border-[#D4BFA0] bg-white';

  // 保存状态指示图标
  const SaveIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="flex items-center gap-1 text-[#A67C52] text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          正在保存…
        </span>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <Check className="w-3 h-3" />
          已自动保存
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'linear-gradient(to bottom, #FAF8F3, #FFFEF8)' }}
    >
      <div className="max-w-2xl mx-auto">

        {/* 页面标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-5">
            <div className="w-10 h-px bg-[#A67C52] opacity-40" />
            <div className="mx-3 w-1.5 h-1.5 rounded-full bg-[#A67C52] opacity-40" />
            <div className="w-10 h-px bg-[#A67C52] opacity-40" />
          </div>

          <h1 className="text-[#4A3F35] mb-3">先填写一些基本信息</h1>
          <p className="text-[#8B7E74] leading-relaxed px-2">
            这些信息将帮助系统更准确地整理您的回忆录文案和照片建议。
          </p>
          <p className="text-[#B8866B] text-sm mt-2 px-2">
            若暂时不想填写，可以跳过，系统仍会根据已有信息生成文案。
          </p>
        </motion.div>

        {/* 表单 */}
        <motion.div
          className="bg-white rounded-2xl p-5 sm:p-8 shadow-xl border border-[#E8DCC8]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* 自动保存状态 */}
          <div className="flex justify-end mb-4 min-h-[20px]">
            <SaveIndicator />
          </div>

          <div className="space-y-7">

            {/* 这篇回忆录是写给谁的 */}
            <div>
              <Label className="text-[#4A3F35] mb-3 block">
                这篇回忆录是写给谁的？
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {forOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, for: option })}
                    className={`${tagBase} ${formData.for === option ? tagActive : tagInactive}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* 姓名 */}
            <div>
              <Label htmlFor="name" className="text-[#4A3F35] mb-2 block">
                姓名
              </Label>
              <Input
                id="name"
                placeholder="请输入您的姓名"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="h-13 border-[#E8DCC8] focus:border-[#A67C52] bg-white"
              />
            </div>

            {/* 性别 */}
            <div>
              <Label className="text-[#4A3F35] mb-3 block">
                性别（可选）
              </Label>
              <div className="flex gap-2.5">
                {genderOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, gender: option })}
                    className={`flex-1 ${tagBase} ${formData.gender === option ? tagActive : tagInactive}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* 出生年份 */}
            <div>
              <Label htmlFor="birthYear" className="text-[#4A3F35] mb-2 block">
                出生年份
              </Label>
              <Input
                id="birthYear"
                placeholder="例如：1958"
                value={formData.birthYear}
                onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                className="h-13 border-[#E8DCC8] focus:border-[#A67C52] bg-white"
              />
            </div>

            {/* 出生地 */}
            <div>
              <Label htmlFor="birthPlace" className="text-[#4A3F35] mb-2 block">
                出生地
              </Label>
              <Input
                id="birthPlace"
                placeholder="例如：江苏苏州"
                value={formData.birthPlace}
                onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                className="h-13 border-[#E8DCC8] focus:border-[#A67C52] bg-white"
              />
            </div>

            {/* 成长地 */}
            <div>
              <Label htmlFor="growUpPlace" className="text-[#4A3F35] mb-2 block">
                成长地
              </Label>
              <Input
                id="growUpPlace"
                placeholder="例如：大连、沈阳、上海等"
                value={formData.growUpPlace}
                onChange={e => setFormData({ ...formData, growUpPlace: e.target.value })}
                className="h-13 border-[#E8DCC8] focus:border-[#A67C52] bg-white"
              />
            </div>

            {/* 当前年龄段 */}
            <div>
              <Label className="text-[#4A3F35] mb-3 block">
                当前年龄或年龄段
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {ageGroups.map(option => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, ageGroup: option })}
                    className={`${tagBase} ${formData.ageGroup === option ? tagActive : tagInactive}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* 身份标签（单选 + 其他自定义） */}
            <div>
              <Label className="text-[#4A3F35] mb-3 block">
                身份标签（单选）
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {IDENTITY_PRESETS.map(option => {
                  const selected =
                    formData.identityTags.length === 1 &&
                    formData.identityTags[0] === option &&
                    !identityOtherMode;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectIdentityPreset(option)}
                      className={`${tagBase} ${selected ? tagActive : tagInactive}`}
                    >
                      {option}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={selectIdentityOther}
                  className={`${tagBase} ${
                    identityOtherMode ||
                    (formData.identityTags.length > 0 &&
                      !(
                        formData.identityTags.length === 1 &&
                        isPresetIdentity(formData.identityTags[0])
                      ))
                      ? tagActive
                      : tagInactive
                  }`}
                >
                  {IDENTITY_OTHER_LABEL}
                </button>
              </div>
              {showIdentityOtherInput && (
                <div className="mt-3">
                  <Input
                    id="identity-other"
                    placeholder="请输入您的身份标签（如：手艺人、老教师等）"
                    value={otherInputValue}
                    onChange={e => setIdentityCustom(e.target.value)}
                    className="h-13 border-[#E8DCC8] focus:border-[#A67C52] bg-white"
                  />
                </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* 底部按钮 */}
        <motion.div
          className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-stretch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/welcome')}
            className={cn(memoirOutline, 'flex items-center justify-center gap-2 shrink-0 sm:flex-initial')}
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            上一步
          </Button>

          <Button
            onClick={handleSubmit}
            className={cn(memoirPrimary, 'flex items-center justify-center gap-2 px-8 shrink-0 sm:flex-initial')}
          >
            下一步
            <ArrowRight className="w-5 h-5 shrink-0" />
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            className={cn(memoirOutlineMuted, 'flex items-center justify-center gap-2 shrink-0 sm:flex-initial')}
          >
            <SkipForward className="w-5 h-5 shrink-0" />
            跳过此页
          </Button>

          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className={cn(memoirOutline, 'flex items-center justify-center gap-2 shrink-0 sm:flex-initial')}
          >
            <Save className="w-5 h-5 shrink-0" />
            保存草稿
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
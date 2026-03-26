import React, {
  createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback,
} from 'react';

// ─── 类型定义 ──────────────────────────────────────────────────────────────

export interface BasicInfo {
  for: string;
  name: string;
  gender: string;
  birthYear: string;
  birthPlace: string;
  growUpPlace: string;
  ageGroup: string;
  identityTags: string[];
}

export interface LifeStage {
  id: string;
  title: string;
  content: string;
  skipped: boolean;
}

/** 导演分镜单章（本地生成仅含旁白，不含画面字段） */
export interface DirectorChapter {
  chapter_name: string;
  voice_over: string;
}

export interface DirectorScriptPayload {
  title: string;
  chapters: DirectorChapter[];
}

/** 人生五阶段问卷（与后端 API 字段一致；含必答与选填「自由补充」） */
export interface LifeFivePartAnswers {
  q_childhood_sense: string;
  q_early_dream: string;
  q_extra_childhood: string;
  q_youth_item: string;
  q_first_achievement: string;
  /** 选填：恋爱与婚姻 */
  q_love_marriage: string;
  q_extra_youth: string;
  q_hardest_moment: string;
  q_career_peak: string;
  /** 选填：生子与育儿 */
  q_children: string;
  q_extra_adult: string;
  q_legacy: string;
  q_extra_middle_age: string;
  q_final_message: string;
}

export type LifeFivePartKey = keyof LifeFivePartAnswers;

export type MemoirSubmissionPayload = {
  basicInfo: BasicInfo;
  lifeFiveAnswers: LifeFivePartAnswers;
};

export interface MemoirData {
  basicInfo: BasicInfo;
  lifeStages: LifeStage[];
  lifeFiveAnswers: LifeFivePartAnswers;
  generatedScript: string;
  directorScript: DirectorScriptPayload | null;
  photoSuggestions: any;
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface MemoirContextType {
  memoirData: MemoirData;
  saveStatus: SaveStatus;
  hasDraft: boolean;
  updateBasicInfo: (info: Partial<BasicInfo>) => void;
  updateLifeStage: (id: string, content: string, skipped?: boolean) => void;
  updateLifeFiveAnswer: (key: LifeFivePartKey, value: string) => void;
  setLifeFiveAnswers: (partial: Partial<LifeFivePartAnswers>) => void;
  getSubmissionPayload: () => MemoirSubmissionPayload;
  setGeneratedScript: (script: string) => void;
  setDirectorScript: (payload: DirectorScriptPayload | null) => void;
  setPhotoSuggestions: (suggestions: any) => void;
  saveDraft: () => void;
  clearDraft: () => void;
}

// ─── 初始数据 ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'memoir_draft_v2';

const initialBasicInfo: BasicInfo = {
  for: '我自己',
  name: '',
  gender: '',
  birthYear: '',
  birthPlace: '',
  growUpPlace: '',
  ageGroup: '',
  identityTags: [],
};

const initialLifeStages: LifeStage[] = [
  { id: 'impression',  title: '基本印象',              content: '', skipped: false },
  { id: 'childhood',  title: '婴幼儿 / 童年',          content: '', skipped: false },
  { id: 'primary',    title: '小学 / 少年',             content: '', skipped: false },
  { id: 'youth',      title: '青春 / 求学',             content: '', skipped: false },
  { id: 'society',    title: '初入社会',                content: '', skipped: false },
  { id: 'career',     title: '工作与事业',              content: '', skipped: false },
  { id: 'marriage',   title: '婚姻与家庭',              content: '', skipped: false },
  { id: 'children',   title: '子女成长 / 家庭责任',     content: '', skipped: false },
  { id: 'turning',    title: '人生转折 / 困难',          content: '', skipped: false },
  { id: 'achievement',title: '成就 / 荣誉 / 高光时刻', content: '', skipped: false },
  { id: 'recent',     title: '近年生活 / 当前状态',     content: '', skipped: false },
  { id: 'message',    title: '想对家人说的话 / 人生感悟', content: '', skipped: false },
];

const initialLifeFiveAnswers: LifeFivePartAnswers = {
  q_childhood_sense: '',
  q_early_dream: '',
  q_extra_childhood: '',
  q_youth_item: '',
  q_first_achievement: '',
  q_love_marriage: '',
  q_extra_youth: '',
  q_hardest_moment: '',
  q_career_peak: '',
  q_children: '',
  q_extra_adult: '',
  q_legacy: '',
  q_extra_middle_age: '',
  q_final_message: '',
};

const initialMemoirData: MemoirData = {
  basicInfo: initialBasicInfo,
  lifeStages: initialLifeStages,
  lifeFiveAnswers: initialLifeFiveAnswers,
  generatedScript: '',
  directorScript: null,
  photoSuggestions: null,
};

// ─── 从 localStorage 加载草稿 ────────────────────────────────────────────────

function loadDraft(): MemoirData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialMemoirData;
    const saved = JSON.parse(raw) as Partial<MemoirData>;

    const mergedFive: LifeFivePartAnswers = { ...initialLifeFiveAnswers };
    const savedFive = saved.lifeFiveAnswers;
    if (savedFive && typeof savedFive === 'object') {
      for (const key of Object.keys(initialLifeFiveAnswers) as (keyof LifeFivePartAnswers)[]) {
        const v = savedFive[key];
        if (typeof v === 'string') mergedFive[key] = v;
      }
    }

    return {
      basicInfo: { ...initialBasicInfo, ...(saved.basicInfo || {}) },
      lifeStages: initialLifeStages.map(stage => {
        const savedStage = (saved.lifeStages || []).find(s => s.id === stage.id);
        return savedStage ? { ...stage, ...savedStage } : stage;
      }),
      lifeFiveAnswers: mergedFive,
      generatedScript: saved.generatedScript || '',
      directorScript: saved.directorScript ?? null,
      photoSuggestions: saved.photoSuggestions || null,
    };
  } catch {
    return initialMemoirData;
  }
}

function hasSavedDraft(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as Partial<MemoirData>;
    const info = saved.basicInfo || {};
    const stages = saved.lifeStages || [];
    const hasInfo = Object.values(info).some(v =>
      Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '' && v !== '我自己',
    );
    const hasStage = stages.some(s => s.content && s.content.trim());
    const five = saved.lifeFiveAnswers as Partial<LifeFivePartAnswers> | undefined;
    const hasFive =
      five &&
      Object.values(five).some(v => typeof v === 'string' && v.trim() !== '');
    return hasInfo || hasStage || !!hasFive;
  } catch {
    return false;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const MemoirContext = createContext<MemoirContextType | undefined>(undefined);

export const MemoirProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memoirData, setMemoirData] = useState<MemoirData>(() => loadDraft());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hasDraft] = useState<boolean>(() => hasSavedDraft());
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoirData));
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [memoirData]);

  const updateBasicInfo = useCallback((info: Partial<BasicInfo>) => {
    setMemoirData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...info },
    }));
  }, []);

  const updateLifeStage = useCallback(
    (id: string, content: string, skipped: boolean = false) => {
      setMemoirData(prev => ({
        ...prev,
        lifeStages: prev.lifeStages.map(stage =>
          stage.id === id ? { ...stage, content, skipped } : stage,
        ),
      }));
    },
    [],
  );

  const updateLifeFiveAnswer = useCallback((key: LifeFivePartKey, value: string) => {
    setMemoirData(prev => ({
      ...prev,
      lifeFiveAnswers: { ...prev.lifeFiveAnswers, [key]: value },
    }));
  }, []);

  const setLifeFiveAnswers = useCallback((partial: Partial<LifeFivePartAnswers>) => {
    setMemoirData(prev => ({
      ...prev,
      lifeFiveAnswers: { ...prev.lifeFiveAnswers, ...partial },
    }));
  }, []);

  const getSubmissionPayload = useCallback((): MemoirSubmissionPayload => {
    const { basicInfo, lifeFiveAnswers } = memoirData;
    return { basicInfo, lifeFiveAnswers };
  }, [memoirData]);

  const setGeneratedScript = useCallback((script: string) => {
    setMemoirData(prev => ({ ...prev, generatedScript: script }));
  }, []);

  const setDirectorScript = useCallback((payload: DirectorScriptPayload | null) => {
    setMemoirData(prev => ({ ...prev, directorScript: payload }));
  }, []);

  const setPhotoSuggestions = useCallback((suggestions: any) => {
    setMemoirData(prev => ({ ...prev, photoSuggestions: suggestions }));
  }, []);

  const saveDraft = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoirData));
      setTimeout(() => setSaveStatus('saved'), 400);
    } catch {
      setSaveStatus('idle');
    }
  }, [memoirData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMemoirData(initialMemoirData);
    setSaveStatus('idle');
  }, []);

  return (
    <MemoirContext.Provider
      value={{
        memoirData,
        saveStatus,
        hasDraft,
        updateBasicInfo,
        updateLifeStage,
        updateLifeFiveAnswer,
        setLifeFiveAnswers,
        getSubmissionPayload,
        setGeneratedScript,
        setDirectorScript,
        setPhotoSuggestions,
        saveDraft,
        clearDraft,
      }}
    >
      {children}
    </MemoirContext.Provider>
  );
};

export const useMemoir = () => {
  const context = useContext(MemoirContext);
  if (context === undefined) {
    throw new Error('useMemoir must be used within a MemoirProvider');
  }
  return context;
};

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMemoir } from '../context/MemoirContext';
import { runMemoirGeneration } from '../utils/memoirGeneration';
import BookGeneratingOverlay from '../components/BookGeneratingOverlay';
import { useScrollToTop } from '../hooks/useScrollToTop';

/**
 * 兼容直接访问 /generating（书签或旧链接）：全屏翻书 + 本地模板生成后跳转结果页。
 */
export default function GeneratingPage() {
  const navigate = useNavigate();
  const {
    memoirData,
    setGeneratedScript,
    setDirectorScript,
    setPhotoSuggestions,
  } = useMemoir();
  useScrollToTop();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await runMemoirGeneration({
        memoirData,
        setPhotoSuggestions,
        setDirectorScript,
        setGeneratedScript,
      });
      if (!cancelled) navigate('/result');
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 进入本页时用当前问卷快照生成一次
  }, []);

  return <BookGeneratingOverlay />;
}

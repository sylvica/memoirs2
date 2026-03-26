import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, RefreshCw, CheckCircle, Plus, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { memoirPrimary, memoirOutline, memoirOutlineMuted } from '../styles/memoirButtons';

interface VoiceRecorderProps {
  onTranscriptComplete: (text: string) => void;
}

type RecordingState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'done'
  | 'error'
  | 'unsupported';

export default function VoiceRecorder({ onTranscriptComplete }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef      = useRef<any>(null);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  /**
   * shouldRestartRef: 控制"重启循环"开关。
   * - 用户点"开始录音" → true
   * - 用户点"停止"或发生真实错误 → false
   * 安卓：停顿易触发 onend，为 true 时在 onend 里自动再 start。苹果/电脑主要靠 continuous=true，onend 较少但仍统一走同一套收尾逻辑。
   */
  const shouldRestartRef    = useRef(false);
  /**
   * finalTranscriptRef: 跨会话累积识别文字的真实值。
   * 用 ref 而非仅依赖 state，是为了避免 onend/onresult 闭包
   * 里读到过期的 state 快照。
   */
  const finalTranscriptRef  = useRef('');
  /** 当前段尚未 isFinal 的临时字（停止时若没来得及 final，必须并入 final，否则会显示「未识别到」） */
  const interimTranscriptRef = useRef('');
  /** 本段 recognition 内 event.results 全量拼接（安卓上 isFinal/interim 不可靠时作兜底） */
  const sessionFullTextRef = useRef('');
  /** 供 onend 调用，在 onend 里自动续下一段识别 */
  const startSessionRef     = useRef<() => void>(() => {});
  /** 停止后若浏览器未触发 onend，避免一直卡在「正在转写」 */
  const processingFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 苹果（iPhone/iPad/Mac Safari）与电脑浏览器：用 continuous=true，一段会话里持续识别，少触发 onend。
   * 安卓 Chrome：continuous 不可靠，用 false + onend 里自动再 start 接成「连续听写」。
   */
  const isAndroidSpeech = useMemo(
    () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent),
    []
  );

  // ── 检测浏览器支持 ────────────────────────────────────────────
  useEffect(() => {
    // 苹果系浏览器使用 webkit 前缀，优先取 webkit 再取标准名
    const API =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!API) setRecordingState('unsupported');
  }, []);

  // ── 工具 ──────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── 核心：创建并启动一次识别会话（仅应由按钮 onClick 调用，内部才会 recognition.start）──
  const startSession = useCallback(() => {
    const API =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!API) return;

    try {
      sessionFullTextRef.current = '';
      const recognition = new API();
      recognition.lang            = 'zh-CN';
      recognition.continuous      = !isAndroidSpeech;
      recognition.interimResults  = true;
      recognition.maxAlternatives = 1;

      // 会话启动
      recognition.onstart = () => {
        setRecordingState('recording');
        // 只在第一次会话启动计时器，重启时不重置
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);
        }
      };

      // 识别结果
      recognition.onresult = (event: any) => {
        let interim = '';
        let sessionFull = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionFull += event.results[i][0].transcript;
        }
        sessionFullTextRef.current = sessionFull;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += text;
            setFinalTranscript(finalTranscriptRef.current);
          } else {
            interim += text;
          }
        }
        interimTranscriptRef.current = interim;
        setInterimTranscript(interim);
      };

      // 会话结束（安卓上停顿易触发；苹果/电脑 continuous 时多在点「停止」或出错时触发）
      recognition.onend = () => {
        if (processingFallbackRef.current) {
          clearTimeout(processingFallbackRef.current);
          processingFallbackRef.current = null;
        }
        // 停止瞬间最后一句往往仍是 interim，不会进 isFinal，必须并入 final 否则会空白
        const tail = interimTranscriptRef.current.trim();
        if (tail) {
          finalTranscriptRef.current += tail;
          setFinalTranscript(finalTranscriptRef.current);
        } else if (!finalTranscriptRef.current.trim() && sessionFullTextRef.current.trim()) {
          finalTranscriptRef.current = sessionFullTextRef.current.trim();
          setFinalTranscript(finalTranscriptRef.current);
        }
        interimTranscriptRef.current = '';
        sessionFullTextRef.current = '';
        setInterimTranscript('');
        if (shouldRestartRef.current) {
          startSessionRef.current();
        } else {
          clearTimer();
          setRecordingState(prev =>
            prev === 'recording' || prev === 'processing' ? 'done' : prev
          );
        }
      };

      // 错误处理
      recognition.onerror = (event: any) => {
        // 手动中止：正常操作，直接忽略
        if (event.error === 'aborted') return;

        /**
         * ★ 关键修复 ③
         * no-speech：Android 超时后极常见，不是真实错误。
         * 只要还在录音中，就让 onend 去处理重启，不展示报错。
         */
        if (event.error === 'no-speech') return;

        // 真实错误：关闭重启循环，展示提示
        shouldRestartRef.current = false;
        clearTimer();
        setInterimTranscript('');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('未获得麦克风权限，请在浏览器设置中允许使用麦克风。');
          window.alert(
            '麦克风权限被拒绝：请在浏览器或系统设置中允许本站使用麦克风，然后点击重试。'
          );
        } else if (event.error === 'network') {
          setErrorMessage('网络连接异常，语音识别需要联网，请检查后重试。');
        } else {
          setErrorMessage(`语音识别出现问题（${event.error}），请重试。`);
        }
        setRecordingState('error');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      shouldRestartRef.current = false;
      clearTimer();
      setErrorMessage('启动录音失败，请检查麦克风是否正常。');
      setRecordingState('error');
      window.alert('无法启动语音识别，请确认已允许麦克风权限后重试。');
    }
  }, [clearTimer, isAndroidSpeech]);

  useEffect(() => {
    startSessionRef.current = startSession;
  }, [startSession]);

  // ── 对外操作 ──────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (processingFallbackRef.current) {
      clearTimeout(processingFallbackRef.current);
      processingFallbackRef.current = null;
    }
    shouldRestartRef.current  = true;
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    sessionFullTextRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setErrorMessage('');
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch {
      setErrorMessage('需要麦克风权限才能使用语音输入，请在浏览器中允许访问麦克风。');
      setRecordingState('error');
      shouldRestartRef.current = false;
      return;
    }
    startSession();
  }, [startSession]);

  const stopRecording = useCallback(() => {
    // ★ 先关闭重启开关，再 stop，否则 onend 又会重启
    shouldRestartRef.current = false;
    if (processingFallbackRef.current) {
      clearTimeout(processingFallbackRef.current);
      processingFallbackRef.current = null;
    }
    setRecordingState('processing');
    processingFallbackRef.current = setTimeout(() => {
      processingFallbackRef.current = null;
      setRecordingState(prev => {
        if (prev !== 'processing') return prev;
        const tail = interimTranscriptRef.current.trim();
        if (tail) {
          finalTranscriptRef.current += tail;
          setFinalTranscript(finalTranscriptRef.current);
        } else if (!finalTranscriptRef.current.trim() && sessionFullTextRef.current.trim()) {
          finalTranscriptRef.current = sessionFullTextRef.current.trim();
          setFinalTranscript(finalTranscriptRef.current);
        }
        interimTranscriptRef.current = '';
        sessionFullTextRef.current = '';
        setInterimTranscript('');
        clearTimer();
        return 'done';
      });
    }, 4000);
    recognitionRef.current?.stop();
  }, [clearTimer]);

  const confirmTranscript = useCallback(() => {
    const text = finalTranscriptRef.current.trim();
    if (text) onTranscriptComplete(text);
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setRecordingState('idle');
  }, [onTranscriptComplete]);

  const appendMore = useCallback(() => {
    /**
     * ★ 关键修复 ④
     * 原来用 setTimeout(startRecording, 150)，在 Android 上
     * 超出用户手势上下文，麦克风权限会被拒。
     * 现在直接同步调用 startSession，保留手势上下文。
     * finalTranscriptRef 不清零，内容会继续累积。
     */
    shouldRestartRef.current = true;
    setInterimTranscript('');
    setErrorMessage('');
    setRecordingState('recording');
    startSession();
  }, [startSession]);

  const resetAll = useCallback(() => {
    shouldRestartRef.current = false;
    if (processingFallbackRef.current) {
      clearTimeout(processingFallbackRef.current);
      processingFallbackRef.current = null;
    }
    interimTranscriptRef.current = '';
    sessionFullTextRef.current = '';
    clearTimer();
    recognitionRef.current?.abort();
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setErrorMessage('');
    setRecordingState('idle');
  }, [clearTimer]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── 不支持 ─────────────────────────────────────────────────────
  if (recordingState === 'unsupported') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 text-sm leading-relaxed">
            您的浏览器暂不支持语音识别功能（建议使用 Chrome 或 Edge 浏览器）。
          </p>
          <p className="text-amber-600 text-xs mt-1">请直接在下方文本框手动填写您的故事。</p>
        </div>
      </div>
    );
  }

  // ── 渲染 ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* 主操作区 */}
      <div className="flex flex-wrap items-center gap-3">

        {/* 空闲：开始录音 */}
        {recordingState === 'idle' && (
          <Button
            onClick={startRecording}
            className={cn(memoirPrimary, 'px-5 flex items-center gap-2 shadow-md')}
          >
            <Mic className="w-5 h-5 flex-shrink-0" />
            <span>开始录音</span>
          </Button>
        )}

        {/* 录音中：停止 + 计时 + 重录 */}
        {recordingState === 'recording' && (
          <>
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl shadow-md
                         flex items-center gap-2 min-h-[52px] shrink-0"
            >
              <Square className="w-5 h-5 flex-shrink-0" />
              <span>停止录音</span>
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-700 font-mono text-sm font-medium">
                {formatDuration(duration)}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={resetAll}
              className={cn(memoirOutlineMuted, 'px-4 shrink-0')}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              重录
            </Button>
          </>
        )}

        {/* 转写中 */}
        {recordingState === 'processing' && (
          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-blue-700 text-sm font-medium">正在转写，请稍候…</span>
          </div>
        )}

        {/* 转写完成：确认 + 继续补充 + 重录 */}
        {recordingState === 'done' && (
          <>
            {finalTranscript && (
              <Button
                onClick={confirmTranscript}
                className={cn(memoirPrimary, 'px-5 flex items-center gap-2 shadow-md shrink-0')}
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                确认填入
              </Button>
            )}
            <Button
              onClick={appendMore}
              variant="outline"
              className={cn(memoirOutline, 'px-4 flex items-center gap-2 shrink-0')}
            >
              <Plus className="w-4 h-4" />
              继续补充
            </Button>
            <Button
              variant="outline"
              onClick={resetAll}
              className={cn(memoirOutlineMuted, 'px-4 flex items-center gap-2 shrink-0')}
            >
              <RefreshCw className="w-4 h-4" />
              重新录音
            </Button>
          </>
        )}

        {/* 出错：重试 */}
        {recordingState === 'error' && (
          <Button
            variant="outline"
            onClick={resetAll}
            className={cn(memoirOutlineMuted, 'px-5 flex items-center gap-2 shrink-0')}
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
        )}
      </div>

      {/* 状态反馈区 */}
      <AnimatePresence mode="wait">

        {/* 录音中波形 */}
        {recordingState === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
          >
            <div className="flex items-center gap-[3px] flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{ height: ['6px', '22px', '6px'] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <div>
              <p className="text-red-700 font-medium text-sm">正在录音，请慢慢说</p>
              {interimTranscript && (
                <p className="text-red-500 text-xs mt-0.5 italic opacity-80">{interimTranscript}</p>
              )}
              {finalTranscript && !interimTranscript && (
                <p className="text-red-400 text-xs mt-0.5 opacity-70 line-clamp-1">
                  已识别：{finalTranscript}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* 转写完成：预览文字 */}
        {recordingState === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-medium text-sm">转写完成</p>
            </div>
            {finalTranscript ? (
              <p className="text-green-800 text-sm leading-relaxed bg-white/60 rounded-lg p-3 border border-green-100">
                {finalTranscript}
              </p>
            ) : (
              <p className="text-green-600 text-sm italic">未识别到语音内容，请重新录音或手动填写。</p>
            )}
          </motion.div>
        )}

        {/* 错误提示 */}
        {recordingState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm leading-relaxed">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

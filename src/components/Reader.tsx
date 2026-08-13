import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Volume2, Copy, Check, ChevronRight, Download, Eye, Share2, Zap, Play, Pause, RotateCcw, X, Sliders, MoveVertical, ChevronsDown, Minus, Plus, SlidersHorizontal, StickyNote, Trash2, Save, FileText } from 'lucide-react';
import { cn, processBionicText } from '../lib/utils';
import { ReadingProfile } from '../types';

interface ReaderProps {
  text: string;
  profile: ReadingProfile;
  isAutoScrolling?: boolean;
  setIsAutoScrolling?: (val: boolean) => void;
  autoScrollWpm?: number;
  setAutoScrollWpm?: (val: number) => void;
}

export default function Reader({ 
  text, 
  profile,
  isAutoScrolling: propIsAutoScrolling,
  setIsAutoScrolling: propSetIsAutoScrolling,
  autoScrollWpm: propAutoScrollWpm,
  setAutoScrollWpm: propSetAutoScrollWpm,
}: ReaderProps) {
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [focusGuideEnabled, setFocusGuideEnabled] = useState(true);
  const [rulerEnabled, setRulerEnabled] = useState(false);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visibleParagraphCount, setVisibleParagraphCount] = useState(20);
  const [readingProgress, setReadingProgress] = useState(0);

  // Auto-scroll local fallback state & popover toggle
  const [localAutoScrolling, setLocalAutoScrolling] = useState(false);
  const [localAutoScrollWpm, setLocalAutoScrollWpm] = useState(220);
  const [showAutoScrollSettings, setShowAutoScrollSettings] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const isAutoScrolling = propIsAutoScrolling ?? localAutoScrolling;
  const setIsAutoScrolling = propSetIsAutoScrolling ?? setLocalAutoScrolling;
  const autoScrollWpm = propAutoScrollWpm ?? localAutoScrollWpm;
  const setAutoScrollWpm = propSetAutoScrollWpm ?? setLocalAutoScrollWpm;

  const dockConstraintsRef = useRef<HTMLDivElement>(null);

  // Quick Note state & persistence
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState(() => {
    const sessionKey = text.trim().slice(0, 40) || 'default';
    return localStorage.getItem(`neurolens-note-${sessionKey}`) || '';
  });
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteCopied, setNoteCopied] = useState(false);

  useEffect(() => {
    const sessionKey = text.trim().slice(0, 40) || 'default';
    setQuickNoteText(localStorage.getItem(`neurolens-note-${sessionKey}`) || '');
  }, [text]);

  useEffect(() => {
    const sessionKey = text.trim().slice(0, 40) || 'default';
    setIsSavingNote(true);
    const timer = setTimeout(() => {
      localStorage.setItem(`neurolens-note-${sessionKey}`, quickNoteText);
      setIsSavingNote(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [quickNoteText, text]);

  // RSVP (Rapid Serial Visual Presentation) Speed Reader state
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isRsvpPlaying, setIsRsvpPlaying] = useState(false);
  const [rsvpWpm, setRsvpWpm] = useState(300);
  const [rsvpIndex, setRsvpIndex] = useState(0);

  const speechQueueRef = useRef<string[]>([]);
  const speechIndexRef = useRef(0);

  // All words for RSVP Speed Reading & Auto-scroll calculations
  const words = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean);
  }, [text]);

  // Smooth Auto-scroll animation loop
  useEffect(() => {
    if (!isAutoScrolling) return;

    const scrollContainer = document.querySelector('main .overflow-y-auto') as HTMLElement;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollStep = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      const totalWords = words.length || 1;
      const scrollablePixels = scrollContainer.scrollHeight - scrollContainer.clientHeight;

      if (scrollablePixels > 0) {
        const pixelsPerWord = scrollablePixels / totalWords;
        const wordsPerSecond = autoScrollWpm / 60;
        const distance = pixelsPerWord * wordsPerSecond * deltaTime;

        scrollContainer.scrollTop += distance;

        if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 4) {
          setIsAutoScrolling(false);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, autoScrollWpm, words.length, setIsAutoScrolling]);

  useEffect(() => {
    if (!isRsvpPlaying || words.length === 0) return;

    const intervalMs = (60 / rsvpWpm) * 1000;
    const timer = setInterval(() => {
      setRsvpIndex((prev) => {
        if (prev >= words.length - 1) {
          setIsRsvpPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRsvpPlaying, rsvpWpm, words.length]);

  // Keyboard shortcut listener for RSVP modal
  useEffect(() => {
    if (!isRsvpOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRsvpPlaying((prev) => !prev);
      } else if (e.code === 'Escape') {
        setIsRsvpOpen(false);
        setIsRsvpPlaying(false);
      } else if (e.code === 'ArrowLeft') {
        setRsvpIndex((prev) => Math.max(0, prev - 10));
      } else if (e.code === 'ArrowRight') {
        setRsvpIndex((prev) => Math.min(words.length - 1, prev + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRsvpOpen, words.length]);

  const currentRsvpWordFormatted = useMemo(() => {
    const word = words[rsvpIndex] || '';
    if (!word) return { prefix: '', fix: '', suffix: '' };
    const len = word.length;
    const fixIndex = Math.max(0, Math.floor((len - 1) / 3));
    return {
      prefix: word.slice(0, fixIndex),
      fix: word[fixIndex] || '',
      suffix: word.slice(fixIndex + 1),
    };
  }, [words, rsvpIndex]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split text into paragraphs
  const paragraphs = useMemo(() => {
    return text.split(/\n\s*\n/).filter(p => p.trim() !== '');
  }, [text]);

  const allLines = useMemo(() => {
    const list: { text: string; lineIdx: number }[] = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const parts = paragraph.split(/([.!?]\s+)/);
      for (let index = 0; index < parts.length; index += 2) {
        const sentence = parts[index];
        if (!sentence?.trim()) continue;
        const fullSentence = (sentence + (parts[index + 1] || '')).trim();
        if (fullSentence) {
          list.push({
            text: fullSentence,
            lineIdx: paragraphIndex * 100 + index / 2,
          });
        }
      }
    });
    return list;
  }, [paragraphs]);

  const speakLineAt = (index: number) => {
    if (!('speechSynthesis' in window)) return;
    if (index < 0 || index >= allLines.length) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveLine(null);
      return;
    }

    const currentItem = allLines[index];
    speechIndexRef.current = index;
    setActiveLine(currentItem.lineIdx);

    // Auto-scroll the active spoken line into view smoothly
    setTimeout(() => {
      const elem = document.getElementById(`line-${currentItem.lineIdx}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    utterance.rate = 0.95;

    utterance.onend = () => {
      if (speechIndexRef.current === index) {
        speakLineAt(index + 1);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveLine(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveLine(null);
      return;
    }

    if (allLines.length === 0) return;

    let startIndex = 0;
    if (activeLine !== null) {
      const foundIdx = allLines.findIndex(l => l.lineIdx === activeLine);
      if (foundIdx !== -1) startIndex = foundIdx;
    }

    setIsSpeaking(true);
    speakLineAt(startIndex);
  };

  useEffect(() => () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const shareText = async () => {
    const shareData = {
      title: 'NeuroLens Reading Session',
      text: text.slice(0, 5000),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        return;
      }
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const processedParagraphs = text.split(/\n\s*\n/).map(paragraph =>
      processBionicText(paragraph, profile.bionicStrength, profile.rhythmOptimization)
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>NeuroLens Transmission</title>
        <style>
          body { 
            font-family: ${profile.fontFamily === 'font-serif' ? 'serif' : 'sans-serif'}; 
            line-height: ${profile.lineHeight}; 
            letter-spacing: ${profile.letterSpacing}em; 
            word-spacing: ${profile.wordSpacing}em;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #1a1a1a;
            background: #fdfdfd;
          }
          p { margin-bottom: 1.5em; font-size: ${profile.fontSize}px; }
          b { font-weight: 800; color: #000; }
        </style>
      </head>
      <body>
        ${processedParagraphs.map(p => `<p>${p}</p>`).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurolens-bionic-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    setVisibleParagraphCount(20);
    setActiveLine(null);
    setReadingProgress(0);
  }, [text]);

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (!scrollContainer) return;

    let ticking = false;
    let lastProgress = -1;

    const updateProgress = () => {
      const remaining = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const progress = remaining > 0 ? Math.round((scrollContainer.scrollTop / remaining) * 100) : 0;
      if (progress !== lastProgress) {
        lastProgress = progress;
        setReadingProgress(progress);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
    return () => scrollContainer.removeEventListener('scroll', onScroll);
  }, [text, visibleParagraphCount]);

  const renderedParagraphs = useMemo(() => paragraphs.slice(0, visibleParagraphCount).map((paragraph, paragraphIndex) => {
    const parts = paragraph.split(/([.!?]\s+)/);
    const lines: { html: string; lineIdx: number }[] = [];

    for (let index = 0; index < parts.length; index += 2) {
      const sentence = parts[index];
      if (!sentence?.trim()) continue;
      const fullSentence = sentence + (parts[index + 1] || '');
      lines.push({
        html: profile.bionicStrength > 0
          ? processBionicText(fullSentence, profile.bionicStrength, profile.rhythmOptimization)
          : fullSentence,
        lineIdx: paragraphIndex * 100 + index / 2,
      });
    }

    return lines;
  }), [paragraphs, visibleParagraphCount, profile.bionicStrength, profile.rhythmOptimization]);

  const handleLineClick = (lineIdx: number) => {
    if (isSpeaking) {
      const targetIndex = allLines.findIndex(l => l.lineIdx === lineIdx);
      if (targetIndex !== -1) {
        speakLineAt(targetIndex);
      } else {
        setActiveLine(lineIdx === activeLine ? null : lineIdx);
      }
    } else {
      setActiveLine(lineIdx === activeLine ? null : lineIdx);
    }
  };

  useEffect(() => {
    // Reset active line if focus mode is disabled
    if (!profile.focusHighlight) {
      setActiveLine(null);
    }
  }, [profile.focusHighlight]);

  return (
    <div
      onMouseMove={(e) => rulerEnabled && setMouseY(e.clientY)}
      className={cn(
        "max-w-4xl mx-auto px-4 sm:px-8 md:px-12 py-10 sm:py-16 md:py-20 pb-32 sm:pb-40 transition-all duration-300 min-h-full reader-paper relative",
        profile.fontFamily,
        focusGuideEnabled && activeLine !== null && "focus-highlight"
      )}
      style={{
        fontSize: `${profile.fontSize}px`,
        lineHeight: profile.lineHeight,
        letterSpacing: `${profile.letterSpacing}em`,
        wordSpacing: `${profile.wordSpacing}em`,
      }}
    >
      <svg className="reader-glass-definitions" aria-hidden="true" focusable="false">
        <filter id="glass-filter-_r_b_" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="24" result="surfaceNoise" />
          <feDisplacementMap in="SourceGraphic" in2="surfaceNoise" scale="12" xChannelSelector="R" yChannelSelector="G" result="distortedSurface" />
          <feGaussianBlur in="distortedSurface" stdDeviation="0.35" />
        </filter>
      </svg>

      {/* Scroll Progress Bar with Glowing Accent */}
      <div className="fixed top-24 sm:top-28 lg:top-16 left-0 right-0 h-1 bg-art-text/5 z-20 pointer-events-none">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" 
          animate={{ width: `${readingProgress}%` }}
          transition={{ ease: "easeOut", duration: 0.15 }}
        />
      </div>

      {/* Guided Focus Ruler Overlay */}
      {rulerEnabled && mouseY !== null && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {/* Top dim area */}
          <div 
            className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-[1px] transition-all duration-75"
            style={{ height: `${Math.max(0, mouseY - 32)}px` }}
          />
          {/* Highlighted Reading Slot */}
          <div 
            className="absolute left-0 right-0 border-y-2 border-blue-500/80 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-75"
            style={{ top: `${mouseY - 32}px`, height: '64px' }}
          />
          {/* Bottom dim area */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-[1px] transition-all duration-75"
            style={{ top: `${mouseY + 32}px` }}
          />
        </div>
      )}

      {/* Dimming Overlay for Unfocused Lines */}
      {focusGuideEnabled && activeLine !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-30 bg-gradient-to-b from-black/5 via-transparent to-black/5" 
        />
      )}

      {/* RSVP Speed Reader Modal */}
      <AnimatePresence>
        {isRsvpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-xl w-full text-center shadow-2xl relative border border-white/20">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-art-text/10">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <Zap size={16} />
                  <span>RSVP Speed Reader</span>
                </div>
                <button
                  onClick={() => { setIsRsvpOpen(false); setIsRsvpPlaying(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-art-secondary text-art-text/60 hover:text-art-text transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Word Display */}
              <div className="py-12 px-4 my-4 bg-art-secondary/50 rounded-2xl border border-art-text/5 flex items-center justify-center min-h-[160px]">
                {words.length > 0 ? (
                  <div className="text-4xl sm:text-6xl font-mono tracking-tight text-art-text">
                    <span>{currentRsvpWordFormatted.prefix}</span>
                    <span className="text-blue-600 font-black underline underline-offset-4 decoration-blue-500">{currentRsvpWordFormatted.fix}</span>
                    <span>{currentRsvpWordFormatted.suffix}</span>
                  </div>
                ) : (
                  <p className="text-art-text/40">No words found in text.</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setRsvpIndex(prev => Math.max(0, prev - 10))}
                  className="p-3 rounded-full hover:bg-art-secondary text-art-text/70 hover:text-art-text transition-colors cursor-pointer"
                  title="Rewind 10 words (Left Arrow)"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => setIsRsvpPlaying(!isRsvpPlaying)}
                  className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  {isRsvpPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                <button
                  onClick={() => setRsvpIndex(prev => Math.min(words.length - 1, prev + 10))}
                  className="p-3 rounded-full hover:bg-art-secondary text-art-text/70 hover:text-art-text transition-colors cursor-pointer rotate-180"
                  title="Forward 10 words (Right Arrow)"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* WPM & Progress */}
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs font-semibold text-art-text/60">
                  <span className="flex items-center gap-1.5"><Sliders size={14} /> Speed: {rsvpWpm} WPM</span>
                  <span>Word {rsvpIndex + 1} of {words.length} ({Math.round(((rsvpIndex + 1) / words.length) * 100)}%)</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={600}
                  step={25}
                  value={rsvpWpm}
                  onChange={(e) => setRsvpWpm(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-art-text/40 font-medium">Press <kbd className="px-1.5 py-0.5 bg-art-secondary rounded border border-art-text/10 text-art-text/70">Space</kbd> to play/pause, <kbd className="px-1.5 py-0.5 bg-art-secondary rounded border border-art-text/10 text-art-text/70">← / →</kbd> to jump 10 words</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading Header */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 sm:mb-16 md:mb-20 mt-2 sm:mt-6"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-art-text/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-4">
          <div className="w-8 h-px bg-art-text/20"></div>
          <span>Active Session</span>
          <span className="opacity-20">/</span>
          <span className="text-blue-600">NeuroLens Adaptive Format</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif italic leading-[1.12] text-art-text max-w-3xl tracking-tight">
          Active Reader Mode
        </h1>
      </motion.div>

      <div className="max-w-3xl space-y-8 sm:space-y-12 relative z-10">
        {renderedParagraphs.map((lines, paragraphIndex) => (
          <motion.div 
            key={paragraphIndex} 
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="reading-paragraph mb-8 sm:mb-12"
          >
            {lines.map(({ html, lineIdx }) => {
              const isActive = activeLine === lineIdx;

              return (
                <div
                  key={lineIdx}
                  id={`line-${lineIdx}`}
                  onClick={() => handleLineClick(lineIdx)}
                  className={cn(
                    "reading-line cursor-pointer px-2.5 py-1.5 transition-all duration-150 rounded-xl inline-block mr-1 my-0.5 hover:scale-[1.006]",
                    isActive
                      ? isSpeaking
                        ? "active bg-amber-300 text-slate-950 scale-[1.02] shadow-lg shadow-amber-500/25 ring-2 ring-amber-500 font-bold relative"
                        : "active bg-blue-100/90 text-slate-900 scale-[1.015] shadow-md ring-2 ring-blue-500/50 font-semibold"
                      : "hover:bg-art-secondary/60"
                  )}
                >
                  <span dangerouslySetInnerHTML={{ __html: html }} />
                  {isSpeaking && isActive && (
                    <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-bold tracking-wider uppercase align-middle shadow-xs">
                      <Volume2 size={12} className="animate-pulse" /> Reading
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        ))}

        {visibleParagraphCount < paragraphs.length && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setVisibleParagraphCount(count => Math.min(count + 20, paragraphs.length))}
            className="w-full py-4 text-sm font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 rounded-2xl transition-colors border border-blue-200/60 shadow-xs cursor-pointer"
          >
            Load more ({paragraphs.length - visibleParagraphCount} paragraphs remaining)
          </motion.button>
        )}
      </div>

      {/* Active Auto-Scrolling Floating Badge */}
      <AnimatePresence>
        {isAutoScrolling && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 sm:right-8 z-[90] flex items-center gap-2.5 px-3.5 py-2 bg-slate-950 text-white border border-slate-800 rounded-full shadow-2xl text-xs font-medium"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 hidden sm:inline">Auto-Scrolling</span>
            <span className="font-mono font-bold text-slate-200">{autoScrollWpm} WPM</span>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
              <button
                onClick={() => setAutoScrollWpm(Math.max(100, autoScrollWpm - 25))}
                className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                title="Slower (-25 WPM)"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => setAutoScrollWpm(Math.min(600, autoScrollWpm + 25))}
                className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                title="Faster (+25 WPM)"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => setIsAutoScrolling(false)}
                className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors ml-1 cursor-pointer"
                title="Pause Auto-Scroll"
              >
                <Pause size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Quick Note Modal */}
      <AnimatePresence>
        {isQuickNoteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickNoteOpen(false)}
              className="fixed inset-0 bg-slate-950/60 z-[114] cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="fixed inset-x-3 bottom-4 sm:bottom-auto sm:top-20 sm:right-8 sm:left-auto z-[115] w-auto sm:w-[380px] max-w-lg mx-auto bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <StickyNote size={17} className="text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-100">Quick Note</span>
                  {isSavingNote ? (
                    <span className="text-[10px] text-amber-300 animate-pulse font-medium">Saving...</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Saved</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (quickNoteText.trim()) {
                        navigator.clipboard.writeText(quickNoteText);
                        setNoteCopied(true);
                        setTimeout(() => setNoteCopied(false), 2000);
                      }
                    }}
                    disabled={!quickNoteText.trim()}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700/70",
                      !quickNoteText.trim() && "opacity-30 cursor-not-allowed"
                    )}
                    title="Copy Quick Note"
                  >
                    {noteCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => setQuickNoteText('')}
                    disabled={!quickNoteText.trim()}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-rose-400 hover:bg-rose-500/10",
                      !quickNoteText.trim() && "opacity-30 cursor-not-allowed"
                    )}
                    title="Clear Note"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setIsQuickNoteOpen(false)}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700/70"
                    title="Close Quick Note"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="p-3.5">
                <textarea
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Jot down key takeaways or thoughts without leaving your reading session..."
                  className="w-full h-36 sm:h-44 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 text-sm p-3 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-sans leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
                  <span>
                    {quickNoteText.trim() ? quickNoteText.trim().split(/\s+/).length : 0} words
                  </span>
                  <span className="text-slate-500 text-[10px]">Auto-saved to session</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {createPortal(
        <>
          {/* Floating Action Dock (Down Tab) */}
          <div ref={dockConstraintsRef} className="fixed inset-0 pointer-events-none" aria-hidden="true" />
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-1rem)] w-auto">
        {/* Auto-Scroll Speed Popover / Drawer */}
        <AnimatePresence>
          {showAutoScrollSettings && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAutoScrollSettings(false)}
                className="fixed inset-0 bg-slate-950/60 z-[114] sm:hidden cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                className="fixed inset-x-3 bottom-16 sm:bottom-16 sm:absolute sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 z-[115] bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-slate-700/80 w-auto sm:w-[320px] max-w-md mx-auto"
              >
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ChevronsDown size={15} className="text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Scroll Speed</span>
                  </div>
                  <button
                    onClick={() => setShowAutoScrollSettings(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Target Pace</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {autoScrollWpm} WPM
                    </span>
                  </div>

                  <input
                    type="range"
                    min={100}
                    max={600}
                    step={25}
                    value={autoScrollWpm}
                    onChange={(e) => setAutoScrollWpm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />

                  <div className="grid grid-cols-4 gap-1.5">
                    {[180, 250, 350, 450].map((w) => (
                      <button
                        key={w}
                        onClick={() => setAutoScrollWpm(w)}
                        className={cn(
                          "py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer",
                          autoScrollWpm === w
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-xs"
                            : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        {w} WPM
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                        isAutoScrolling
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                      )}
                    >
                      {isAutoScrolling ? (
                        <>
                          <Pause size={14} /> Pause Auto-Scroll
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Start Auto-Scroll
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* More Tools Popover / Drawer */}
        <AnimatePresence>
          {showMoreTools && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMoreTools(false)}
                className="fixed inset-0 bg-slate-950/60 z-[114] sm:hidden cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                className="fixed inset-x-3 bottom-16 sm:bottom-16 sm:absolute sm:inset-auto sm:right-0 z-[115] bg-slate-900 text-slate-100 p-4 rounded-3xl shadow-2xl border border-slate-700/80 w-auto sm:w-[240px] max-w-md mx-auto"
              >
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Reading Tools</span>
                  <button
                    onClick={() => setShowMoreTools(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* Focus Line Highlight */}
                  <button
                    onClick={() => {
                      const nextEnabled = !focusGuideEnabled;
                      setFocusGuideEnabled(nextEnabled);
                      if (nextEnabled && activeLine === null) setActiveLine(0);
                      if (!nextEnabled) setActiveLine(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer",
                      focusGuideEnabled ? "bg-slate-800 text-blue-400 font-medium" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Eye size={15} className={focusGuideEnabled ? "text-blue-400" : "text-slate-400"} />
                      <span className="font-medium">Focus Line</span>
                    </div>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", focusGuideEnabled ? "bg-blue-500/20 text-blue-300" : "text-slate-500")}>
                      {focusGuideEnabled ? "ON" : "OFF"}
                    </span>
                  </button>

                  {/* Focus Ruler */}
                  <button
                    onClick={() => setRulerEnabled(!rulerEnabled)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer",
                      rulerEnabled ? "bg-slate-800 text-amber-400 font-medium" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MoveVertical size={15} className={rulerEnabled ? "text-amber-400" : "text-slate-400"} />
                      <span className="font-medium">Guided Ruler</span>
                    </div>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", rulerEnabled ? "bg-amber-500/20 text-amber-300" : "text-slate-500")}>
                      {rulerEnabled ? "ON" : "OFF"}
                    </span>
                  </button>

                  {/* Copy Text */}
                  <button
                    onClick={() => {
                      copyToClipboard();
                      setShowMoreTools(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Copy size={15} className="text-slate-400" />
                    <span>Copy Text</span>
                  </button>

                  {/* Share Session */}
                  <button
                    onClick={() => {
                      shareText();
                      setShowMoreTools(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Share2 size={15} className="text-slate-400" />
                    <span>Share Session</span>
                  </button>

                  {/* Export Transmission */}
                  <button
                    onClick={() => {
                      downloadText();
                      setShowMoreTools(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Download size={15} className="text-slate-400" />
                    <span>Export Document</span>
                  </button>

                  {/* Scroll to Top */}
                  <button
                    onClick={() => {
                      document.querySelector('main .overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                      setShowMoreTools(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all cursor-pointer border-t border-slate-800/60 mt-1 pt-2"
                  >
                    <ChevronRight size={15} className="-rotate-90 text-slate-400" />
                    <span>Scroll to Top</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Minimalist Floating Action Dock */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          drag
          dragConstraints={dockConstraintsRef}
          dragElastic={0.08}
          dragMomentum={false}
          whileDrag={{ scale: 1.02 }}
          className="reader-control-dock text-slate-100 p-1.5 sm:p-2 rounded-full flex items-center justify-center gap-1 sm:gap-2 max-w-full overflow-x-auto cursor-grab active:cursor-grabbing"
        >
          <div className="reader-control-glass-layer" aria-hidden="true" />
          <div className="reader-control-glass-highlight" aria-hidden="true" />

          {/* Auto-Scroll Button */}
          <div className="reader-control-group flex items-center rounded-full p-0.5 shrink-0">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={cn(
                "reader-control-button px-2.5 sm:px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer",
                isAutoScrolling
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-200 hover:text-white hover:bg-slate-700/70"
              )}
              title={isAutoScrolling ? "Pause Auto-Scroll" : "Start Auto-Scroll"}
            >
              <ChevronsDown size={15} className={cn(isAutoScrolling && "animate-bounce text-slate-950")} />
              <span className="hidden sm:inline">{isAutoScrolling ? "Pause" : "Scroll"}</span>
            </button>
            <button
              onClick={() => {
                setShowAutoScrollSettings(!showAutoScrollSettings);
                setShowMoreTools(false);
              }}
              className={cn(
                "reader-control-button px-2 py-1.5 rounded-full text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1",
                showAutoScrollSettings ? "text-emerald-400 bg-slate-700" : "text-slate-300 hover:text-white"
              )}
              title="Adjust Auto-Scroll WPM"
            >
              <span>{autoScrollWpm} <span className="hidden sm:inline">WPM</span></span>
              <SlidersHorizontal size={11} className="opacity-70" />
            </button>
          </div>

          {/* Read Aloud */}
          <button
            onClick={toggleSpeech}
            className={cn(
              "reader-control-button px-2.5 sm:px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0",
              isSpeaking
                ? "bg-amber-400 text-slate-950 font-bold animate-pulse"
                : "text-slate-200 hover:text-white hover:bg-slate-800/80"
            )}
            title={isSpeaking ? "Stop Read Aloud" : "Read Aloud"}
          >
            <Volume2 size={15} className={cn(isSpeaking && "animate-bounce")} />
            <span className="hidden lg:inline">{isSpeaking ? "Stop" : "Read Aloud"}</span>
          </button>

          {/* Quick Note */}
          <button
            onClick={() => {
              setIsQuickNoteOpen(!isQuickNoteOpen);
              setShowAutoScrollSettings(false);
              setShowMoreTools(false);
            }}
            className={cn(
              "reader-control-button px-2.5 sm:px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 relative",
              isQuickNoteOpen
                ? "bg-amber-400 text-slate-950 font-bold"
                : quickNoteText.trim()
                  ? "text-amber-300 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20"
                  : "text-slate-200 hover:text-white hover:bg-slate-800/80"
            )}
            title="Quick Note"
          >
            <StickyNote size={15} />
            <span className="hidden lg:inline">Note</span>
            {quickNoteText.trim().length > 0 && !isQuickNoteOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Speed Mode (RSVP) */}
          <button
            onClick={() => { 
              setIsRsvpOpen(true); 
              setIsRsvpPlaying(false);
              setShowAutoScrollSettings(false);
              setShowMoreTools(false);
            }}
            className="reader-control-button px-2.5 sm:px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer shadow-xs shrink-0"
            title="Speed Reader (RSVP)"
          >
            <Zap size={15} />
            <span className="hidden lg:inline">Speed</span>
          </button>

          <div className="reader-control-divider w-[1px] h-3.5 mx-0.5 shrink-0 hidden sm:block" />

          {/* Desktop/Tablet Direct Utilities */}
          <div className="hidden lg:flex items-center gap-0.5 shrink-0">
            <button
              onClick={copyToClipboard}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-all cursor-pointer"
              title={copied ? "Copied!" : "Copy Text"}
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>

            <button
              onClick={shareText}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-all cursor-pointer"
              title="Share Session"
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* More Tools Toggle */}
          <button
            onClick={() => {
              setShowMoreTools(!showMoreTools);
              setShowAutoScrollSettings(false);
            }}
            className={cn(
              "p-2 rounded-full transition-all cursor-pointer shrink-0",
              showMoreTools ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            )}
            title="More Reading Tools"
          >
            <Sliders size={15} />
          </button>
        </motion.div>
      </div>
        </>,
        document.body
      )}

    </div>
  );
}

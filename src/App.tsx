import { useState, useCallback, useRef, useEffect, type UIEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Settings2, 

  Brain, 
  Maximize2, 
  Type, 
  Upload, 
  Plus, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Volume2
} from 'lucide-react';
import { cn } from './lib/utils';
import { READING_PROFILES, ReadingMode, ReadingProfile } from './types';
import Reader from './components/Reader';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import FluidGlass from './components/FluidGlass';

const TAB_ORDER = ['manifesto', 'reader', 'library', 'insights', 'visual', 'settings'] as const;
type TabType = typeof TAB_ORDER[number];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : '0%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : direction > 0 ? '-100%' : '0%',
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: "spring" as const, stiffness: 320, damping: 32 },
  opacity: { duration: 0.2 },
};

export default function App() {
  const [text, setText] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<TabType>('manifesto');
  const [direction, setDirection] = useState<number>(0);
  const [isReading, setIsReading] = useState(false);
  const [mode, setMode] = useState<ReadingMode>('default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [isAIBarOpen, setIsAIBarOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollWpm, setAutoScrollWpm] = useState(220);
  const [recentSessions, setRecentSessions] = useState<{ title: string; content: string; openedAt: number }[]>(() => {
    const saved = localStorage.getItem('neurolens-sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [customProfile, setCustomProfile] = useState<ReadingProfile>(() => {
    const saved = localStorage.getItem('neurolens-profile');
    return saved ? JSON.parse(saved) : READING_PROFILES.default;
  });
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Persistent saving
  useEffect(() => {
    localStorage.setItem('neurolens-profile', JSON.stringify(customProfile));
  }, [customProfile]);

  const activeTabKey = isReading ? 'reader' : currentTab;

  const handleTabChange = (targetTab: TabType) => {
    if (targetTab === 'reader' && !text) return;

    const oldIndex = TAB_ORDER.indexOf(activeTabKey);
    const newIndex = TAB_ORDER.indexOf(targetTab);

    if (newIndex !== oldIndex) {
      setDirection(newIndex > oldIndex ? 1 : -1);
    }

    if (targetTab === 'reader') {
      setIsReading(true);
      setCurrentTab('reader');
    } else {
      setIsReading(false);
      setCurrentTab(targetTab);
    }
    setIsAIBarOpen(false);
    setIsContentScrolled(false);
  };

  const handleStartReading = (newText: string) => {
    const title = newText.trim().split(/\n/)[0].slice(0, 60) || 'Untitled reading';
    const nextSessions = [
      { title, content: newText, openedAt: Date.now() },
      ...recentSessions.filter(session => session.content !== newText),
    ].slice(0, 6);
    setRecentSessions(nextSessions);
    localStorage.setItem('neurolens-sessions', JSON.stringify(nextSessions));
    setText(newText);

    const oldIndex = TAB_ORDER.indexOf(activeTabKey);
    const newIndex = TAB_ORDER.indexOf('reader');
    if (newIndex !== oldIndex) {
      setDirection(newIndex > oldIndex ? 1 : -1);
    }

    setIsReading(true);
    setCurrentTab('reader');
    setIsContentScrolled(false);
  };

  const handleBack = () => {
    if (isReading) {
      const oldIndex = TAB_ORDER.indexOf('reader');
      const newIndex = TAB_ORDER.indexOf('manifesto');
      setDirection(newIndex > oldIndex ? 1 : -1);
      setIsReading(false);
      setCurrentTab('manifesto');
      setIsContentScrolled(false);
    }
  };

  const handleContentScroll = useCallback((event: UIEvent<HTMLElement>) => {
    setIsContentScrolled(event.currentTarget.scrollTop > 8);
  }, []);

  const navigateTo = (tab: TabType) => {
    handleTabChange(tab);
  };

  return (
    <div className={cn(
      "h-screen flex flex-col transition-colors duration-500 font-sans overflow-hidden relative",
      customProfile.tintColor !== 'transparent' ? `bg-[${customProfile.tintColor}]` : "bg-art-bg"
    )}
    style={{ backgroundColor: customProfile.tintColor !== 'transparent' ? customProfile.tintColor : undefined }}
    >
      <div className="noise" />

      {/* Global Header */}
      <header className={cn(
        "liquidglass app-header h-14 sm:h-16 flex items-center gap-2 px-3 sm:px-8 shrink-0 z-50",
        isContentScrolled && "is-scrolled"
      )}>
        <svg
          className="glass-surface__filter nav-glass-definitions"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <filter
            id="header-glass-filter"
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="2"
              seed="18"
              result="surfaceNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="surfaceNoise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
              result="distortedSurface"
            />
            <feGaussianBlur in="distortedSurface" stdDeviation="0.35" />
          </filter>
          <filter id="header-nav-distortion" primitiveUnits="objectBoundingBox">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" result="blurredNav" />
            <feDisplacementMap in="blurredNav" in2="blurredNav" scale="0.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <div className="header-brand flex items-center gap-1.5 sm:gap-3 shrink-0 rounded-full px-1.5 py-1">
          <button
            onClick={handleBack}
            className="header-back-button w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-art-text/40 transition-colors rounded-full cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={18} className="sm:block hidden" />
            <ArrowLeft size={15} className="sm:hidden block" />
          </button>
        </div>

        <nav className="header-nav-switcher flex-1 min-w-0 h-9 sm:h-10 max-w-4xl mx-auto self-center flex items-center justify-start sm:justify-center gap-0.5 sm:gap-1 p-1 rounded-lg sm:rounded-full text-[11px] sm:text-sm font-semibold overflow-x-auto no-scrollbar">
          {[
            { id: 'manifesto', label: 'Explore' },
            { id: 'reader', label: 'Read', disabled: !text },
            { id: 'library', label: 'Library' },
            { id: 'insights', label: 'Insights' },
            { id: 'visual', label: 'Visual' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => {
            const isActive = (tab.id === 'reader' && isReading) || (currentTab === tab.id && !isReading);

            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={cn(
                  "header-nav-option relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0",
                  tab.disabled && "opacity-30 cursor-not-allowed",
                  isActive ? "text-art-text font-bold" : "hover:text-art-text"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="header-nav-active absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </header>

      <div className="flex-1 flex overflow-hidden relative w-full">
        <AnimatePresence custom={direction} mode="popLayout">
          {activeTabKey === 'manifesto' ? (
            <motion.div
              key="manifesto"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto" onScroll={handleContentScroll}>
                <Landing onStart={handleStartReading} />
              </div>
            </motion.div>
          ) : activeTabKey === 'library' ? (
            <motion.div
              key="library"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto px-4 py-8 sm:px-8 sm:py-12 md:p-16"
              onScroll={handleContentScroll}
            >
              <div className="max-w-5xl mx-auto">
                <div className="mb-12">
                  <h1 className="text-4xl font-semibold text-art-text mb-2">Your Library</h1>
                  <p className="text-art-text/60">Curated texts to explore</p>
                </div>

                {recentSessions.length > 0 && (
                  <section className="mb-10">
                    <h2 className="text-xs font-bold text-art-text/50 uppercase tracking-widest mb-4">Recent Sessions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentSessions.map((session, idx) => (
                        <motion.button
                          key={session.openedAt}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          whileHover={{ y: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setText(session.content);
                            setIsReading(true);
                            setCurrentTab('reader');
                          }}
                          className="text-left bg-blue-50/70 rounded-3xl p-6 border border-blue-200/60 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all group cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-blue-600 mb-2.5 flex items-center justify-between">
                            <span>Recent Session</span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                          <h3 className="text-lg font-bold text-art-text mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{session.title}</h3>
                          <p className="text-sm text-art-text/60 line-clamp-2 leading-relaxed">{session.content}</p>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'The Nature of Consciousness',
                      tag: 'Neuroscience',
                      content: "The problem of consciousness is the problem of explaining how and why we have qualitative, phenomenal experiences. It is often described as the 'Hard Problem'. This text explores the biological underpinnings of subjective awareness and the functional role of attention in bridging the gap between stimuli and perception."
                    },
                    {
                      title: 'Metastability in Brain Dynamics',
                      tag: 'Complex Systems',
                      content: "Metastability is a core feature of brain function, allowing for both integration and segregation of information processing. This dynamic balance enables the brain to transition between different functional states while maintaining stability. Understanding these dynamics is crucial for modeling cognitive flexibility and attention."
                    },
                    {
                      title: 'Cognitive Affordance & Design',
                      tag: 'Psychology',
                      content: "Affordances are the perceived and actual properties of things that determine just how the thing could possibly be used. In digital environments, cognitive affordance refers to the ease with which a user can understand the information presented to them. NeuroLens optimizes these affordances through adaptive typography."
                    }
                  ].map((book, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setText(book.content);
                        setIsReading(true);
                        setCurrentTab('reader');
                      }}
                      className="bg-white rounded-3xl p-6 border border-art-text/8 shadow-sm hover:shadow-xl hover:shadow-art-text/5 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/50 rounded-full text-xs font-semibold">{book.tag}</div>
                        </div>
                        <h3 className="text-lg font-bold text-art-text mb-3 leading-snug group-hover:text-blue-600 transition-colors">{book.title}</h3>
                        <p className="text-sm text-art-text/60 line-clamp-3 mb-6 leading-relaxed">{book.content}</p>
                      </div>
                      <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all gap-1">
                        Start Reading <ChevronRight size={16} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : activeTabKey === 'insights' ? (
            <motion.div
              key="insights"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto px-4 py-8 sm:px-8 sm:py-12 md:p-16"
              onScroll={handleContentScroll}
            >
              <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                  <h1 className="text-4xl font-bold text-art-text mb-2">Cognitive Insights</h1>
                  <p className="text-art-text/60">Real-time analysis of your reading efficiency and cognitive load</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Focus Score Hero Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl shadow-blue-500/15 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Focus Score</span>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">+14% vs avg</span>
                      </div>
                      <p className="text-6xl font-extrabold tracking-tight mb-2">88</p>
                      <p className="text-xs opacity-90 leading-relaxed">Optimal saccadic fixation rhythm detected across your last sessions.</p>
                    </div>
                    <div className="mt-8 h-16 flex items-end gap-2">
                      {[35, 55, 45, 80, 65, 92, 75, 88, 60, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.08, duration: 0.8 }}
                          className="flex-1 bg-white/30 hover:bg-white rounded-t-sm transition-colors"
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Calculated Words & Time Saved */}
                  <div className="grid grid-cols-1 gap-6 md:col-span-2">
                    <div className="grid grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-3xl border border-art-text/8 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-art-text/50 mb-2">Total Words Processed</p>
                          <p className="text-3xl sm:text-4xl font-extrabold text-art-text">
                            {recentSessions.reduce((acc, s) => acc + s.content.split(/\s+/).length, text ? text.split(/\s+/).length : 0).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-art-text/60 mt-4">Across {recentSessions.length + (text ? 1 : 0)} reading session(s)</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-200/60 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/60 mb-2">Estimated Time Saved</p>
                          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-950">
                            ~{Math.round((recentSessions.reduce((acc, s) => acc + s.content.split(/\s+/).length, text ? text.split(/\s+/).length : 0) * 0.25) / 200)} min
                          </p>
                        </div>
                        <p className="text-xs text-emerald-800/80 font-medium mt-4">Via Bionic Fixation (+25% WPM acceleration)</p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-6 rounded-3xl border border-art-text/8 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-art-text/50">Cognitive Load Reduction</p>
                        <span className="text-sm font-bold text-blue-600">-28% Visual Fatigue</span>
                      </div>
                      <div className="w-full bg-art-secondary h-2.5 rounded-full overflow-hidden my-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "72%" }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-art-text/60">Calculated by measuring reduced saccadic eye relocations per line.</p>
                    </motion.div>
                  </div>
                </div>

                {/* Session History Log */}
                {recentSessions.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-bold text-art-text mb-4">Reading History Log</h2>
                    <div className="bg-white rounded-3xl border border-art-text/8 shadow-sm overflow-hidden divide-y divide-art-text/5">
                      {recentSessions.map((session, i) => (
                        <div 
                          key={session.openedAt}
                          onClick={() => {
                            setText(session.content);
                            setIsReading(true);
                            setCurrentTab('reader');
                          }}
                          className="p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <div>
                            <div className="text-base font-semibold text-art-text group-hover:text-blue-600 transition-colors mb-1">{session.title}</div>
                            <div className="text-xs text-art-text/50">Opened {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.content.split(/\s+/).length} words</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                            <span>Resume</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTabKey === 'visual' ? (
            <motion.div
              key="visual"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
            >
              <div className="flex-1 relative min-h-0">
                <FluidGlass
                  mode="lens"
                  lensProps={{
                    scale: 0.25,
                    ior: 1.15,
                    thickness: 5,
                    chromaticAberration: 0.1,
                    anisotropy: 0.01,
                  }}
                />
              </div>
            </motion.div>
          ) : activeTabKey === 'settings' ? (
            <motion.div
              key="settings"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto px-4 py-8 sm:px-8 sm:py-12 md:p-16"
              onScroll={handleContentScroll}
            >
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold text-art-text mb-2">Settings</h1>
                <p className="text-art-text/60 mb-12">Manage your preferences</p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-art-text/5">
                    <h3 className="font-semibold text-art-text mb-2">Reset Data</h3>
                    <p className="text-sm text-art-text/60 mb-4">Clear all saved settings and reading history.</p>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Clear Data
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-art-text/5">
                    <h3 className="font-semibold text-art-text mb-4">About NeuroLens</h3>
                    <p className="text-sm text-art-text/70 leading-relaxed">
                      An adaptive reading environment designed for neurodivergent minds. Customizable fonts, spacing, and pacing help you read with clarity and focus.
                    </p>
                    <p className="text-xs text-art-text/50 mt-4">Version 1.0 · © 2024</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reader"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 w-full h-full flex flex-row overflow-hidden"
            >
              {/* Sidebar for Controls */}
              <Sidebar 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                mode={mode}
                setMode={setMode}
                profile={customProfile}
                setProfile={setCustomProfile}
                onBack={handleBack}
                isAutoScrolling={isAutoScrolling}
                setIsAutoScrolling={setIsAutoScrolling}
                autoScrollWpm={autoScrollWpm}
                setAutoScrollWpm={setAutoScrollWpm}
              />

              {/* Reader View */}
              <main className="flex-1 min-w-0 relative flex flex-col overflow-hidden reader-surface">
                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth smooth-scroll overscroll-contain"
                  onScroll={handleContentScroll}
                >
                  <Reader 
                    text={text} 
                    profile={customProfile}
                    isAutoScrolling={isAutoScrolling}
                    setIsAutoScrolling={setIsAutoScrolling}
                    autoScrollWpm={autoScrollWpm}
                    setAutoScrollWpm={setAutoScrollWpm}
                  />
                </div>

                {/* AI Assistant Overlay */}
                <AnimatePresence>
                  {isAIBarOpen && (
                    <AIAssistant 
                      text={text} 
                      onClose={() => setIsAIBarOpen(false)} 
                    />
                  )}
                </AnimatePresence>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="min-h-12 shrink-0 px-4 py-3 sm:px-10 flex items-center justify-center text-center text-[10px] sm:text-xs text-art-text/50 panel-surface">
        NeuroLens © 2024 · Crafted for neurodivergent minds
      </footer>
    </div>
  );
}

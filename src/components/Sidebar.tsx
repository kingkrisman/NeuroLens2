import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ChevronLeft, ChevronRight, Type, TextAlignCenter as AlignCenter, Brain, Eye, Zap, GraduationCap, LayoutGrid as Layout, Layers, Palette, Maximize2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { READING_PROFILES, ReadingMode, ReadingProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: ReadingMode;
  setMode: (mode: ReadingMode) => void;
  profile: ReadingProfile;
  setProfile: (profile: ReadingProfile) => void;
  onBack: () => void;
  isAutoScrolling?: boolean;
  setIsAutoScrolling?: (val: boolean) => void;
  autoScrollWpm?: number;
  setAutoScrollWpm?: (val: number) => void;
}

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  mode, 
  setMode, 
  profile, 
  setProfile,
  onBack,
  isAutoScrolling = false,
  setIsAutoScrolling,
  autoScrollWpm = 220,
  setAutoScrollWpm
}: SidebarProps) {
  const modes: { id: ReadingMode; label: string; icon: any; color: string }[] = [
    { id: 'default', label: 'Standard', icon: Layout, color: 'text-zinc-500' },
    { id: 'adhd', label: 'ADHD', icon: Brain, color: 'text-amber-500' },
    { id: 'dyslexia', label: 'Dyslexia', icon: Eye, color: 'text-blue-500' },
    { id: 'focus', label: 'Focus', icon: Zap, color: 'text-purple-500' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'text-emerald-500' },
    { id: 'speed', label: 'Speed', icon: Zap, color: 'text-orange-500' },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-slate-950/50 z-40 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 300 : 0 }}
        className={cn(
          "bg-white border-r border-art-text/10 h-full flex flex-col overflow-visible shadow-2xl lg:shadow-none z-50 lg:z-30 transition-all duration-300",
          "fixed lg:relative inset-y-0 left-0"
        )}
      >
        <div className={cn(
          isOpen ? "w-[min(300px,85vw)] min-w-[min(300px,85vw)] lg:w-[300px] lg:min-w-[300px]" : "w-0 min-w-0",
          "flex flex-col h-full overflow-hidden transition-[width,min-width] duration-200"
        )}>
          <div className="p-4 sm:p-6 border-b border-white/40 flex items-center justify-between">
            <span className="font-semibold text-art-text">Reading Options</span>
            <button 
              onClick={onToggle} 
              className="p-2 hover:bg-art-secondary rounded-lg transition-colors text-art-text/60 hover:text-art-text cursor-pointer"
              title="Close Reading Options"
            >
              <X size={18} className="lg:hidden" />
              <ChevronLeft size={18} className="hidden lg:block" />
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 pb-24">
          {/* Modes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-art-text/60 uppercase tracking-wide">Reading Mode</h3>
              <button
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else document.documentElement.requestFullscreen();
                }}
                className="p-1.5 hover:bg-art-secondary rounded text-art-text/60 hover:text-art-text transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {modes.map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (mode === m.id) return;
                    setMode(m.id);
                    setProfile(READING_PROFILES[m.id]);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all font-semibold cursor-pointer",
                    mode === m.id
                      ? "surface-selected text-art-text"
                      : "surface-button text-art-text/70"
                  )}
                >
                  <m.icon size={16} className={mode === m.id ? "text-blue-600" : "text-art-text/40"} />
                  {m.label}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Sliders & Controls */}
          <section className="space-y-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-medium text-art-text/70 mb-3">
                  <span>Fixation</span>
                  <span className="font-semibold text-art-text">{Math.round(profile.bionicStrength * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="0.8" step="0.05" value={profile.bionicStrength}
                  onChange={(e) => setProfile({ ...profile, bionicStrength: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-art-text/70 mb-3">
                  <span>Font Size</span>
                  <span className="font-semibold text-art-text">{profile.fontSize}px</span>
                </div>
                <input
                  type="range" min="14" max="32" value={profile.fontSize}
                  onChange={(e) => setProfile({ ...profile, fontSize: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-art-text/70 mb-3">
                  <span>Line Height</span>
                  <span className="font-semibold text-art-text">{profile.lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="1" max="2.5" step="0.1" value={profile.lineHeight}
                  onChange={(e) => setProfile({ ...profile, lineHeight: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-art-text/70 mb-3">
                  <span>Letter Spacing</span>
                  <span className="font-semibold text-art-text">{profile.letterSpacing.toFixed(2)}em</span>
                </div>
                <input
                  type="range" min="-0.05" max="0.5" step="0.01" value={profile.letterSpacing}
                  onChange={(e) => setProfile({ ...profile, letterSpacing: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-art-text/70 mb-3">
                  <span>Word Spacing</span>
                  <span className="font-semibold text-art-text">{profile.wordSpacing.toFixed(2)}em</span>
                </div>
                <input
                  type="range" min="0" max="1.0" step="0.05" value={profile.wordSpacing}
                  onChange={(e) => setProfile({ ...profile, wordSpacing: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-art-text/5">
                <h3 className="text-xs font-semibold text-art-text/70 mb-3">Font</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'font-sans', label: 'Inter', class: 'font-sans' },
                    { id: 'font-serif', label: 'Playfair', class: 'font-serif' },
                    { id: 'font-lexend', label: 'Lexend', class: 'font-lexend' },
                    { id: 'font-atkinson', label: 'Atkinson', class: 'font-atkinson' },
                    { id: 'font-mono', label: 'JetBrains', class: 'font-mono' }
                  ].map((font) => (
                    <motion.button
                      key={font.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setProfile({ ...profile, fontFamily: font.id })}
                      className={cn(
                        "p-3 rounded-xl border text-sm transition-all cursor-pointer font-medium",
                        profile.fontFamily === font.id
                          ? "surface-selected text-blue-900"
                          : "surface-button text-art-text/70"
                      )}
                    >
                      <span className={font.class}>{font.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-art-text/5">
              <div>
                <span className="text-sm font-medium text-art-text">Rhythm Engine</span>
                <span className="text-xs text-art-text/60 block mt-0.5">Saccadic Pacing</span>
              </div>
              <button
                onClick={() => setProfile({ ...profile, rhythmOptimization: !profile.rhythmOptimization })}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  profile.rhythmOptimization ? "bg-green-500" : "bg-art-text/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all",
                  profile.rhythmOptimization ? "right-0.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-art-text/5">
              <div>
                <span className="text-sm font-medium text-art-text">Focus Mode</span>
                <span className="text-xs text-art-text/60 block mt-0.5">Isolate line</span>
              </div>
              <button
                onClick={() => setProfile({ ...profile, focusHighlight: !profile.focusHighlight })}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  profile.focusHighlight ? "bg-green-500" : "bg-art-text/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all",
                  profile.focusHighlight ? "right-0.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="pt-4 border-t border-art-text/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-art-text">Auto-Scroll</span>
                  <span className="text-xs text-art-text/60 block mt-0.5">Paced reading scroll</span>
                </div>
                <button
                  onClick={() => setIsAutoScrolling?.(!isAutoScrolling)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-all relative cursor-pointer",
                    isAutoScrolling ? "bg-emerald-500" : "bg-art-text/20"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-xs",
                    isAutoScrolling ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>

              <div className="mt-3 panel-pill p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-art-text/70">
                  <span>Speed</span>
                  <span className="text-emerald-600 font-mono font-bold">{autoScrollWpm} WPM</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={600}
                  step={25}
                  value={autoScrollWpm}
                  onChange={(e) => setAutoScrollWpm?.(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-art-text/10 rounded-full appearance-none cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[180, 250, 350, 450].map((w) => (
                    <button
                      key={w}
                      onClick={() => setAutoScrollWpm?.(w)}
                      className={cn(
                        "px-1.5 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer",
                        autoScrollWpm === w ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-white border-art-text/10 text-art-text/70 hover:bg-art-secondary"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-art-text/5">
              <h3 className="text-xs font-semibold text-art-text/70 mb-3">Background</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { color: 'transparent', label: 'None' },
                  { color: '#fef3c7', label: 'Amber' },
                  { color: '#f0fdf4', label: 'Mint' },
                  { color: '#f8fafc', label: 'Slate' },
                  { color: '#ffe4e6', label: 'Rose' },
                  { color: '#eff6ff', label: 'Sky' },
                  { color: '#faf5ff', label: 'Violet' },
                  { color: '#f5f5f4', label: 'Stone' }
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setProfile({ ...profile, tintColor: item.color })}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      profile.tintColor === item.color ? "border-blue-500 ring-2 ring-blue-300" : "border-transparent"
                    )}
                    style={{ backgroundColor: item.color === 'transparent' ? '#fff' : item.color }}
                    title={item.label}
                  >
                    {item.color === 'transparent' && <div className="w-full h-full flex items-center justify-center text-xs text-art-text/40">✓</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-art-text/5">
              <button
                onClick={() => {
                  localStorage.setItem('neurolens-profile', JSON.stringify(profile));
                  // Simple Visual feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  const original = btn.innerText;
                  btn.innerText = "Vault Synchronized";
                  btn.classList.add("bg-green-600");
                  setTimeout(() => {
                    btn.innerText = original;
                    btn.classList.remove("bg-green-600");
                  }, 2000);
                }}
                className="w-full py-4 bg-art-text text-white text-[10px] uppercase font-bold tracking-[0.4em] rounded-2xl transition-all shadow-xl shadow-art-text/10 hover:bg-blue-600"
              >
                Vault Settings
              </button>
            </div>
          </section>

          {/* Reading Flow Stats simulation */}
          <section className="mt-auto">
            <div className="panel-surface rounded-2xl p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Reading Flow</p>
              <p className="text-3xl font-serif italic">342 <span className="text-xs font-sans not-italic font-bold opacity-60 ml-1">WPM</span></p>
              <div className="mt-4 flex gap-1 items-end h-8">
                <div className="flex-1 bg-art-text/10 h-1/2 rounded-t-sm"></div>
                <div className="flex-1 bg-art-text/10 h-3/4 rounded-t-sm"></div>
                <div className="flex-1 bg-art-text h-full rounded-t-sm"></div>
                <div className="flex-1 bg-art-text/60 h-2/3 rounded-t-sm"></div>
                <div className="flex-1 bg-art-text/30 h-1/2 rounded-t-sm"></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {!isOpen && (
        <button 
          onClick={onToggle}
          className="fixed md:absolute left-0 md:left-auto top-1/2 -translate-y-1/2 md:-right-8 w-8 h-12 bg-white border border-art-text/10 rounded-r-xl flex items-center justify-center z-50 cursor-pointer shadow-md hover:bg-art-secondary"
          title="Open Reading Options"
        >
          <ChevronRight size={16} className="text-zinc-600" />
        </button>
      )}
    </motion.aside>
    </>
  );
}

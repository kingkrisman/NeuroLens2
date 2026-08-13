import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Sparkles, BookOpen, Brain, Type, Maximize2, ChevronRight, Zap, Eye, CircleCheck as CheckCircle2 } from 'lucide-react';
import { cn, processBionicText } from '../lib/utils';
import { processDocument } from '../lib/documentProcessor';

interface LandingProps {
  onStart: (text: string) => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentMeta, setDocumentMeta] = useState<any>(null);
  const [demoBionic, setDemoBionic] = useState(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setDocumentMeta(null);

    try {
      const doc = await processDocument(file);
      setInputText(doc.content);
      setDocumentMeta({
        title: doc.title,
        format: doc.metadata.format,
        wordCount: doc.metadata.wordCount,
        readTime: doc.metadata.estimatedReadTime,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError((err as Error).message || "Failed to process document.");
      setDocumentMeta(null);
    } finally {
      setIsUploading(false);
    }
  };

  const examples = [
    { 
      title: "Academic Abstract", 
      text: "The phenomenon of cognitive friction in digital reading environments has significant implications for neurodivergent learners. This study investigates how adaptive formatting reduces visual entropy and enhances focus retention in ADHD populations." 
    },
    { 
      title: "Complex Documentation", 
      text: "NeuroLens utilizes a recursive word-weighting algorithm to transform static strings into fixation-aware content. By dynamically adjusting the contrast ratio of initial graphemes, we optimize the saccadic rhythm of the human eye." 
    },
    {
      title: "Neurological Focus Synthesis",
      text: "Saccadic movements represent rapid eye relocations between fixations. By anchoring initial phonemes with weighted typography, readers process vocabulary prior to full visual scanning, reducing cognitive fatigue by up to 40%."
    }
  ];

  const sampleDemoSentence = "NeuroLens transforms dense paragraphs into effortless visual rhythms tailored for your brain.";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-5xl mx-auto min-h-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 relative"
    >
      {/* Hero Header */}
      <motion.div variants={itemVariants} className="text-center mb-10 sm:mb-14 max-w-3xl relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-art-text leading-[1.12] mb-5">
          Read with effortless clarity.
        </h1>
        <p className="text-base sm:text-xl text-art-text/65 leading-relaxed max-w-2xl mx-auto font-normal">
          NeuroLens adapts text formatting to your brain's cognitive rhythm. Reduce visual friction, anchor saccadic focus, and transform your reading flow.
        </p>

        {/* Live Interactive Preview Card */}
        <div className="mt-8 p-5 sm:p-6 panel-surface rounded-3xl max-w-xl mx-auto text-left relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3.5 text-xs font-semibold text-art-text/50 border-b border-art-text/5 pb-2.5">
            <span className="flex items-center gap-2"><Brain size={15} className="text-blue-600" /> Interactive Fixation Engine</span>
            <div className="flex gap-1 panel-pill p-1 rounded-full text-[11px]">
              <button
                onClick={() => setDemoBionic(true)}
                className={cn(
                  "px-3 py-1 rounded-full font-semibold transition-all cursor-pointer",
                  demoBionic ? "surface-selected text-blue-600 shadow-xs" : "text-art-text/60 hover:text-art-text"
                )}
              >
                Bionic Fixation
              </button>
              <button
                onClick={() => setDemoBionic(false)}
                className={cn(
                  "px-3 py-1 rounded-full font-semibold transition-all cursor-pointer",
                  !demoBionic ? "surface-selected text-art-text shadow-xs" : "text-art-text/60 hover:text-art-text"
                )}
              >
                Standard
              </button>
            </div>
          </div>
          <div className="text-base sm:text-lg leading-relaxed font-sans text-art-text pt-1">
            {demoBionic ? (
              <span dangerouslySetInnerHTML={{ __html: processBionicText(sampleDemoSentence, 0.55, true) }} />
            ) : (
              sampleDemoSentence
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Interactive Grid */}
      <div className="w-full grid md:grid-cols-2 gap-6 sm:gap-8 items-start pb-8 sm:pb-16 relative z-10">
        {/* Input Area Card */}
        <motion.div variants={itemVariants} className="flex flex-col h-full">
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-art-secondary border border-art-text/8 rounded-3xl p-6 sm:p-8 flex flex-col min-h-[420px] sm:h-[520px] relative overflow-hidden"
          >
            <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-art-text/50 flex items-center gap-2">
                <Type size={15} /> Source Material
              </span>
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
                <motion.div 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-art-text rounded-xl text-xs sm:text-sm font-semibold surface-button"
                >
                  <Upload size={15} />
                  {isUploading ? (
                    <span className="flex items-center gap-2"><span className="loading-dots"><i /><i /><i /></span> Parsing</span>
                  ) : "Upload File"}
                </motion.div>
              </label>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type any article, essay, document or book excerpt here…"
              className="flex-1 min-h-40 w-full bg-transparent p-0 text-base sm:text-lg focus:outline-none transition-all placeholder:text-art-text/30 resize-none leading-relaxed"
            />

            <AnimatePresence>
              {documentMeta && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 panel-pill rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText size={15} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-950">{documentMeta.title}</span>
                  </div>
                  <div className="text-xs text-blue-700 flex items-center gap-3">
                    <span>{documentMeta.format}</span>
                    <span>•</span>
                    <span>{documentMeta.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>~{documentMeta.readTime} min read</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: inputText.trim() ? 1.02 : 1 }}
              whileTap={{ scale: inputText.trim() ? 0.98 : 1 }}
              onClick={() => onStart(inputText)}
              disabled={!inputText.trim()}
              className="mt-6 sm:mt-8 w-full py-3.5 bg-art-text text-white rounded-2xl font-semibold text-sm sm:text-base transition-all shadow-lg shadow-art-text/10 flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Launch Reading Portal</span>
              <ChevronRight size={18} />
            </motion.button>

            {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
          </motion.div>
        </motion.div>

        {/* Examples & Stats Cards */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div className="panel-surface rounded-3xl p-6 sm:p-8">
            <h3 className="text-xs font-bold text-art-text/50 mb-5 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={15} /> Curated Sample Texts
            </h3>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 4, backgroundColor: 'rgba(245, 245, 247, 0.8)' }}
                  onClick={() => setInputText(ex.text)}
                  className="w-full text-left p-4 rounded-2xl transition-all surface-button cursor-pointer block"
                >
                  <div className="font-semibold text-art-text text-sm sm:text-base mb-1 flex items-center justify-between">
                    <span>{ex.title}</span>
                    <ChevronRight size={14} className="text-art-text/30" />
                  </div>
                  <div className="text-xs text-art-text/50 line-clamp-2 leading-relaxed">{ex.text}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Focus Gain", stat: "92%", color: "text-blue-600", desc: "Retention boost" },
              { label: "Visual Friction", stat: "-40%", color: "text-emerald-600", desc: "Reduced fatigue" }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -2 }}
                className="panel-surface rounded-3xl p-5 sm:p-6 text-center flex flex-col justify-between"
              >
                <div className={cn("text-3xl sm:text-4xl font-bold tracking-tight mb-1", item.color)}>{item.stat}</div>
                <div>
                  <div className="text-xs font-bold text-art-text/80 uppercase tracking-wide">{item.label}</div>
                  <div className="text-[10px] text-art-text/40 mt-0.5">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

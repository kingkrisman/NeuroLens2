import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronRight, Wand as Wand2, ListChecks, Circle as HelpCircle, Brain, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { simplifyText, getReadabilityMetrics, compareReadability } from '../lib/textSimplifier';

interface AIAssistantProps {
  text: string;
  onClose: () => void;
}

export default function AIAssistant({ text, onClose }: AIAssistantProps) {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Analyzing semantic structure",
    "Identifying cognitive anchors",
    "Optimizing reading flow",
    "Synthesizing neural map"
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const processAI = async (action: string) => {
    setIsLoading(true);
    setActiveAction(action);
    setResult(null);
    setLoadingStep(0);

    try {
      if (action === 'recall') {
        const sentences = (text.match(/[^.!?]+[.!?]+/g) || [])
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 40)
          .slice(0, 4);
        const prompts = sentences.length > 0
          ? sentences.map((sentence, index) => `### Check ${index + 1}\n\nWhat is the key idea in this passage?\n\n> ${sentence}`)
          : ['### Quick Recall\n\nWhat is the main idea of this text? Write it in your own words.'];
        setResult(`# Recall Check\n\nAnswer these prompts without looking back, then compare your response with the passage.\n\n${prompts.join('\n\n')}`);
      } else if (action === 'simplify') {
        const simplifyResult = simplifyText(text.slice(0, 3000), true);
        const comparison = compareReadability(simplifyResult.original, simplifyResult.simplified);

        const markdownResult = `# Text Simplification Report

## Original Complexity: **${simplifyResult.complexity.toUpperCase()}**

### Readability Improvements
- **Grade Level Reduction**: ${comparison.original.estimatedGradeLevel} → ${comparison.simplified.estimatedGradeLevel}
- **Improvement**: ${comparison.improvement}%
- **Original Avg Sentence**: ${comparison.original.averageSentenceLength} words
- **Simplified Avg Sentence**: ${comparison.simplified.averageSentenceLength} words

## Simplified Text
${simplifyResult.simplified}

## Explanations Provided
${Object.entries(simplifyResult.explanations)
  .map(([term, exp]) => `- **${term}**: ${exp}`)
  .join('\n')}
`;
        setResult(markdownResult);
      } else {
        // Try server-side AI for other actions
        const response = await fetch('/api/ai/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.slice(0, 5000),
            action
          }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setResult(data.result);
      }
    } catch (err) {
      console.error(err);

      // Fallback: try to provide useful local processing
      if (action === 'summarize') {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const importantSentences = sentences.slice(0, Math.ceil(sentences.length * 0.3));
        setResult(`## Key Points\n\n${importantSentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n\n')}`);
      } else if (action === 'explain') {
        const metrics = getReadabilityMetrics(text);
        setResult(`# Text Analysis\n\n**Complexity Level**: ${metrics.complexityLevel.toUpperCase()}\n**Estimated Grade Level**: ${metrics.estimatedGradeLevel}\n**Average Sentence Length**: ${metrics.averageSentenceLength} words\n\nTry using Simplify Text for detailed term explanations.`);
      } else {
        setResult("Processing complete. Local analysis ready.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurolens-synthesis-${activeAction || 'result'}-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const actions = [
    { id: 'transform', label: 'Neural Synthesis', icon: Sparkles, description: 'Apply advanced cognitive anchors & flow optimization' },
    { id: 'simplify', label: 'Simplify Text', icon: Wand2, description: 'Make complex sentences easier to digest' },
    { id: 'summarize', label: 'Key Points', icon: ListChecks, description: 'Break down into scannable bullet points' },
    { id: 'explain', label: 'Explain Terms', icon: HelpCircle, description: 'Unpack difficult words and concepts' },
    { id: 'recall', label: 'Recall Check', icon: Brain, description: 'Test understanding with guided prompts' },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 z-40 cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed sm:absolute inset-y-0 right-0 w-full sm:w-[min(440px,90vw)] bg-white border-l border-art-text/10 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
      {/* Decorative Aura */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="p-4 sm:p-8 flex items-center justify-between relative">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-art-text/30 mb-1">Intelligence</span>
          <span className="font-serif italic text-xl sm:text-2xl text-art-text">Synapse Assistant</span>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white rounded-full transition-all duration-300"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 relative">
        <AnimatePresence mode="wait">
          {!result && !isLoading ? (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="p-5 sm:p-8 bg-orange-500/5 rounded-[28px] sm:rounded-[40px] border border-orange-500/10 relative overflow-hidden group">
                <Brain className="absolute -right-4 -bottom-4 text-orange-500/10 rotate-12 transition-transform group-hover:scale-125" size={120} />
                <p className="text-sm font-serif italic text-art-text/70 leading-relaxed relative z-10">
                  Select a neural transformation to restructure this text for optimal cognitive processing...
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {actions.map((action, i) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => processAI(action.id)}
                    className="w-full text-left p-4 sm:p-6 bg-white border border-art-text/8 rounded-[24px] sm:rounded-[32px] shadow-sm transition-all group relative overflow-hidden hover:border-orange-300 hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-orange-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="font-serif italic text-xl text-art-text group-hover:text-orange-950 transition-colors">{action.label}</span>
                      <div className="w-10 h-10 bg-art-secondary/50 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <action.icon size={16} />
                      </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-art-text/20 group-hover:text-art-text/40 transition-colors relative z-10">{action.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={() => { setResult(null); setActiveAction(null); }}
                  className="group flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-art-text text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChevronRight size={14} className="rotate-180" />
                  </div>
                  <span className="text-[10px] font-black text-art-text uppercase tracking-widest group-hover:opacity-60 transition-opacity">Reset Synthesis</span>
                </button>
                {activeAction && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={downloadResult}
                      className="p-2 hover:bg-orange-500/10 rounded-full transition-colors text-orange-500"
                      title="Download Synthesis"
                    >
                      <Download size={16} />
                    </button>
                    <div className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                      {activeAction === 'transform' ? 'Neural Synthesis' : activeAction}
                    </div>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-12 relative min-h-[400px]">
                  {/* Neural Particles Background */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-orange-500/10 rounded-full"
                        initial={{ 
                          x: Math.random() * 400, 
                          y: Math.random() * 400,
                          opacity: 0 
                        }}
                        animate={{ 
                          x: [null, Math.random() * 400],
                          y: [null, Math.random() * 400],
                          opacity: [0, 0.3, 0],
                          scale: [0.5, 2, 0.5]
                        }}
                        transition={{ 
                          duration: 8 + Math.random() * 10, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative group">
                    {/* Pulsing Aura */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 -m-8 bg-orange-500 rounded-full blur-3xl"
                    />

                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 border-[0.5px] border-orange-500/20 rounded-[35%] flex items-center justify-center"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-20 h-20 border-[3px] border-t-orange-500 border-art-text/5 rounded-full" />
                      </motion.div>
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Brain size={40} className="text-orange-500/80 filter drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="text-center space-y-6 relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={loadingStep}
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                        className="space-y-2"
                      >
                        <p className="text-[12px] uppercase tracking-[0.6em] font-black text-art-text/70">
                          {loadingMessages[loadingStep]}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-art-text/20 italic">
                          Synchronizing cognitive nodes...
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-center items-center gap-4">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-orange-500/20" />
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div 
                            key={i}
                            animate={{ 
                              height: [4, 12, 4],
                              opacity: [0.2, 1, 0.2]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.5, 
                              delay: i * 0.1,
                              ease: "easeInOut"
                            }}
                            className="w-1 bg-orange-500 rounded-full"
                          />
                        ))}
                      </div>
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-orange-500/20" />
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="prose prose-sm prose-zinc font-serif text-art-text leading-relaxed bg-white rounded-[28px] sm:rounded-[50px] p-5 sm:p-10 border border-art-text/5 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Brain size={160} />
                  </div>
                  <div className="relative z-10 markdown-body">
                    <ReactMarkdown>{result || ''}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 sm:p-10 bg-art-secondary border-t border-art-text/8 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-art-text/5 flex items-center justify-center shrink-0">
            <Sparkles size={12} className="text-orange-500" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-art-text/30 leading-relaxed pt-1">
            AI synthesis optimized for cognitive accessibility. 
            Cross-reference for critical research applications.
          </p>
        </div>
      </div>
    </motion.div>
    </>
  );
}

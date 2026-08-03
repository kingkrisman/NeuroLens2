/**
 * Intelligent Text Simplification Engine
 * Converts complex academic/technical text into accessible language
 * while preserving meaning and nuance
 */

interface SimplificationResult {
  original: string;
  simplified: string;
  explanations: Record<string, string>;
  complexity: 'easy' | 'moderate' | 'complex';
}

// Common complex word patterns and their simpler alternatives
const complexToSimple: Record<string, string> = {
  'phenomenon': 'event or thing that happens',
  'cognitive': 'thinking or mental',
  'significant': 'important or big',
  'friction': 'resistance or difficulty',
  'implications': 'effects or results',
  'neurodivergent': 'having a different way of thinking',
  'environment': 'setting or surroundings',
  'manifestation': 'sign or display',
  'facilitate': 'help or make easier',
  'utilize': 'use or employ',
  'demonstrate': 'show or prove',
  'ameliorate': 'make better or improve',
  'exacerbate': 'make worse',
  'arbitrary': 'random or based on no reason',
  'benign': 'not harmful or safe',
  'substantive': 'real or important',
  'meticulous': 'careful and precise',
  'proficient': 'skilled or competent',
  'ephemeral': 'temporary or short-lived',
  'ubiquitous': 'everywhere or common',
  'defunct': 'no longer working',
  'esoteric': 'only understood by a few',
  'aggregate': 'total or combined',
  'culmination': 'end or result',
  'discrepancy': 'difference or gap',
  'empirical': 'based on real observation',
  'hypothesis': 'educated guess or theory',
  'pervasive': 'spreading everywhere',
  'amelioration': 'improvement or making better',
  'trajectory': 'path or course',
  'paradigm': 'pattern or model',
  'dichotomy': 'split into two opposite things',
  'ambiguous': 'unclear or confusing',
  'nuance': 'subtle detail or difference',
  'coherent': 'logical or making sense',
  'synthesis': 'combining things together',
  'analysis': 'breaking down to understand',
  'comprehensive': 'complete or thorough',
  'constrain': 'limit or restrict',
  'propensity': 'tendency or inclination',
  'magnitude': 'size or importance',
  'proliferate': 'multiply or spread quickly',
};

// Academic phrase replacements
const complexPhrases: Record<string, string> = {
  'in light of': 'because of',
  'in the context of': 'in',
  'with respect to': 'about',
  'in order to': 'to',
  'in accordance with': 'following',
  'notwithstanding': 'despite',
  'furthermore': 'also',
  'moreover': 'also',
  'nevertheless': 'however',
  'albeit': 'although',
  'thus': 'so',
  'consequently': 'as a result',
  'arguably': 'possibly or probably',
  'it is worth noting': 'it is important to know',
  'in consideration of': 'thinking about',
  'prior to': 'before',
  'subsequent to': 'after',
  'inasmuch as': 'because',
  'heretofore': 'before now',
  'notwithstanding the foregoing': 'even so',
};

/**
 * Detect text complexity level
 */
function detectComplexity(text: string): 'easy' | 'moderate' | 'complex' {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const avgSentenceLength = text.split(/\s+/).length / sentences.length;
  
  const complexWords = Object.keys(complexToSimple).filter(word =>
    new RegExp(`\\b${word}\\b`, 'gi').test(text)
  ).length;
  
  const complexPhrasesCount = Object.keys(complexPhrases).filter(phrase =>
    new RegExp(`\\b${phrase}\\b`, 'gi').test(text)
  ).length;
  
  const complexityScore = (avgSentenceLength / 20) + (complexWords / 5) + (complexPhrasesCount / 3);
  
  if (complexityScore < 1) return 'easy';
  if (complexityScore < 2.5) return 'moderate';
  return 'complex';
}

/**
 * Replace complex words with simpler alternatives
 */
function simplifyWords(text: string): { text: string; explanations: Record<string, string> } {
  const explanations: Record<string, string> = {};
  let simplifiedText = text;
  
  Object.entries(complexToSimple).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    if (regex.test(simplifiedText)) {
      explanations[complex] = simple;
      simplifiedText = simplifiedText.replace(regex, (match) => {
        // Preserve capitalization
        if (match[0] === match[0].toUpperCase()) {
          return simple.charAt(0).toUpperCase() + simple.slice(1);
        }
        return simple;
      });
    }
  });
  
  return { text: simplifiedText, explanations };
}

/**
 * Replace complex phrases with simpler ones
 */
function simplifyPhrases(text: string): string {
  let simplifiedText = text;
  
  Object.entries(complexPhrases).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplifiedText = simplifiedText.replace(regex, simple);
  });
  
  return simplifiedText;
}

/**
 * Break long sentences into shorter, clearer ones
 */
function breakLongSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  return sentences.map(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // If sentence is very long (20+ words), try to break it at conjunctions
    if (words.length > 20) {
      const conjunctions = /\s+(because|although|however|but|and|or|when|if|since|unless)\s+/gi;
      const parts = sentence.split(conjunctions);
      
      return parts
        .filter(part => part && !part.match(/^(because|although|however|but|and|or|when|if|since|unless)$/i))
        .map(part => part.trim())
        .filter(part => part.length > 0)
        .join('. ');
    }
    
    return sentence.trim();
  }).join(' ');
}

/**
 * Add explanations for technical terms
 */
function addExplanations(text: string, explanations: Record<string, string>): string {
  let enhanced = text;
  
  Object.entries(explanations).forEach(([term, explanation]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    enhanced = enhanced.replace(regex, (match) => {
      // Don't double-explain if already explained in context
      if (enhanced.includes(`${match} (${explanation})`)) return match;
      return `${match} (${explanation})`;
    });
  });
  
  return enhanced;
}

/**
 * Main simplification function
 */
export function simplifyText(originalText: string, includeExplanations: boolean = true): SimplificationResult {
  if (!originalText || originalText.trim().length === 0) {
    return {
      original: originalText,
      simplified: originalText,
      explanations: {},
      complexity: 'easy',
    };
  }
  
  const complexity = detectComplexity(originalText);
  
  // Apply simplifications in order
  let simplified = originalText;
  let explanations: Record<string, string> = {};
  
  // Step 1: Replace complex words
  const wordResult = simplifyWords(simplified);
  simplified = wordResult.text;
  explanations = { ...explanations, ...wordResult.explanations };
  
  // Step 2: Replace complex phrases
  simplified = simplifyPhrases(simplified);
  
  // Step 3: Break long sentences
  simplified = breakLongSentences(simplified);
  
  // Step 4: Add explanations if requested
  if (includeExplanations && Object.keys(explanations).length > 0) {
    simplified = addExplanations(simplified, explanations);
  }
  
  return {
    original: originalText,
    simplified: simplified.trim(),
    explanations,
    complexity,
  };
}

/**
 * Simplify paragraph by paragraph
 */
export function simplifyDocument(content: string, includeExplanations: boolean = true): string {
  const paragraphs = content.split(/\n\s*\n/);
  
  return paragraphs
    .map(para => {
      const result = simplifyText(para, includeExplanations);
      return result.simplified;
    })
    .join('\n\n');
}

/**
 * Get readability metrics
 */
export function getReadabilityMetrics(text: string): {
  averageSentenceLength: number;
  averageWordLength: number;
  complexityLevel: 'easy' | 'moderate' | 'complex';
  estimatedGradeLevel: number;
} {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.split(/\s+/);
  const characters = text.replace(/\s/g, '').length;
  
  const averageSentenceLength = words.length / sentences.length;
  const averageWordLength = characters / words.length;
  const complexityLevel = detectComplexity(text);
  
  // Flesch-Kincaid Grade Level approximation
  const gradeLevel = Math.max(
    0,
    Math.min(18, 0.39 * averageSentenceLength + 11.8 * (characters / words.length) - 15.59)
  );
  
  return {
    averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
    complexityLevel,
    estimatedGradeLevel: Math.round(gradeLevel),
  };
}

/**
 * Compare original vs simplified metrics
 */
export function compareReadability(original: string, simplified: string): {
  original: ReturnType<typeof getReadabilityMetrics>;
  simplified: ReturnType<typeof getReadabilityMetrics>;
  improvement: number; // percentage
} {
  const originalMetrics = getReadabilityMetrics(original);
  const simplifiedMetrics = getReadabilityMetrics(simplified);
  
  const improvement = Math.round(
    ((originalMetrics.estimatedGradeLevel - simplifiedMetrics.estimatedGradeLevel) /
      originalMetrics.estimatedGradeLevel) *
      100
  );
  
  return {
    original: originalMetrics,
    simplified: simplifiedMetrics,
    improvement: Math.max(0, improvement),
  };
}

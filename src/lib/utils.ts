import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Intelligent Bionic Reading Processor
 * Applies adaptive fixation points based on semantic importance, word length, and context.
 * Prioritizes readability and cognitive accessibility over aggressive visual emphasis.
 */
export function processBionicText(
  text: string,
  strength: number = 0.5,
  rhythmOverride: boolean = false
): string {
  if (!text || strength <= 0) return text;

  // Common filler words with minimal cognitive importance
  const fillerWords = new Set([
    'the', 'and', 'of', 'in', 'is', 'to', 'a', 'it', 'for', 'with', 'on', 'as', 'at', 'by', 'an', 'be',
    'this', 'that', 'or', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'from', 'into', 'about', 'during', 'before',
    'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'than', 'which', 'who', 'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'no', 'nor', 'not', 'only', 'same', 'so', 'some', 'such', 'too', 'very', 'just', 'am', 'my', 'me'
  ]);

  // Strong emphasis words - verbs and action words
  const actionWords = new Set([
    'said', 'says', 'told', 'tell', 'ask', 'asked', 'show', 'showed', 'give', 'gave', 'make', 'made',
    'take', 'took', 'come', 'came', 'go', 'went', 'get', 'got', 'think', 'thought', 'know', 'knew',
    'see', 'saw', 'want', 'wanted', 'use', 'used', 'find', 'found', 'work', 'worked', 'try', 'tried',
    'help', 'helped', 'call', 'called', 'ask', 'asked', 'need', 'needed', 'feel', 'felt', 'become',
    'leave', 'left', 'put', 'start', 'started', 'seem', 'seemed', 'tell', 'turn', 'turned', 'move',
    'live', 'lived', 'believe', 'believed', 'hold', 'held', 'bring', 'brought', 'begin', 'began'
  ]);

  // Split text while preserving whitespace and punctuation
  const sentenceRegex = /([^.!?]*[.!?]+)/g;
  const sentences = text.match(sentenceRegex) || [text];

  return sentences.map(sentence => {
    const parts = sentence.split(/(\s+)/);
    let wordInSentence = 0;
    let contentWords = 0;

    return parts.map(part => {
      // Preserve whitespace
      if (/^\s+$/.test(part)) return part;

      // Extract word and punctuation
      const match = part.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9']+)([^a-zA-Z0-9]*)$/);
      if (!match) return part;

      const [_, prefix, word, suffix] = match;
      const lowerWord = word.toLowerCase();
      const len = word.length;

      wordInSentence++;

      // Determine semantic importance score (0 = filler, 1 = critical)
      let importanceScore = 0.5; // Default for neutral words

      if (fillerWords.has(lowerWord)) {
        importanceScore = 0.1; // Filler words get minimal emphasis
      } else if (actionWords.has(lowerWord)) {
        importanceScore = 1; // Action verbs are critical
      } else if (len >= 7) {
        // Longer substantive words (nouns, adjectives, adverbs) get higher importance
        importanceScore = 0.85;
      } else if (len >= 4) {
        // Medium-length words
        importanceScore = 0.7;
      }

      // Sentence position boost: First 2-3 words get slightly more emphasis for context
      let positionBoost = 1;
      if (rhythmOverride && wordInSentence <= 2) {
        positionBoost = 1.15;
      }

      // Final effective strength combines base strength, importance, position, and rhythm
      let effectiveStrength = strength * importanceScore * positionBoost;

      // Calculate intelligent fixation point (not just the start)
      let boldLength = 0;
      let boldStart = 0;

      if (len <= 2) {
        // Very short words: minimal fixation
        boldLength = importanceScore > 0.7 ? 1 : 0;
        boldStart = 0;
      } else if (len === 3) {
        // 3-char words: 1 char if important
        boldLength = importanceScore > 0.6 ? 1 : 0;
        boldStart = 0;
      } else if (len <= 5) {
        // 4-5 char words: emphasize first 1-2 chars based on importance
        boldLength = Math.ceil(len * (effectiveStrength * 0.3));
        boldStart = 0;
      } else if (len <= 8) {
        // 6-8 char words: emphasize first 2-3 chars (key recognition point)
        boldLength = Math.ceil(len * (effectiveStrength * 0.35));
        boldStart = 0;
      } else {
        // Longer words: emphasize first 3-4 chars or first syllable equivalent (30-35%)
        boldLength = Math.ceil(len * (effectiveStrength * 0.33));
        boldStart = 0;
      }

      boldLength = Math.min(boldLength, len - 1); // Never bold entire word
      if (boldLength <= 0) return part;

      const boldPart = word.substring(boldStart, boldStart + boldLength);
      const regularPart = word.substring(boldStart + boldLength);

      return `${prefix}<span class="fixation font-bold">${boldPart}</span>${regularPart}${suffix}`;
    }).join('');
  }).join('');
}

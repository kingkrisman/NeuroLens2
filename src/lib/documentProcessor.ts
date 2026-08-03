export interface ProcessedDocument {
  content: string;
  title: string;
  metadata: {
    format: string;
    pageCount?: number;
    wordCount: number;
    estimatedReadTime: number;
  };
}

/**
 * Extract text from PDF files
 */
export async function processPDF(file: File): Promise<ProcessedDocument> {
  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    const pageCount = pdf.numPages;
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += strings + '\n\n';
    }
    
    const wordCount = fullText.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    return {
      content: fullText.trim(),
      title: file.name.replace('.pdf', ''),
      metadata: {
        format: 'PDF',
        pageCount,
        wordCount,
        estimatedReadTime,
      },
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file');
  }
}

/**
 * Extract text from plain text files
 */
export async function processPlainText(file: File): Promise<ProcessedDocument> {
  try {
    const text = await file.text();
    const wordCount = text.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200);
    
    return {
      content: text.trim(),
      title: file.name.replace('.txt', ''),
      metadata: {
        format: 'TXT',
        wordCount,
        estimatedReadTime,
      },
    };
  } catch (error) {
    console.error('Text processing error:', error);
    throw new Error('Failed to process text file');
  }
}

/**
 * Process multiple document types intelligently
 */
export async function processDocument(file: File): Promise<ProcessedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return processPDF(file);
    case 'txt':
      return processPlainText(file);
    case 'md':
      return processPlainText(file);
    default:
      // Default to text processing for unknown types
      if (file.type.includes('text')) {
        return processPlainText(file);
      }
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Intelligently chunk document into sections
 * Preserves semantic structure and improves readability
 */
export function chunkDocument(
  content: string,
  maxChunkSize: number = 500
): string[] {
  // Split by double newlines (paragraphs) first
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    
    // If single paragraph is larger than max size, split by sentences
    if (words > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).split(/\s+/).length > maxChunkSize) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence.trim();
        } else {
          currentChunk += ' ' + sentence;
        }
      }
    } else if ((currentChunk + '\n\n' + para).split(/\s+/).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Estimate reading time based on word count
 * Accounts for different reader speeds and content complexity
 */
export function estimateReadingTime(
  wordCount: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): {
  minutes: number;
  formattedTime: string;
} {
  const wordsPerMinute = {
    easy: 250,
    medium: 200,
    hard: 150,
  };
  
  const minutes = Math.ceil(wordCount / wordsPerMinute[difficulty]);
  
  if (minutes < 1) return { minutes: 1, formattedTime: 'Less than 1 min' };
  if (minutes === 1) return { minutes: 1, formattedTime: '1 min' };
  if (minutes < 60) return { minutes, formattedTime: `${minutes} min read` };
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  
  if (remainingMins === 0) {
    return { minutes, formattedTime: `${hours}h read` };
  }
  
  return { minutes, formattedTime: `${hours}h ${remainingMins}m read` };
}

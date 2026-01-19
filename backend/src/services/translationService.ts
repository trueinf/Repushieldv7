import OpenAI from 'openai';

export class TranslationService {
  private openai: OpenAI;

  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async translateToEnglish(text: string): Promise<string> {
    try {
      if (!text || text.trim().length === 0) {
        return text;
      }

      // Check if text is already in English (simple heuristic)
      const isLikelyEnglish = this.detectLanguage(text);
      
      let targetLanguage: string;
      let systemPrompt: string;
      let userPrompt: string;
      
      if (isLikelyEnglish === 'en') {
        // If English, translate to Hindi
        targetLanguage = 'Hindi';
        console.log(`[Translation Service] Text is English, translating to Hindi (${text.length} chars)`);
        systemPrompt = 'You are a professional translator. Translate the given English text to Hindi. Preserve the original meaning, tone, and context. Use natural Hindi language. Only return the translated text, no explanations or additional text.';
        userPrompt = `Translate this English text to Hindi:\n\n${text}`;
      } else {
        // If not English, translate to English
        targetLanguage = 'English';
        console.log(`[Translation Service] Text is not English, translating to English (${text.length} chars)`);
        systemPrompt = 'You are a professional translator. Translate the given text to English. Preserve the original meaning, tone, and context. Only return the translated text, no explanations or additional text.';
        userPrompt = `Translate this text to English:\n\n${text}`;
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const translatedText = completion.choices[0]?.message?.content?.trim() || text;

      console.log(`[Translation Service] Translation to ${targetLanguage} completed (${translatedText.length} chars)`);
      return translatedText;
    } catch (error: any) {
      console.error('[Translation Service] Error translating text:', error.message);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Simple language detection heuristic
   * Returns 'en' if likely English, 'other' otherwise
   */
  private detectLanguage(text: string): 'en' | 'other' {
    // Simple heuristic: check for common English words
    const commonEnglishWords = ['the', 'and', 'is', 'are', 'was', 'were', 'this', 'that', 'with', 'from', 'have', 'has', 'had', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'must'];
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    // Count English words
    let englishWordCount = 0;
    for (const word of words.slice(0, 20)) { // Check first 20 words
      if (commonEnglishWords.includes(word.replace(/[^\w]/g, ''))) {
        englishWordCount++;
      }
    }

    // If more than 30% of words are common English words, likely English
    if (words.length > 0 && englishWordCount / Math.min(words.length, 20) > 0.3) {
      return 'en';
    }

    return 'other';
  }
}





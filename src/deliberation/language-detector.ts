export function detectOrResolveLanguage(question: string, override?: string): string {
  if (override && override.trim()) {
    const clean = override.trim().toLowerCase();
    const map: Record<string, string> = {
      pt: 'Portuguese',
      'pt-br': 'Portuguese (Brazil)',
      en: 'English',
      'en-us': 'English',
      es: 'Spanish',
      ja: 'Japanese',
      de: 'German',
      fr: 'French',
      it: 'Italian',
      ru: 'Russian',
      zh: 'Chinese',
    };
    return map[clean] || override;
  }

  const text = question.toLowerCase();

  // Japanese characters
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(question)) {
    return 'Japanese';
  }

  // Chinese characters (without Japanese kana)
  if (/[\u4E00-\u9FFF]/.test(question)) {
    return 'Chinese';
  }

  // Cyrillic (Russian, etc.)
  if (/[\u0400-\u04FF]/.test(question)) {
    return 'Russian';
  }

  // Portuguese indicators
  if (
    /\b(devemos|você|não|reescrever|arquitetura|microsserviços|sistema|qual|como|por que|é|são|para|com|isso|este|esta)\b/i.test(text) ||
    /[ãõçáéíóúâêîôû]/.test(text)
  ) {
    // Check if it's Spanish vs Portuguese
    if (/\b(debemos|usted|cómo|cuál|por qué|ñ)\b/i.test(text)) {
      return 'Spanish';
    }
    return 'Portuguese';
  }

  // Spanish indicators
  if (/\b(debemos|usted|cómo|cuál|por qué|servicios|sistema)\b/i.test(text) || /[ñ¿¡]/.test(text)) {
    return 'Spanish';
  }

  // German indicators
  if (/\b(sollten|wir|warum|nicht|und|ist)\b/i.test(text) || /[äöüß]/.test(text)) {
    return 'German';
  }

  // French indicators
  if (/\b(devrions|nous|pourquoi|est-ce|avec|dans)\b/i.test(text) || /[œæçèéêëàâùûîï]/.test(text)) {
    return 'French';
  }

  return 'English';
}

export function getLanguageInstruction(language: string): string {
  return (
    `CRITICAL MULTILINGUAL INSTRUCTION:\n` +
    `You must conduct your entire reasoning, analysis, critiques, and explanations in ${language}.\n` +
    `All string values inside the JSON output (summary, keyArguments, criticalAssumptions, identifiedRisks, recommendedAction, rebuttal, etc.) MUST be fluently written in ${language}.\n` +
    `All JSON object keys must remain in English exactly as specified by the schema.`
  );
}

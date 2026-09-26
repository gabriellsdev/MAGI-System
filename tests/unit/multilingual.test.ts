import { describe, it, expect } from 'vitest';
import {
  detectOrResolveLanguage,
  getLanguageInstruction,
} from '../../src/deliberation/language-detector.js';

describe('Multilingual Detection & Instruction Engine', () => {
  it('should detect Portuguese from query words and characters', () => {
    const query = 'Devemos reescrever a arquitetura em microsserviços?';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('Portuguese');
  });

  it('should detect Spanish from query words', () => {
    const query = '¿Debemos migrar los servicios a la nube?';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('Spanish');
  });

  it('should detect Japanese from Kana / Kanji script', () => {
    const query = 'モノリスからマイクロサービスへ移行すべきですか？';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('Japanese');
  });

  it('should detect German from query words and umlauts', () => {
    const query = 'Sollten wir unsere Architektur ändern?';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('German');
  });

  it('should detect French from query words', () => {
    const query = 'Devrions-nous migrer vers une nouvelle architecture?';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('French');
  });

  it('should default to English for standard ASCII questions without foreign keywords', () => {
    const query = 'Should we implement automated CI/CD pipelines?';
    const lang = detectOrResolveLanguage(query);
    expect(lang).toBe('English');
  });

  it('should honor explicit language override flags', () => {
    expect(detectOrResolveLanguage('Any question', 'pt')).toBe('Portuguese');
    expect(detectOrResolveLanguage('Any question', 'ja')).toBe('Japanese');
    expect(detectOrResolveLanguage('Any question', 'Spanish')).toBe('Spanish');
  });

  it('should generate strict instructions ensuring English JSON keys and target language text', () => {
    const instruction = getLanguageInstruction('Portuguese');
    expect(instruction).toContain('Portuguese');
    expect(instruction).toContain('All string values inside the JSON output');
    expect(instruction).toContain('All JSON object keys must remain in English');
  });
});

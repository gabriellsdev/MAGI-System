import en from './en.js';
import pt from './pt.js';
import es from './es.js';
import fr from './fr.js';
import de from './de.js';
import ru from './ru.js';
import ja from './ja.js';
export { CURATED_MOCK_CATEGORIES, CURATED_MOCK_DILEMMAS } from './dilemmas.js';

export const I18N = {
  en,
  pt,
  es,
  fr,
  de,
  ru,
  ja,
};

export let currentLang = typeof localStorage !== 'undefined' ? (localStorage.getItem('magi_language') || 'en') : 'en';

export function setLanguage(lang) {
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('magi_language', lang);
  }
}

export function t(key, lang = currentLang) {
  const dict = I18N[lang] || I18N.en;
  return dict[key] || I18N.en[key] || key;
}

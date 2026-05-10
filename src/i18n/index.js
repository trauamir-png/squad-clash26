import en from './en.js';
import he from './he.js';

const LANGS = { en, he };
const STORAGE_KEY = 'squad_clash_language';

let _lang = localStorage.getItem(STORAGE_KEY) ?? 'en';

export function getLanguage() {
  return _lang;
}

export function setLanguage(lang) {
  _lang = LANGS[lang] ? lang : 'en';
  localStorage.setItem(STORAGE_KEY, _lang);
  document.documentElement.dir  = _lang === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = _lang;
}

export function t(key, vars) {
  const str = LANGS[_lang]?.[key] ?? LANGS.en[key] ?? key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// Apply direction/lang on module init so the page is correct before first render
setLanguage(_lang);

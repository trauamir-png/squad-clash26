import en from './en.js';
import he from './he.js';

const LANGS = { en, he };
const STORAGE_KEY = 'squad_clash_language';

let _lang = localStorage.getItem(STORAGE_KEY) ?? 'en';

export function getLanguage() {
  return _lang;
}

function applyToDOM(lang) {
  document.documentElement.dir  = lang === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Called only when the user explicitly picks a language — writes to localStorage.
export function setLanguage(lang) {
  _lang = LANGS[lang] ? lang : 'en';
  localStorage.setItem(STORAGE_KEY, _lang);
  applyToDOM(_lang);
}

export function t(key, vars) {
  const str = LANGS[_lang]?.[key] ?? LANGS.en[key] ?? key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// Apply DOM attributes on init but do NOT write to localStorage —
// localStorage must stay empty until the user makes an explicit choice.
applyToDOM(_lang);

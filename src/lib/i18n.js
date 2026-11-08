import ru from '@/content/ru';
import en from '@/content/en';

export const LANGS = [
  { code: 'ru', short: 'RU', name: 'Русский' },
  { code: 'en', short: 'EN', name: 'English' },
];

const dictionaries = { ru, en };
const DEFAULT_LANG = 'ru';
const STORAGE_KEY = 'grant_lang';

export function getLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && dictionaries[stored]) return stored;
  } catch {
    // приватный режим без доступа к localStorage
  }
  return DEFAULT_LANG;
}

/** Тексты интерфейса. Объект живой: applyLanguage() подменяет в нём значения. */
export const t = { ...dictionaries[getLanguage()] };

/** Код локали для форматирования дат. */
export function dateLocale() {
  return t.locale === 'en' ? 'en-GB' : 'ru-RU';
}

/** Переключает язык и запоминает выбор. Вызывать из LanguageProvider. */
export function applyLanguage(lang) {
  const code = dictionaries[lang] ? lang : DEFAULT_LANG;
  const dict = dictionaries[code];

  Object.keys(t).forEach((key) => {
    if (!(key in dict)) delete t[key];
  });
  Object.assign(t, dict);

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // сохранить выбор не удалось — не критично
  }
  if (typeof document !== 'undefined') document.documentElement.lang = code;

  return code;
}

if (typeof document !== 'undefined') document.documentElement.lang = t.locale;

export default t;
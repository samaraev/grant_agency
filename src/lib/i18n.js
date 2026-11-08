import ru from '@/content/ru';

// Единственная точка подключения языка. Чтобы добавить английский:
// создайте src/content/en.js с той же структурой и раскомментируйте строку ниже.
// import en from '@/content/en';

const dictionaries = { ru };

export const LOCALE = 'ru';

/** Тексты интерфейса для текущей локали. */
export const t = dictionaries[LOCALE];

export default t;
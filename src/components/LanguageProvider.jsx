import { Fragment, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { applyLanguage, getLanguage } from '@/lib/i18n';

const LangContext = createContext({ lang: getLanguage(), setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

/** Хранит выбранный язык и перерисовывает дерево при переключении. */
export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getLanguage);

  const change = useCallback((next) => {
    setLang(applyLanguage(next));
  }, []);

  const value = useMemo(() => ({ lang, setLang: change }), [lang, change]);

  return (
    <LangContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  );
}
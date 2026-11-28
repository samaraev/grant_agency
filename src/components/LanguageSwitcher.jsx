import { LANGS, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLang } from '@/components/LanguageProvider';

export default function LanguageSwitcher({ className }) {
  const { lang, setLang } = useLang();

  return (
    <div
      className={cn('flex items-center border border-border', className)}
      role="group"
      aria-label={t.nav.language}
    >
      {LANGS.map((item) => {
        const active = lang === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLang(item.code)}
            aria-pressed={active}
            aria-label={item.name}
            lang={item.code}
            className={cn(
              'h-[36px] min-w-[38px] px-2 text-[11px] font-semibold tracking-[0.14em] transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
}
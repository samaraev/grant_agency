import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLead } from '@/components/LeadProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header({ settings, onCta }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { openLead } = useLead();
  const handleCta = onCta || (() => openLead({ type: 'owner_appraise' }));

  const links = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/search', label: t.nav.search },
    { to: '/sobstvennikam', label: t.nav.owners },
    { to: '/pokupatelyam', label: t.nav.buyers },
    { to: '/uslugi', label: t.nav.services },
    { to: '/o-nas', label: t.nav.about },
    { to: '/kontakty', label: t.nav.contacts },
  ];

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1a2025]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 lg:h-20 lg:gap-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-3"
          aria-label={`${t.brand.name} — ${t.nav.home}`}
        >
          <span className="h-9 w-[3px] bg-[#c8102e]" aria-hidden="true" />
          <span className="flex flex-col leading-none">
            <span className="text-[19px] font-extrabold tracking-[0.14em] text-white">
              {t.brand.name}
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[#8b969b]">
              {t.brand.sub}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label={t.nav.menu}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative text-[13px] tracking-wide transition-colors',
                  isActive ? 'text-white' : 'text-[#b0b8bc] hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span className="absolute -bottom-[26px] left-0 h-[2px] w-full bg-[#c8102e]" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          {settings?.phone ? (
            <a
              href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
              className="hidden items-center gap-2 text-[13px] text-[#b0b8bc] transition-colors hover:text-white xl:flex"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {settings.phone}
            </a>
          ) : null}
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleCta}
            className="hidden min-h-[44px] items-center bg-[#eee7dc] px-5 text-[13px] font-semibold text-[#1a2025] transition-colors hover:bg-white sm:flex"
          >
            {t.nav.cta}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center border border-white/15 text-white lg:hidden"
            aria-label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#1f272c] lg:hidden">
          <nav
            className="mx-auto flex max-w-[1240px] flex-col px-5 py-3"
            aria-label={t.nav.menu}
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex min-h-[48px] items-center border-b border-white/5 text-[15px] text-[#d7dcde] last:border-0"
              >
                {link.label}
              </Link>
            ))}
            {settings?.phone ? (
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                className="flex min-h-[48px] items-center gap-2 text-[15px] font-semibold text-white"
              >
                <Phone className="h-4 w-4 text-[#c9b28c]" aria-hidden="true" />
                {settings.phone}
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
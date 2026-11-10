import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Phone, LayoutDashboard } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLead } from '@/components/LeadProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { track } from '@/lib/track';

export default function Header({ settings, onCta }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { openLead } = useLead();
  const handleCta = onCta || (() => openLead({ type: 'owner_appraise' }));

  const links = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/search', label: t.nav.search },
    { to: '/sobstvennikam', label: t.nav.owners },
    { to: '/khamovniki', label: t.nav.cluster },
    { to: '/pokupatelyam', label: t.nav.buyers },
    { to: '/uslugi', label: t.nav.services },
    { to: '/o-nas', label: t.nav.about },
    { to: '/kontakty', label: t.nav.contacts },
  ];

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 lg:h-20 lg:gap-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-3"
          aria-label={`${t.brand.name} — ${t.nav.home}`}
        >
          <span className="h-9 w-[3px] bg-primary" aria-hidden="true" />
          <span className="flex flex-col leading-none">
            <span className="text-[19px] font-extrabold tracking-[0.14em] text-foreground">
              {t.brand.name}
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              {t.brand.sub}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label={t.nav.menu}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative text-[13px] tracking-wide transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span className="absolute -bottom-[26px] left-0 h-[2px] w-full bg-primary" />
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
              onClick={() => track(t.track.phoneClick, { place: 'header' })}
              className="hidden items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground xl:flex"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {settings.phone}
            </a>
          ) : null}
          <Link
            to="/admin"
            aria-label={t.nav.admin}
            title={t.nav.admin}
            className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          </Link>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleCta}
            className="hidden min-h-[44px] items-center bg-paper px-5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground hover:text-paper sm:flex"
          >
            {t.nav.cta}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center border border-border text-foreground lg:hidden"
            aria-label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-card lg:hidden">
          <nav
            className="mx-auto flex max-w-[1240px] flex-col px-5 py-3"
            aria-label={t.nav.menu}
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex min-h-[48px] items-center border-b border-border/80 text-[15px] text-foreground last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="flex min-h-[48px] items-center gap-2 border-b border-border/80 text-[15px] text-foreground"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.nav.admin}
            </Link>
            {settings?.phone ? (
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                onClick={() => track(t.track.phoneClick, { place: 'header-menu' })}
                className="flex min-h-[48px] items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                {settings.phone}
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
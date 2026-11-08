import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function Footer({ settings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#161c20]">
      <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-[3px] bg-[#c8102e]" aria-hidden="true" />
              <div>
                <div className="text-[18px] font-extrabold tracking-[0.14em] text-white">
                  {t.brand.name}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[#8b969b]">
                  {t.brand.sub}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-[#8f9a9f]">{t.footer.about}</p>
            <p className="mt-5 text-[12px] leading-relaxed text-[#6f7a7f]">{t.footer.disclaimer}</p>
          </div>

          <div>
            <div className="eyebrow mb-4">{t.footer.navTitle}</div>
            <ul className="space-y-3 text-[13px] text-[#b0b8bc]">
              {[
                { to: '/search', label: t.nav.search },
                { to: '/sobstvennikam', label: t.nav.owners },
                { to: '/pokupatelyam', label: t.nav.buyers },
                { to: '/uslugi', label: t.nav.services },
                { to: '/o-nas', label: t.nav.about },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-4">{t.footer.legalTitle}</div>
            <ul className="space-y-3 text-[13px] text-[#b0b8bc]">
              <li>
                <Link to="/politika-konfidencialnosti" className="transition-colors hover:text-white">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/kontakty" className="transition-colors hover:text-white">
                  {t.nav.contacts}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="transition-colors hover:text-white">
                  {t.footer.adminLink}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-4">{t.footer.contactsTitle}</div>
            <ul className="space-y-4 text-[13px] text-[#b0b8bc]">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                <span>
                  {settings.office_address}
                  {settings.office_landmark ? (
                    <span className="mt-1 block text-[12px] text-[#778287]">{settings.office_landmark}</span>
                  ) : null}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                <span>{settings.working_hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[11px] text-[#6f7a7f] sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {t.brand.name}. {t.footer.rights}</span>
          <span className="uppercase tracking-[0.2em]">rieltorcenter.ru</span>
        </div>
      </div>
    </footer>
  );
}
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  Inbox,
  CalendarDays,
  FileText,
  ListChecks,
  Building2,
  Wrench,
  Users,
  Settings,
  BarChart3,
  Plug,
  LogOut,
  Home,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const nav = [
    { to: '/admin', label: t.admin.nav.dashboard, icon: LayoutDashboard, end: true },
    { to: '/admin/today', label: t.admin.nav.today, icon: Sun },
    { to: '/admin/leads', label: t.admin.nav.leads, icon: Inbox },
    { to: '/admin/meetings', label: t.admin.nav.meetings, icon: CalendarDays },
    { to: '/admin/reports', label: t.admin.nav.reports, icon: FileText },
    { to: '/admin/buildings', label: t.admin.nav.buildings, icon: Building2 },
    { to: '/admin/services', label: t.admin.nav.services, icon: Wrench },
    { to: '/admin/team', label: t.admin.nav.team, icon: Users },
    { to: '/admin/analytics', label: t.admin.nav.analytics, icon: BarChart3 },
    { to: '/admin/integrations', label: t.admin.nav.integrations, icon: Plug },
    { to: '/admin/launch', label: t.admin.nav.launch, icon: ListChecks },
    { to: '/admin/settings', label: t.admin.nav.settings, icon: Settings },
  ];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a2025]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#c8102e]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a2025] px-5">
        <div className="max-w-md border border-white/10 bg-[#263033] p-8">
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[22px] font-bold text-white">{t.admin.notAdminTitle}</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0b8bc]">{t.admin.notAdminText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex min-h-[42px] items-center bg-[#c8102e] px-4 text-[13px] font-semibold text-white"
            >
              {t.admin.loginTitle}
            </Link>
            <Link
              to="/"
              className="flex min-h-[42px] items-center border border-white/15 px-4 text-[13px] text-white"
            >
              {t.admin.toSite}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const logout = async () => {
    await base44.auth.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#1a2025] lg:flex">
      <aside className="border-b border-white/10 bg-[#1f272b] lg:min-h-screen lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-[3px] bg-[#c8102e]" aria-hidden="true" />
            <div>
              <div className="text-[15px] font-extrabold tracking-[0.14em] text-white">
                {t.brand.name}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-[#8b969b]">
                {t.admin.marker}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex min-h-[40px] items-center gap-2 border border-white/15 px-3 text-[12px] text-white transition-colors hover:bg-white/10"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              {t.admin.toSite}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[40px] shrink-0 items-center gap-2.5 px-3 text-[13px] transition-colors',
                  isActive
                    ? 'bg-[#c8102e]/15 text-white'
                    : 'text-[#9aa4a8] hover:bg-white/5 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-3 pb-5 lg:block">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[38px] w-full items-center gap-2 px-3 text-[12px] text-[#8f9a9f] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.logout}
          </button>
          <p className="mt-4 px-3 text-[11px] text-[#6f7a7f]">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
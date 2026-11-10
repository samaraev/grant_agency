import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  Inbox,
  GitBranch,
  CalendarDays,
  FileText,
  ListChecks,
  ListTodo,
  Send,
  Building2,
  Wrench,
  Users,
  Settings,
  BarChart3,
  TrendingUp,
  Plug,
  LogOut,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// ВРЕМЕННО: админ-панель открыта без входа и без проверки роли.
// Чтобы вернуть защиту, поставьте false.
const GATE_DISABLED = true;

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Навигация сгруппирована по рабочему сценарию: день → клиенты → каталог → система.
  const sections = [
    {
      key: 'daily',
      label: t.admin.nav.sections.daily,
      items: [
        { to: '/admin', label: t.admin.nav.dashboard, icon: LayoutDashboard, end: true },
        { to: '/admin/today', label: t.admin.nav.today, icon: Sun },
        { to: '/admin/tasks', label: t.admin.nav.tasks, icon: ListTodo },
        { to: '/admin/leads', label: t.admin.nav.leads, icon: Inbox },
        { to: '/admin/pipeline', label: t.admin.nav.pipeline, icon: GitBranch },
      ],
    },
    {
      key: 'clients',
      label: t.admin.nav.sections.clients,
      items: [
        { to: '/admin/meetings', label: t.admin.nav.meetings, icon: CalendarDays },
        { to: '/admin/sequences', label: t.admin.nav.sequences, icon: Send },
        { to: '/admin/reports', label: t.admin.nav.reports, icon: FileText },
      ],
    },
    {
      key: 'catalog',
      label: t.admin.nav.sections.catalog,
      items: [
        { to: '/admin/buildings', label: t.admin.nav.buildings, icon: Building2 },
        { to: '/admin/services', label: t.admin.nav.services, icon: Wrench },
        { to: '/admin/team', label: t.admin.nav.team, icon: Users },
      ],
    },
    {
      key: 'system',
      label: t.admin.nav.sections.system,
      items: [
        { to: '/admin/analytics', label: t.admin.nav.analytics, icon: BarChart3 },
        { to: '/admin/metrica', label: t.admin.nav.metrica, icon: TrendingUp },
        { to: '/admin/integrations', label: t.admin.nav.integrations, icon: Plug },
        { to: '/admin/launch', label: t.admin.nav.launch, icon: ListChecks },
        { to: '/admin/settings', label: t.admin.nav.settings, icon: Settings },
      ],
    },
  ];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!GATE_DISABLED && (!user || user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md border border-border bg-card p-8">
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[22px] font-bold text-foreground">{t.admin.notAdminTitle}</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{t.admin.notAdminText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex min-h-[42px] items-center bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
            >
              {t.admin.loginTitle}
            </Link>
            <Link
              to="/"
              className="flex min-h-[42px] items-center border border-border px-4 text-[13px] text-foreground"
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
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="border-b border-border bg-background lg:flex lg:min-h-screen lg:w-[248px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link to="/admin" className="flex min-w-0 items-center gap-3">
            <span className="h-9 shrink-0 border-l-2 border-primary" aria-hidden="true" />
            <div className="min-w-0">
              <div className="truncate font-heading text-[17px] font-semibold uppercase tracking-[0.14em] text-foreground">
                {t.brand.name}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-subtle">
                {t.admin.marker}
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t.nav.close : t.nav.menu}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              {menuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <nav
          className={cn(
            'flex-1 overflow-y-auto px-3 pb-4 lg:block',
            menuOpen ? 'block' : 'hidden'
          )}
        >
          {sections.map((section, index) => (
            <div key={section.key} className={index === 0 ? '' : 'mt-6'}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-[38px] items-center gap-2.5 border-l-2 py-1.5 pl-3 pr-2 text-[12.5px] transition-colors',
                        isActive
                          ? 'border-l-primary bg-card text-foreground'
                          : 'border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="mt-6 flex min-h-[38px] items-center gap-2.5 border-l-2 border-l-transparent py-1.5 pl-3 pr-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t.admin.toSite}</span>
          </Link>
        </nav>

        <div className="hidden border-t border-border px-3 py-4 lg:block">
          <Link
            to="/"
            className="flex min-h-[36px] w-full items-center gap-2 px-3 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.toSite}
          </Link>
          {user && (
            <>
              <button
                type="button"
                onClick={logout}
                className="flex min-h-[36px] w-full items-center gap-2 px-3 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                {t.admin.logout}
              </button>
              <p className="mt-2 truncate px-3 text-[11px] text-subtle">{user.email}</p>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
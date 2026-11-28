import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const requestedReturn = query.get('returnTo') || '/admin';
  const returnTo = requestedReturn.startsWith('/admin') && !requestedReturn.startsWith('/admin/login')
    ? requestedReturn
    : '/admin';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.functions.invoke('adminAuth', { action: 'login', password });
      setPassword('');
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.status === 503
        ? 'Вход временно недоступен. Обратитесь к администратору.'
        : 'Неверный пароль или вход временно ограничен.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-[420px] border border-border bg-card p-7 sm:p-9">
        <div className="eyebrow">ГРАНТ · АДМИНИСТРАТИВНАЯ ПАНЕЛЬ</div>
        <h1 className="mt-4 font-heading text-[26px] font-semibold">Вход для команды</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Введите пароль, чтобы продолжить.
        </p>

        {error && (
          <div role="alert" className="mt-5 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="admin-password" className="block text-xs font-medium text-muted-foreground">
            Пароль
          </label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Вход..." /> : 'Войти'}
          </button>
        </form>

        <Link to="/" className="mt-6 inline-block text-xs text-muted-foreground transition-colors hover:text-foreground">
          Вернуться на сайт
        </Link>
      </section>
    </main>
  );
}

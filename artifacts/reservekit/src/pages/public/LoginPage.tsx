import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/account');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-login-home">
          ← Back home
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-[-.05em]">Welcome back.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your bookings.</p>
        {error && <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-xs font-bold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-login-email"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-login-password"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            data-testid="button-login-submit"
          >
            {pending ? 'Signing in…' : 'Sign in'} <ArrowRight size={15} />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/signup" className="font-bold text-primary" data-testid="link-go-signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

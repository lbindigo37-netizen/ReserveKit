import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await signup(name, email, password);
      navigate('/account');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message.includes('409') ? 'An account with this email already exists.' : 'We could not create your account.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-signup-home">
          ← Back home
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-[-.05em]">Create your account.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track your bookings, favorites, and history in one place.</p>
        {error && <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-xs font-bold">
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-signup-name"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-signup-email"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-signup-password"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            data-testid="button-signup-submit"
          >
            {pending ? 'Creating account…' : 'Create account'} <ArrowRight size={15} />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary" data-testid="link-go-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

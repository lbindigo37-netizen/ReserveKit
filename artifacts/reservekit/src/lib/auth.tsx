import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useSignup,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from '@workspace/api-client-react';

type AuthContextValue = {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), retry: false } });
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  const invalidateMe = () => queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const value: AuthContextValue = {
    user: meQuery.isError ? null : meQuery.data,
    isLoading: meQuery.isLoading,
    login: async (email, password) => {
      const user = await loginMutation.mutateAsync({ data: { email, password } });
      await invalidateMe();
      return user;
    },
    signup: async (name, email, password) => {
      const user = await signupMutation.mutateAsync({ data: { name, email, password } });
      await invalidateMe();
      return user;
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
      await invalidateMe();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/** True once the initial /auth/me request has resolved (success or 401). */
export function useAuthReady(): boolean {
  const { isLoading } = useAuth();
  const [ready, setReady] = useState(!isLoading);
  useEffect(() => {
    if (!isLoading) setReady(true);
  }, [isLoading]);
  return ready;
}

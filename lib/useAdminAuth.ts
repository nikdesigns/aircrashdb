// lib/useAdminAuth.ts
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type UseAdminAuthOptions = {
  // if true, the hook will redirect to /admin/login when unauthenticated
  redirectIfUnauthenticated?: boolean;
  // optional path to redirect to after successful login; defaults to /admin
  afterLoginRedirect?: string;
};

/**
 * useAdminAuth
 *
 * Client-side hook that verifies current user by calling /api/auth/me.
 * - If not authenticated, redirects to /admin/login (unless redirectIfUnauthenticated=false).
 * - Returns { checking, authenticated } so pages can show a loading state if desired.
 *
 * Usage:
 *   const { checking, authenticated } = useAdminAuth();
 *   if (checking) return <div>Loading...</div>;
 *   // show admin UI
 */
export function useAdminAuth(options?: UseAdminAuthOptions) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const redirectIfUnauthenticated = options?.redirectIfUnauthenticated ?? true;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        const json = await res.json().catch(() => ({ authenticated: false }));
        if (!mounted) return;
        if (json && json.authenticated) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          if (redirectIfUnauthenticated) {
            // store where we wanted to go, so after login we can return if you want
            const next = router.asPath
              ? `?next=${encodeURIComponent(router.asPath)}`
              : '';
            router.replace(`/admin/login${next}`);
          }
        }
      } catch (err) {
        // treat network / server error as unauthenticated
        setAuthenticated(false);
        if (redirectIfUnauthenticated) {
          router.replace('/admin/login');
        }
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // we only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checking, authenticated };
}

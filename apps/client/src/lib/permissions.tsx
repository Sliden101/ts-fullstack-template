import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from '@tanstack/react-router';
import type { SessionUser } from '@repo/contracts';
import { graphqlRequest, AUTH_UNAUTHORIZED_EVENT } from './graphql';

export type { SessionUser };

const ME_QUERY = `query Me { me { id name email role permissions } }`;

export interface PermissionsValue {
  user: SessionUser | null;
  permissions: readonly string[];
  isLoading: boolean;
  has: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    graphqlRequest<{ me: SessionUser | null }>(ME_QUERY)
      .then((data) => {
        if (active) setUser(data.me);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      window.location.assign('/sign-in');
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const value = useMemo<PermissionsValue>(() => {
    const permissions = user?.permissions ?? [];
    return {
      user,
      permissions,
      isLoading,
      has: (permission: string) => permissions.includes(permission),
    };
  }, [user, isLoading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsValue {
  const value = useContext(PermissionsContext);
  if (!value) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return value;
}

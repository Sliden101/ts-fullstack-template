import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { getTranslation, type SupportedLanguage } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export function Forbidden({ language = 'en' }: { language?: SupportedLanguage }) {
  const t = getTranslation(language);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center"
    >
      <ShieldAlert className="h-10 w-10 text-slate-400" />
      <h2 className="text-lg font-semibold text-slate-900">
        {t.common.accessDenied}
      </h2>
      <p className="text-sm text-slate-500">{t.common.restrictedAccess}</p>
    </div>
  );
}

export function RequirePermission({
  permission,
  children,
  language,
}: {
  permission: string;
  children: ReactNode;
  language?: SupportedLanguage;
}) {
  const { has, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }
  if (!has(permission)) {
    return <Forbidden language={language} />;
  }
  return <>{children}</>;
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { has, isLoading } = usePermissions();

  if (isLoading) {
    return <>{fallback}</>;
  }
  return <>{has(permission) ? children : fallback}</>;
}

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth'
import { usePermissions } from '@/lib/permissions'
import { getTranslation } from '@/i18n'
import { SignOutButton } from '@/components/organisms/auth/sign-out-button'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data } = await getSession()
    if (!data) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = usePermissions()
  const t = getTranslation('en')

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-slate-200 px-4 py-2">
        {user?.email ? (
          <span className="text-xs text-slate-500">{user.email}</span>
        ) : null}
        <SignOutButton label={t.common.signOut} />
      </div>
      <Outlet />
    </>
  )
}

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import { PermissionsProvider } from '@/lib/permissions'

const RootLayout = () => (
  <PermissionsProvider>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>
      <Link to="/sign-in" className="[&.active]:font-bold">
        Sign In
      </Link>
    </div>
    <hr />
    <Outlet />
    <Toaster richColors position="top-right" />
    <TanStackRouterDevtools />
  </PermissionsProvider>
)

export const Route = createRootRoute({ component: RootLayout })

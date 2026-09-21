import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/lib/auth'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/lib/permissions', () => ({
  usePermissions: () => ({
    user: null,
    permissions: [],
    isLoading: false,
    has: () => false,
  }),
}))

import { Route } from '@/routes/_authenticated/route'

const mockedGetSession = vi.mocked(getSession)
const beforeLoad = Route.options.beforeLoad as unknown as (opts: {
  location: { pathname: string }
}) => Promise<unknown>

async function runGuard(pathname: string): Promise<unknown> {
  try {
    return await beforeLoad({ location: { pathname } })
  } catch (error) {
    return error
  }
}

describe('authenticated layout guard', () => {
  beforeEach(() => {
    mockedGetSession.mockReset()
  })

  it('redirects a signed-out visitor to sign-in with the attempted path', async () => {
    mockedGetSession.mockResolvedValue({ data: null } as never)

    const result = (await runGuard('/Driver-list')) as {
      options?: { to?: string; search?: unknown }
    }

    expect(result.options).toMatchObject({
      to: '/sign-in',
      search: { redirect: '/Driver-list' },
    })
  })

  it('allows a signed-in visitor through', async () => {
    mockedGetSession.mockResolvedValue({
      data: { session: { id: 's1' }, user: { id: 'u1' } },
    } as never)

    const result = await runGuard('/')

    expect(result).toBeUndefined()
  })
})

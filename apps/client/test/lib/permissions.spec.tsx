import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PermissionsProvider, usePermissions } from '@/lib/permissions'

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/' }),
}))

function Consumer() {
  const { has, user, isLoading } = usePermissions()
  if (isLoading) return <span data-testid="state">loading</span>
  return (
    <span data-testid="state">
      {`${user?.role}:${has('pokemon:read')}:${has('user:list')}`}
    </span>
  )
}

function mockMe(me: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { me } }),
    }),
  )
}

describe('PermissionsProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads permissions from the session query', async () => {
    mockMe({
      id: 'u1',
      name: 'Ops',
      email: 'ops@b.test',
      role: 'user',
      permissions: ['pokemon:read'],
    })

    render(
      <PermissionsProvider>
        <Consumer />
      </PermissionsProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe('user:true:false'),
    )
  })

  it('treats an unauthenticated response as no permissions', async () => {
    mockMe(null)

    render(
      <PermissionsProvider>
        <Consumer />
      </PermissionsProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'undefined:false:false',
      ),
    )
  })
})

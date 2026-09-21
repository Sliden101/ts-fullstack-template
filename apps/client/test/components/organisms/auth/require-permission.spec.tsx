import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RequirePermission, Can } from '@/components/organisms/auth/require-permission'
import { usePermissions } from '@/lib/permissions'
import { getTranslation } from '@/i18n'

vi.mock('@/lib/permissions', () => ({
  usePermissions: vi.fn(),
}))

const mockedUsePermissions = vi.mocked(usePermissions)
const t = getTranslation('en').common

function mockPermissions(has: (permission: string) => boolean, isLoading = false) {
  mockedUsePermissions.mockReturnValue({
    user: null,
    permissions: [],
    isLoading,
    has,
  })
}

describe('RequirePermission', () => {
  beforeEach(() => {
    mockedUsePermissions.mockReset()
  })

  it('renders children when the permission is held', () => {
    mockPermissions(() => true)

    render(
      <RequirePermission permission="pokemon:read" language="en">
        <span>secret content</span>
      </RequirePermission>,
    )

    expect(screen.getByText('secret content')).toBeTruthy()
    expect(screen.queryByText(t.accessDenied)).toBeNull()
  })

  it('renders the forbidden state without signing the user out when the permission is missing', () => {
    mockPermissions(() => false)

    render(
      <RequirePermission permission="pokemon:read" language="en">
        <span>secret content</span>
      </RequirePermission>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(t.accessDenied)).toBeTruthy()
    expect(screen.queryByText('secret content')).toBeNull()
  })

  it('renders nothing while permissions are loading', () => {
    mockPermissions(() => false, true)

    const { container } = render(
      <RequirePermission permission="pokemon:read" language="en">
        <span>secret content</span>
      </RequirePermission>,
    )

    expect(container.textContent).toBe('')
  })
})

describe('Can', () => {
  beforeEach(() => {
    mockedUsePermissions.mockReset()
  })

  it('renders children when the permission is held', () => {
    mockPermissions(() => true)

    render(
      <Can permission="user:create">
        <span>add item</span>
      </Can>,
    )

    expect(screen.getByText('add item')).toBeTruthy()
  })

  it('hides the action when the permission is missing', () => {
    mockPermissions(() => false)

    const { container } = render(
      <Can permission="user:create">
        <span>add item</span>
      </Can>,
    )

    expect(container.textContent).toBe('')
  })
})

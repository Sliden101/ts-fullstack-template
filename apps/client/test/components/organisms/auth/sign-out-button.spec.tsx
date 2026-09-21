import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignOutButton } from '@/components/organisms/auth/sign-out-button'
import { signOut } from '@/lib/auth'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn(),
}))

const mockedSignOut = vi.mocked(signOut)

describe('SignOutButton', () => {
  beforeEach(() => {
    navigate.mockReset()
    mockedSignOut.mockReset()
  })

  it('signs out on the server and returns to sign-in', async () => {
    mockedSignOut.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<SignOutButton label="Sign out" />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => expect(mockedSignOut).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in' }),
    )
  })
})

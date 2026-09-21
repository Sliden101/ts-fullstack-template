import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/components/organisms/auth/sign-in-form'
import { getTranslation } from '@/i18n'

const navigate = vi.fn()
const signIn = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/lib/auth', () => ({
  signIn: (email: string, password: string) => signIn(email, password),
}))

const t = getTranslation('en').signIn

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = 'admin@example.com',
  password = 'password123',
) {
  await user.type(screen.getByPlaceholderText('name@example.com'), email)
  await user.type(screen.getByPlaceholderText(t.password), password)
}

describe('SignInForm', () => {
  beforeEach(() => {
    navigate.mockReset()
    signIn.mockReset()
  })

  it('calls sign-in with the entered credentials and navigates on success', async () => {
    signIn.mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(<SignInForm translations={t} />)

    await fillCredentials(user, 'admin@example.com', 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('admin@example.com', 'password123'),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
  })

  it('shows the localized invalid-credentials message on 401 and keeps the email', async () => {
    signIn.mockResolvedValue({ ok: false, status: 401 })
    const user = userEvent.setup()
    render(<SignInForm translations={t} />)

    await fillCredentials(user, 'admin@example.com', 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(t.invalidCredentials)).toBeTruthy()
    expect(navigate).not.toHaveBeenCalled()
    expect(
      (screen.getByPlaceholderText('name@example.com') as HTMLInputElement)
        .value,
    ).toBe('admin@example.com')
  })

  it('shows the generic error message on an unexpected failure', async () => {
    signIn.mockResolvedValue({ ok: false, status: 500 })
    const user = userEvent.setup()
    render(<SignInForm translations={t} />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(t.signInError)).toBeTruthy()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('disables submit while the request is pending', async () => {
    let resolveSignIn: (value: { ok: true }) => void = () => {}
    signIn.mockImplementation(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveSignIn = resolve
        }),
    )
    const user = userEvent.setup()
    render(<SignInForm translations={t} />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    const pending = screen.getByRole('button', { name: /signing in/i })
    expect((pending as HTMLButtonElement).disabled).toBe(true)

    resolveSignIn({ ok: true })
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
  })

  it('does not call sign-in when the form is invalid', async () => {
    const user = userEvent.setup()
    render(<SignInForm translations={t} />)

    await user.type(screen.getByPlaceholderText('name@example.com'), 'not-an-email')
    await user.type(screen.getByPlaceholderText(t.password), 'short')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(signIn).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})

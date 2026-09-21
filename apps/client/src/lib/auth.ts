import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()

export type SignInOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: number | undefined }

export async function signIn(
  email: string,
  password: string,
): Promise<SignInOutcome> {
  const { error } = await authClient.signIn.email({ email, password })
  if (error) {
    return { ok: false, status: error.status }
  }
  return { ok: true }
}

export async function signOut(): Promise<void> {
  await authClient.signOut()
}

export function getSession() {
  return authClient.getSession()
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { graphqlRequest, AUTH_UNAUTHORIZED_EVENT } from '@/lib/graphql'

function mockResponse(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      json: async () => body,
    }),
  )
}

function listenForUnauthorized() {
  const listener = vi.fn()
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener)
  return {
    listener,
    dispose: () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener),
  }
}

describe('graphqlRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns data on success', async () => {
    mockResponse({ data: { ok: true } })

    await expect(graphqlRequest('query { ok }')).resolves.toEqual({ ok: true })
  })

  it('signals an unauthorized failure so the session is dropped', async () => {
    mockResponse({
      errors: [
        {
          message: 'Session has been revoked',
          extensions: { code: 'SESSION_REVOKED', statusCode: 401 },
        },
      ],
    })
    const { listener, dispose } = listenForUnauthorized()

    await expect(graphqlRequest('query { me { id } }')).rejects.toThrow()
    expect(listener).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('does not sign out on a forbidden failure', async () => {
    mockResponse({
      errors: [
        {
          message: 'Forbidden',
          extensions: { code: 'FORBIDDEN', statusCode: 403 },
        },
      ],
    })
    const { listener, dispose } = listenForUnauthorized()

    await expect(graphqlRequest('query { routes { id } }')).rejects.toThrow()
    expect(listener).not.toHaveBeenCalled()
    dispose()
  })
})

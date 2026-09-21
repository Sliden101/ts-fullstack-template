import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/auth.ts', () => ({ auth: {} }));

import { Logger } from '@nestjs/common';
import { AppAuthService } from '../../../../src/modules/auth/auth.service.ts';

function createService() {
  const api = {
    getSession: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
  };
  const service = new AppAuthService({ api } as never);
  return { service, api };
}

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
});

describe('AppAuthService', () => {
  it('returns the current session for the given headers', async () => {
    const { service, api } = createService();
    const session = { session: { id: 's1' }, user: { id: 'u1' } };
    api.getSession.mockResolvedValue(session);

    const result = await service.me({ cookie: 'abc' });

    expect(result).toBe(session);
    expect(api.getSession).toHaveBeenCalledTimes(1);
    const [args] = api.getSession.mock.calls[0];
    expect(args.headers).toBeInstanceOf(Headers);
    expect(args.headers.get('cookie')).toBe('abc');
  });

  it('lists sessions for the given headers', async () => {
    const { service, api } = createService();
    api.listSessions.mockResolvedValue([{ id: 's1' }]);

    const result = await service.listSessions({ cookie: 'abc' });

    expect(result).toEqual([{ id: 's1' }]);
    expect(api.listSessions).toHaveBeenCalledTimes(1);
  });

  it('does not revoke when the session is not owned by the user', async () => {
    const { service, api } = createService();
    api.listSessions.mockResolvedValue([{ id: 'other', token: 'tok' }]);

    const result = await service.revokeSession('missing', {});

    expect(result).toBe(false);
    expect(api.revokeSession).not.toHaveBeenCalled();
  });

  it('revokes the matching session by token and logs the event', async () => {
    const { service, api } = createService();
    api.listSessions.mockResolvedValue([{ id: 'target', token: 'tok-1' }]);
    api.revokeSession.mockResolvedValue({ status: true });
    const logSpy = vi.spyOn(Logger.prototype, 'log');

    const result = await service.revokeSession('target', { cookie: 'abc' });

    expect(result).toBe(true);
    expect(api.revokeSession).toHaveBeenCalledTimes(1);
    const [args] = api.revokeSession.mock.calls[0];
    expect(args.body).toEqual({ token: 'tok-1' });
    expect(args.headers).toBeInstanceOf(Headers);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('session.revoked'),
    );
  });
});

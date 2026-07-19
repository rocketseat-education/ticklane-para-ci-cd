import { authenticatedUserMock } from '@mocks/data/users';

import { apiFetch } from './apiBase';
import { verifyEmailOtp } from './verifyEmailOtp';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('verifyEmailOtp', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should return the user when verification succeeds', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, user: authenticatedUserMock }),
    });

    const signal = new AbortController().signal;
    await expect(verifyEmailOtp('ana@example.com', '123456', signal)).resolves.toEqual({
      ok: true,
      user: authenticatedUserMock,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/auth/otp/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', code: '123456' }),
      signal,
    });
  });

  it('should return api error message when present', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Código expirado' }),
    });

    await expect(verifyEmailOtp('ana@example.com', '000000')).resolves.toEqual({
      ok: false,
      error: 'Código expirado',
    });
  });

  it('should return fallback error when json parsing fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });

    await expect(verifyEmailOtp('ana@example.com', '000000')).resolves.toEqual({
      ok: false,
      error: 'Código inválido ou expirado.',
    });
  });
});

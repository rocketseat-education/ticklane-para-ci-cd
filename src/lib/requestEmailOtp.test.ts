import { apiFetch } from './apiBase';
import { requestEmailOtp } from './requestEmailOtp';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('requestEmailOtp', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should return ok true when request succeeds', async () => {
    apiFetchMock.mockResolvedValue({ ok: true });

    const signal = new AbortController().signal;
    await expect(requestEmailOtp('ana@example.com', signal)).resolves.toEqual({ ok: true });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/auth/otp/send', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com' }),
      signal,
    });
  });

  it('should return api error message when present', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email inválido' }),
    });

    await expect(requestEmailOtp('bad')).resolves.toEqual({
      ok: false,
      error: 'Email inválido',
    });
  });

  it('should return fallback error when json parsing fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    });

    await expect(requestEmailOtp('ana@example.com')).resolves.toEqual({
      ok: false,
      error: 'Não foi possível enviar o código. Tenta mais tarde.',
    });
  });
});

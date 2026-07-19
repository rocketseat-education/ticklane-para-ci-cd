import { apiFetch } from './apiBase';
import { deleteAccount } from './deleteAccount';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('deleteAccount', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should return ok true when delete succeeds', async () => {
    apiFetchMock.mockResolvedValue({ ok: true });
    const signal = new AbortController().signal;

    await expect(deleteAccount(signal)).resolves.toEqual({ ok: true });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/users/me', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
      signal,
    });
  });

  it('should return api error message when present', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Conta com execuções ativas' }),
    });

    await expect(deleteAccount()).resolves.toEqual({
      ok: false,
      error: 'Conta com execuções ativas',
    });
  });

  it('should return fallback error when json parsing fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });

    await expect(deleteAccount()).resolves.toEqual({
      ok: false,
      error: 'Não foi possível eliminar a conta.',
    });
  });
});

import { apiFetch } from './apiBase';
import { signOutApi } from './signOutApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('signOutApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should call logout endpoint with credentials', async () => {
    apiFetchMock.mockResolvedValue({ ok: true });
    const signal = new AbortController().signal;

    await signOutApi(signal);

    expect(apiFetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      signal,
    });
  });

  it('should swallow fetch errors', async () => {
    apiFetchMock.mockRejectedValue(new Error('network'));

    await expect(signOutApi()).resolves.toBeUndefined();
  });
});

import { authenticatedUserMock } from '@mocks/data/users';

import { apiFetch } from './apiBase';
import { fetchAuthMe } from './fetchAuthMe';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('fetchAuthMe', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should return the authenticated user', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: authenticatedUserMock }),
    });

    const signal = new AbortController().signal;
    await expect(fetchAuthMe(signal)).resolves.toEqual(authenticatedUserMock);
    expect(apiFetchMock).toHaveBeenCalledWith('/api/auth/me', {
      credentials: 'include',
      signal,
    });
  });

  it('should return null when user is missing in payload', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });

    await expect(fetchAuthMe()).resolves.toBeNull();
  });

  it('should return null when response is not ok', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchAuthMe()).resolves.toBeNull();
  });
});

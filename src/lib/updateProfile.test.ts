import { authenticatedUserMock } from '@mocks/data/users';

import { apiFetch } from './apiBase';
import { updateProfile } from './updateProfile';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('updateProfile', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should return updated user on success', async () => {
    const user = { ...authenticatedUserMock, displayName: 'Ana Atualizada', bio: 'bio' };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });
    const signal = new AbortController().signal;

    await expect(
      updateProfile({ displayName: 'Ana Atualizada', bio: 'bio' }, signal),
    ).resolves.toEqual({ ok: true, user });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/users/me', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Ana Atualizada', bio: 'bio' }),
      signal,
    });
  });

  it('should return api error message when present', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Nome inválido' }),
    });

    await expect(updateProfile({ displayName: '', bio: null })).resolves.toEqual({
      ok: false,
      error: 'Nome inválido',
    });
  });

  it('should return fallback error when json parsing fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });

    await expect(updateProfile({ displayName: 'Ana', bio: null })).resolves.toEqual({
      ok: false,
      error: 'Não foi possível guardar.',
    });
  });
});

import { authenticatedUserMock } from '@mocks/data/users';

import { apiFetch } from './apiBase';
import { deleteAvatar, uploadAvatar } from './uploadAvatar';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('uploadAvatar', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should upload multipart form data and return user', async () => {
    const user = { ...authenticatedUserMock, avatarUrl: '/api/uploads/a.jpg' };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });
    const signal = new AbortController().signal;

    const result = await uploadAvatar(
      { uri: 'file:///tmp/a.jpg', name: 'a.jpg', type: 'image/jpeg' },
      signal,
    );

    expect(result).toEqual({ ok: true, user });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/users/me/avatar', {
      method: 'PUT',
      credentials: 'include',
      body: expect.any(FormData),
      signal,
    });
  });

  it('should return api error or fallback on failure', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Ficheiro demasiado grande' }),
    });
    await expect(
      uploadAvatar({ uri: 'file:///tmp/a.jpg', name: 'a.jpg', type: 'image/jpeg' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Ficheiro demasiado grande',
    });

    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });
    await expect(
      uploadAvatar({ uri: 'file:///tmp/a.jpg', name: 'a.jpg', type: 'image/jpeg' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Não foi possível carregar a imagem.',
    });
  });
});

describe('deleteAvatar', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should delete avatar and return user', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: authenticatedUserMock }),
    });
    const signal = new AbortController().signal;

    await expect(deleteAvatar(signal)).resolves.toEqual({
      ok: true,
      user: authenticatedUserMock,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/users/me/avatar', {
      method: 'DELETE',
      credentials: 'include',
      signal,
    });
  });

  it('should return api error or fallback on failure', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Sem avatar' }),
    });
    await expect(deleteAvatar()).resolves.toEqual({
      ok: false,
      error: 'Sem avatar',
    });

    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });
    await expect(deleteAvatar()).resolves.toEqual({
      ok: false,
      error: 'Não foi possível remover o avatar.',
    });
  });
});

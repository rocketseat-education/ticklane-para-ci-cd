import { apiFetch } from './apiBase';
import { addFavoriteRequest, removeFavoriteRequest } from './favoriteApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('favoriteApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  describe('addFavoriteRequest', () => {
    it('should put favorite and return ok', async () => {
      apiFetchMock.mockResolvedValue({ ok: true });
      const signal = new AbortController().signal;

      await expect(addFavoriteRequest('checklist-1', signal)).resolves.toEqual({ ok: true });
      expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists/checklist-1/favorite', {
        method: 'PUT',
        credentials: 'include',
        signal,
      });
    });

    it('should encode checklist id in the path', async () => {
      apiFetchMock.mockResolvedValue({ ok: true });

      await addFavoriteRequest('a/b');

      expect(apiFetchMock.mock.calls[0][0]).toBe('/api/checklists/a%2Fb/favorite');
    });

    it('should return api error or fallback', async () => {
      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Já favoritado' }),
      });
      await expect(addFavoriteRequest('checklist-1')).resolves.toEqual({
        ok: false,
        error: 'Já favoritado',
      });

      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('bad');
        },
      });
      await expect(addFavoriteRequest('checklist-1')).resolves.toEqual({
        ok: false,
        error: 'Não foi possível favoritar.',
      });
    });
  });

  describe('removeFavoriteRequest', () => {
    it('should delete favorite and return ok', async () => {
      apiFetchMock.mockResolvedValue({ ok: true });
      const signal = new AbortController().signal;

      await expect(removeFavoriteRequest('checklist-1', signal)).resolves.toEqual({ ok: true });
      expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists/checklist-1/favorite', {
        method: 'DELETE',
        credentials: 'include',
        signal,
      });
    });

    it('should return api error or fallback', async () => {
      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Não encontrado' }),
      });
      await expect(removeFavoriteRequest('checklist-1')).resolves.toEqual({
        ok: false,
        error: 'Não encontrado',
      });

      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('bad');
        },
      });
      await expect(removeFavoriteRequest('checklist-1')).resolves.toEqual({
        ok: false,
        error: 'Não foi possível remover dos favoritos.',
      });
    });
  });
});

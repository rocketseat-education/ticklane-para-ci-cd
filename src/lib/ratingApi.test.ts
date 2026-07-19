import { apiFetch } from './apiBase';
import { setRatingRequest } from './ratingApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('setRatingRequest', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should put rating and return averageRating when present', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ averageRating: 4.2 }),
    });
    const signal = new AbortController().signal;

    await expect(setRatingRequest('checklist-1', 5, signal)).resolves.toEqual({
      ok: true,
      averageRating: 4.2,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists/checklist-1/rating', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 5 }),
      signal,
    });
  });

  it('should return ok without averageRating when payload is incomplete', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(setRatingRequest('checklist-1', 3)).resolves.toEqual({
      ok: true,
      averageRating: undefined,
    });
  });

  it('should return ok true when success json parsing fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('bad');
      },
    });

    await expect(setRatingRequest('checklist-1', 0)).resolves.toEqual({ ok: true });
  });

  it('should encode checklist id and return errors', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Score inválido' }),
    });
    await expect(setRatingRequest('a/b', 6)).resolves.toEqual({
      ok: false,
      error: 'Score inválido',
    });
    expect(apiFetchMock.mock.calls[0][0]).toBe('/api/checklists/a%2Fb/rating');

    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('bad');
      },
    });
    await expect(setRatingRequest('checklist-1', 1)).resolves.toEqual({
      ok: false,
      error: 'Não foi possível salvar a avaliação.',
    });
  });
});

import { apiFetch } from './apiBase';
import { fetchLibraryFromApi } from './fetchLibraryFromApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('fetchLibraryFromApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should fetch library with credentials and return json', async () => {
    const library = {
      checklists: [],
      categories: [],
      favorites: [],
      ratings: [],
      comments: [],
      executions: [],
    };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => library,
    });
    const signal = new AbortController().signal;

    await expect(fetchLibraryFromApi(signal)).resolves.toEqual(library);
    expect(apiFetchMock).toHaveBeenCalledWith('/api/library', {
      credentials: 'include',
      signal,
    });
  });

  it('should throw when response is not ok', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchLibraryFromApi()).rejects.toThrow('API 503 Service Unavailable');
  });
});

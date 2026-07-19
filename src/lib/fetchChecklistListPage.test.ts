import { checklistSummariesMock } from '@mocks/data/checklists';

import { apiFetch } from './apiBase';
import { fetchChecklistListPage } from './fetchChecklistListPage';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

describe('fetchChecklistListPage', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should request checklists with query params and return the page', async () => {
    const page = { items: checklistSummariesMock, total: 2 };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => page,
    });

    const signal = new AbortController().signal;
    const result = await fetchChecklistListPage(
      { page: 1, pageSize: 10, q: 'deploy', favoritesOnly: true },
      signal,
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/checklists\?/),
      { signal },
    );
    const url = apiFetchMock.mock.calls[0][0] as string;
    expect(url).toContain('page=1');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('q=deploy');
    expect(url).toContain('favoritesOnly=true');
    expect(result).toEqual(page);
  });

  it('should throw when response is not ok', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchChecklistListPage({ page: 1 })).rejects.toThrow(
      'API 500 Internal Server Error',
    );
  });
});

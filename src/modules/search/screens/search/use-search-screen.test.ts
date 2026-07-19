import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';
import type { ChecklistSummary } from '@/types';

import { useSearchScreen } from './use-search-screen';

const mockPush = jest.fn();
const mockFetchChecklistListPage = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useCategoriesCatalog: jest.fn(),
}));

jest.mock('@/lib/fetchChecklistListPage', () => ({
  fetchChecklistListPage: (...args: unknown[]) => mockFetchChecklistListPage(...args),
}));

jest.mock('@/lib/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

import { useAuth } from '@/modules/auth/context';
import { useCategoriesCatalog } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useCategoriesCatalogMock = useCategoriesCatalog as jest.Mock;

type ListPage = { items: ChecklistSummary[]; total: number };

function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function mockFetchResolved(page: ListPage) {
  mockFetchChecklistListPage.mockImplementation((_params: unknown, signal?: AbortSignal) => {
    return new Promise<ListPage>((resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const onAbort = () => reject(createAbortError());
      signal?.addEventListener('abort', onAbort, { once: true });

      queueMicrotask(() => {
        if (signal?.aborted) {
          return;
        }
        signal?.removeEventListener('abort', onAbort);
        resolve(page);
      });
    });
  });
}

function mockFetchRejected(error: Error) {
  mockFetchChecklistListPage.mockImplementation((_params: unknown, signal?: AbortSignal) => {
    return new Promise<ListPage>((_resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const onAbort = () => reject(createAbortError());
      signal?.addEventListener('abort', onAbort, { once: true });

      queueMicrotask(() => {
        if (signal?.aborted) {
          return;
        }
        signal?.removeEventListener('abort', onAbort);
        reject(error);
      });
    });
  });
}

async function settleSearch(result: { current: { loading: boolean; loadingMore: boolean } }) {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });
}

describe('useSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useCategoriesCatalogMock.mockReturnValue(categoriesMock);
    mockFetchResolved({
      items: checklistSummariesMock,
      total: checklistSummariesMock.length,
    });
  });

  it('should return copy, categories and load checklist page for authenticated user', async () => {
    const { result } = renderHook(() => useSearchScreen());

    expect(result.current.title).toBe(COPY.screens.search.title);
    expect(result.current.subtitle).toBe(COPY.screens.search.subtitle);
    expect(result.current.placeholder).toBe(COPY.screens.search.placeholder);
    expect(result.current.allCategoriesLabel).toBe(COPY.screens.search.allCategoriesLabel);
    expect(result.current.categories).toEqual(categoriesMock);
    expect(result.current.selectedCategoryId).toBeNull();
    expect(result.current.loading).toBe(true);

    await settleSearch(result);

    expect(result.current.items).toEqual(checklistSummariesMock);
    expect(result.current.total).toBe(checklistSummariesMock.length);
    expect(mockFetchChecklistListPage).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        q: '',
        categoryId: null,
        viewerId: authenticatedUserMock.id,
      }),
      expect.any(AbortSignal),
    );
  });

  it('should pass null viewerId when user is guest', async () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    const { result } = renderHook(() => useSearchScreen());

    await settleSearch(result);

    expect(mockFetchChecklistListPage).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: null }),
      expect.any(AbortSignal),
    );
  });

  it('should set listError when fetch fails', async () => {
    mockFetchRejected(new Error('Falha de rede'));

    const { result } = renderHook(() => useSearchScreen());

    await waitFor(() => {
      expect(result.current.listError).toBe('Falha de rede');
    });
    await settleSearch(result);

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should ignore AbortError from fetch', async () => {
    mockFetchRejected(createAbortError());

    const { result } = renderHook(() => useSearchScreen());

    await settleSearch(result);

    expect(result.current.listError).toBeNull();
  });

  it('should toggle category selection and refetch', async () => {
    const { result } = renderHook(() => useSearchScreen());
    await settleSearch(result);

    await act(async () => {
      result.current.handleCategoryPress(categoriesMock[0]);
    });
    expect(result.current.selectedCategoryId).toBe(categoriesMock[0].id);
    await settleSearch(result);

    expect(mockFetchChecklistListPage).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: categoriesMock[0].id }),
      expect.any(AbortSignal),
    );

    await act(async () => {
      result.current.handleCategoryPress(categoriesMock[0]);
    });
    expect(result.current.selectedCategoryId).toBeNull();
    await settleSearch(result);
  });

  it('should clear category when handleCategoryPress receives null', async () => {
    const { result } = renderHook(() => useSearchScreen());
    await settleSearch(result);

    await act(async () => {
      result.current.handleCategoryPress(categoriesMock[0]);
    });
    await settleSearch(result);

    await act(async () => {
      result.current.handleCategoryPress(null);
    });
    expect(result.current.selectedCategoryId).toBeNull();
    await settleSearch(result);
  });

  it('should load more pages when loadMore is called', async () => {
    mockFetchChecklistListPage
      .mockImplementationOnce((_params: unknown, signal?: AbortSignal) => {
        return new Promise<ListPage>((resolve, reject) => {
          if (signal?.aborted) {
            reject(createAbortError());
            return;
          }
          const onAbort = () => reject(createAbortError());
          signal?.addEventListener('abort', onAbort, { once: true });
          queueMicrotask(() => {
            if (signal?.aborted) return;
            signal?.removeEventListener('abort', onAbort);
            resolve({ items: [checklistSummariesMock[0]], total: 2 });
          });
        });
      })
      .mockImplementationOnce((_params: unknown, signal?: AbortSignal) => {
        return new Promise<ListPage>((resolve, reject) => {
          if (signal?.aborted) {
            reject(createAbortError());
            return;
          }
          const onAbort = () => reject(createAbortError());
          signal?.addEventListener('abort', onAbort, { once: true });
          queueMicrotask(() => {
            if (signal?.aborted) return;
            signal?.removeEventListener('abort', onAbort);
            resolve({ items: [checklistSummariesMock[1]], total: 2 });
          });
        });
      });

    const { result } = renderHook(() => useSearchScreen());

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });
    await settleSearch(result);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });
    await settleSearch(result);

    expect(result.current.items.map((item) => item.id)).toEqual([
      checklistSummariesMock[0].id,
      checklistSummariesMock[1].id,
    ]);
  });

  it('should not load more when already loading or all items loaded', async () => {
    const { result } = renderHook(() => useSearchScreen());
    await settleSearch(result);

    const callsBefore = mockFetchChecklistListPage.mock.calls.length;

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockFetchChecklistListPage.mock.calls.length).toBe(callsBefore);
  });

  it('should navigate to checklist details when handleChecklistPress is called', async () => {
    const { result } = renderHook(() => useSearchScreen());
    await settleSearch(result);

    await act(async () => {
      result.current.handleChecklistPress(checklistSummariesMock[0]);
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
  });
});

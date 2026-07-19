import type { ReactNode } from 'react';
import { libraryStateMock } from '@mocks/data/libraryState';
import { renderHook } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';
import type { LibraryContextValue } from './library-types';

import { LibraryContext } from './library-context';
import {
  useAllChecklists,
  useAuthorById,
  useAuthorStats,
  useCategoriesCatalog,
  useChecklist,
  useChecklistItem,
  useChecklistItems,
  useChecklistsByAuthor,
  useCommentsByAuthor,
  useCommentsByChecklist,
  useCommentsByItem,
  useFavoriteChecklists,
  useLibrary,
  usePopularChecklists,
  useRecentChecklists,
  useSearchChecklists,
  useTrendingChecklists,
  useUserRating,
} from './hooks';

const mockActions: Pick<
  LibraryContextValue,
  | 'createChecklist'
  | 'updateChecklist'
  | 'toggleFavorite'
  | 'isFavorite'
  | 'addComment'
  | 'rateChecklist'
  | 'reload'
> = {
  createChecklist: jest.fn(),
  updateChecklist: jest.fn(),
  toggleFavorite: jest.fn(),
  isFavorite: jest.fn(),
  addComment: jest.fn(),
  rateChecklist: jest.fn(),
  reload: jest.fn(),
};

const libraryValue: LibraryContextValue = {
  ...libraryStateMock,
  ...mockActions,
};

function createWrapper(value: LibraryContextValue | null = libraryValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider initialPreference="dark">
        <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
      </ThemeProvider>
    );
  };
}

describe('library hooks', () => {
  describe('useLibrary', () => {
    it('should return the context value inside the provider', () => {
      const { result } = renderHook(() => useLibrary(), { wrapper: createWrapper() });

      expect(result.current.checklists).toEqual(libraryStateMock.checklists);
      expect(result.current.rateChecklist).toBe(mockActions.rateChecklist);
    });

    it('should throw when used outside the provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => renderHook(() => useLibrary())).toThrow(
        'useLibrary must be used within a LibraryProvider',
      );

      consoleError.mockRestore();
    });
  });

  describe('selector hooks', () => {
    it('should return enriched checklists for an authenticated viewer', () => {
      const { result } = renderHook(() => useAllChecklists('user-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.length).toBe(libraryStateMock.checklists.length);
      expect(result.current[0].isFavorite).toBe(true);
      expect(result.current[0].categoryName).toBe('DevOps');
    });

    it('should return non-favorite summaries for a guest (null viewer)', () => {
      const { result } = renderHook(() => useAllChecklists(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.every((item) => item.isFavorite === false)).toBe(true);
    });

    it('should resolve a checklist by id', () => {
      const { result } = renderHook(() => useChecklist('checklist-1', 'user-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current?.id).toBe('checklist-1');
      expect(result.current?.title).toBe('Deploy checklist');
    });

    it('should return null checklist for guests when id is missing', () => {
      const { result } = renderHook(() => useChecklist('missing', null), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });

    it('should return checklist items ordered for a checklist', () => {
      const { result } = renderHook(() => useChecklistItems('checklist-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should return popular, recent, trending and favorite lists', () => {
      const wrapper = createWrapper();

      const popular = renderHook(() => usePopularChecklists('user-1'), { wrapper });
      const recent = renderHook(() => useRecentChecklists('user-1'), { wrapper });
      const trending = renderHook(() => useTrendingChecklists('user-1'), { wrapper });
      const favorites = renderHook(() => useFavoriteChecklists('user-1'), { wrapper });
      const guestFavorites = renderHook(() => useFavoriteChecklists(null), { wrapper });

      expect(popular.result.current.length).toBeGreaterThan(0);
      expect(recent.result.current.length).toBeGreaterThan(0);
      expect(trending.result.current.length).toBeGreaterThan(0);
      expect(favorites.result.current.map((item) => item.id)).toEqual(
        expect.arrayContaining(['checklist-1', 'checklist-2']),
      );
      expect(guestFavorites.result.current).toEqual([]);
    });

    it('should return checklists by author', () => {
      const { result } = renderHook(() => useChecklistsByAuthor('user-1', 'user-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.every((item) => item.authorId === 'user-1')).toBe(true);
    });

    it('should return comments by checklist, item and author', () => {
      const wrapper = createWrapper();

      const byChecklist = renderHook(() => useCommentsByChecklist('checklist-1'), { wrapper });
      const byItem = renderHook(() => useCommentsByItem('item-1'), { wrapper });
      const byAuthor = renderHook(() => useCommentsByAuthor('user-2'), { wrapper });

      expect(byChecklist.result.current.length).toBeGreaterThan(0);
      expect(byItem.result.current[0]?.content).toContain('smoke');
      expect(byAuthor.result.current.length).toBeGreaterThan(0);
    });

    it('should resolve a checklist item by ids', () => {
      const { result } = renderHook(() => useChecklistItem('checklist-1', 'item-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current?.title).toBe('Rodar testes');
    });

    it('should resolve author by id and stats', () => {
      const wrapper = createWrapper();

      const author = renderHook(() => useAuthorById('user-1'), { wrapper });
      const stats = renderHook(() => useAuthorStats('user-1'), { wrapper });
      const missing = renderHook(() => useAuthorById('missing'), { wrapper });

      expect(author.result.current?.displayName).toBe('Ana Silva');
      expect(stats.result.current.commentsCount).toBeGreaterThanOrEqual(0);
      expect(stats.result.current.favoritesSum).toBeGreaterThanOrEqual(0);
      expect(missing.result.current).toBeNull();
    });

    it('should return user rating for viewer and null for guests', () => {
      const wrapper = createWrapper();

      const rated = renderHook(() => useUserRating('checklist-1', 'user-1'), { wrapper });
      const guest = renderHook(() => useUserRating('checklist-1', null), { wrapper });

      expect(rated.result.current).toBe(5);
      expect(guest.result.current).toBe(0);
    });

    it('should search checklists and expose categories catalog', () => {
      const wrapper = createWrapper();

      const searched = renderHook(() => useSearchChecklists('deploy', null, 'user-1'), {
        wrapper,
      });
      const byCategory = renderHook(
        () => useSearchChecklists('', 'cat-1', null),
        { wrapper },
      );
      const categories = renderHook(() => useCategoriesCatalog(), { wrapper });

      expect(searched.result.current.some((item) => item.id === 'checklist-1')).toBe(true);
      expect(byCategory.result.current.every((item) => item.categoryId === 'cat-1')).toBe(true);
      expect(categories.result.current).toEqual(libraryStateMock.categories);
    });

    it('should throw from selector hooks outside the provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => renderHook(() => useAllChecklists(null))).toThrow(
        'useLibrary must be used within a LibraryProvider',
      );
      expect(() => renderHook(() => useCategoriesCatalog())).toThrow(
        'useLibrary must be used within a LibraryProvider',
      );

      consoleError.mockRestore();
    });
  });
});

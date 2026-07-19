import { libraryStateMock } from '@mocks/data/libraryState';

import {
  countCommentsByAuthor,
  normalize,
  selectAuthorById,
  selectCategories,
  selectChecklistById,
  selectChecklistItemById,
  selectChecklistItems,
  selectChecklists,
  selectChecklistsByAuthor,
  selectCommentsByAuthor,
  selectCommentsByChecklist,
  selectCommentsByItem,
  selectFavoriteChecklists,
  selectPopularChecklists,
  selectRecentChecklists,
  selectSearchedChecklists,
  selectTrendingChecklists,
  selectUserRating,
  sortCopy,
  sumFavoritesByAuthor,
  toChecklistSummary,
} from './library-selectors';

describe('library-selectors', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-13T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sortCopy / normalize', () => {
    it('should sort a copy without mutating the original array', () => {
      const items = [3, 1, 2];
      const sorted = sortCopy(items, (left, right) => left - right);

      expect(sorted).toEqual([1, 2, 3]);
      expect(items).toEqual([3, 1, 2]);
    });

    it('should normalize accents and case for search', () => {
      expect(normalize('  Ênfase ')).toBe('  enfase ');
      expect(normalize('Código')).toBe('codigo');
    });
  });

  describe('toChecklistSummary / selectChecklists', () => {
    it('should enrich checklist with category, author, items and favorite flag', () => {
      const summary = toChecklistSummary(
        libraryStateMock,
        libraryStateMock.checklists[0],
        'user-1',
      );

      expect(summary.categoryName).toBe('DevOps');
      expect(summary.authorName).toBe('Ana Silva');
      expect(summary.authorInitials).toBe('AS');
      expect(summary.itemsCount).toBe(3);
      expect(summary.isFavorite).toBe(true);
    });

    it('should fall back to empty names and false favorite when data is missing', () => {
      const summary = toChecklistSummary(
        libraryStateMock,
        libraryStateMock.checklists[2],
        null,
      );

      expect(summary.categoryName).toBe('');
      expect(summary.authorName).toBe('');
      expect(summary.authorInitials).toBeUndefined();
      expect(summary.itemsCount).toBe(0);
      expect(summary.isFavorite).toBe(false);
    });

    it('should map all checklists for a viewer', () => {
      const summaries = selectChecklists(libraryStateMock, 'user-1');

      expect(summaries).toHaveLength(3);
      expect(summaries[0].isFavorite).toBe(true);
      expect(summaries[1].isFavorite).toBe(true);
      expect(summaries[2].isFavorite).toBe(false);
    });
  });

  describe('home feed selectors', () => {
    it('should order popular by favorites + executions + rating score', () => {
      const popular = selectPopularChecklists(libraryStateMock, 'user-1');

      expect(popular.map((item) => item.id)).toEqual([
        'checklist-3',
        'checklist-1',
        'checklist-2',
      ]);
      expect(popular).toHaveLength(3);
    });

    it('should order recent by updatedAt desc and limit to 4', () => {
      const recent = selectRecentChecklists(libraryStateMock, null);

      expect(recent.map((item) => item.id)).toEqual([
        'checklist-2',
        'checklist-1',
        'checklist-3',
      ]);
    });

    it('should order trending by comments + favorites engagement', () => {
      const trending = selectTrendingChecklists(libraryStateMock, 'user-1');

      // engagement = commentsCount + favoritesCount → 21, 15, 13
      expect(trending.map((item) => item.id)).toEqual([
        'checklist-3',
        'checklist-1',
        'checklist-2',
      ]);
    });
  });

  describe('selectFavoriteChecklists', () => {
    it('should return empty list when viewer is null', () => {
      expect(selectFavoriteChecklists(libraryStateMock, null)).toEqual([]);
    });

    it('should return only favorites for the viewer ordered by updatedAt', () => {
      const favorites = selectFavoriteChecklists(libraryStateMock, 'user-1');

      expect(favorites.map((item) => item.id)).toEqual(['checklist-2', 'checklist-1']);
      expect(favorites.every((item) => item.isFavorite)).toBe(true);
    });
  });

  describe('selectChecklistsByAuthor', () => {
    it('should filter by author and sort by updatedAt desc', () => {
      const authored = selectChecklistsByAuthor(libraryStateMock, 'user-1', 'user-2');

      expect(authored).toHaveLength(1);
      expect(authored[0].id).toBe('checklist-1');
      expect(authored[0].isFavorite).toBe(true);
    });
  });

  describe('selectChecklistById', () => {
    it('should return null when checklist does not exist', () => {
      expect(selectChecklistById(libraryStateMock, 'missing', 'user-1')).toBeNull();
    });

    it('should return details with ordered items and links', () => {
      const details = selectChecklistById(libraryStateMock, 'checklist-1', 'user-1');

      expect(details).not.toBeNull();
      expect(details?.description).toBe('Passos para publicar com segurança.');
      expect(details?.items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3']);
      expect(details?.links).toHaveLength(1);
      expect(details?.isFavorite).toBe(true);
    });

    it('should use empty description when checklist description is missing', () => {
      const state = {
        ...libraryStateMock,
        checklists: libraryStateMock.checklists.map((checklist) =>
          checklist.id === 'checklist-2'
            ? { ...checklist, description: undefined }
            : checklist,
        ),
      };

      const details = selectChecklistById(state, 'checklist-2', null);

      expect(details?.description).toBe('');
    });
  });

  describe('items selectors', () => {
    it('should return checklist items ordered by order', () => {
      const items = selectChecklistItems(libraryStateMock, 'checklist-1');

      expect(items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should find item by checklist and item id', () => {
      expect(selectChecklistItemById(libraryStateMock, 'checklist-1', 'item-2')?.title).toBe(
        'Publicar build',
      );
      expect(selectChecklistItemById(libraryStateMock, 'checklist-1', 'item-4')).toBeNull();
      expect(selectChecklistItemById(libraryStateMock, 'checklist-2', 'item-1')).toBeNull();
    });
  });

  describe('comments selectors', () => {
    it('should select checklist-level comments with relative dates and author info', () => {
      const comments = selectCommentsByChecklist(libraryStateMock, 'checklist-1');

      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe('comment-1');
      expect(comments[0].authorName).toBe('Bruno Costa');
      expect(comments[0].relativeCreatedAt).toBe('há 1 dia');
      expect(comments[1].relativeCreatedAt).toBe('há 2 dias');
      expect(comments.every((comment) => !comment.itemId)).toBe(true);
    });

    it('should select item comments ordered by createdAt desc', () => {
      const comments = selectCommentsByItem(libraryStateMock, 'item-1');

      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe('comment-item-1');
      expect(comments[0].authorInitials).toBe('BC');
    });

    it('should fall back to empty author fields when user is missing', () => {
      const comments = selectCommentsByAuthor(libraryStateMock, 'missing-author');

      expect(comments).toHaveLength(1);
      expect(comments[0].authorName).toBe('');
      expect(comments[0].authorInitials).toBeUndefined();
    });

    it('should select all comments by author including item comments', () => {
      const comments = selectCommentsByAuthor(libraryStateMock, 'user-2');

      expect(comments.map((comment) => comment.id)).toEqual([
        'comment-item-1',
        'comment-1',
      ]);
    });
  });

  describe('author / rating / categories helpers', () => {
    it('should select author by id', () => {
      expect(selectAuthorById(libraryStateMock, 'user-1')?.displayName).toBe('Ana Silva');
      expect(selectAuthorById(libraryStateMock, 'missing')).toBeNull();
    });

    it('should count comments and sum favorites for an author', () => {
      expect(countCommentsByAuthor(libraryStateMock, 'user-2')).toBe(2);
      expect(sumFavoritesByAuthor(libraryStateMock, 'user-1')).toBe(12);
      expect(sumFavoritesByAuthor(libraryStateMock, 'missing')).toBe(0);
    });

    it('should return user rating or 0 when missing / guest', () => {
      expect(selectUserRating(libraryStateMock, 'checklist-1', 'user-1')).toBe(5);
      expect(selectUserRating(libraryStateMock, 'checklist-1', null)).toBe(0);
      expect(selectUserRating(libraryStateMock, 'checklist-2', 'user-2')).toBe(0);
    });

    it('should return categories catalog', () => {
      expect(selectCategories(libraryStateMock)).toBe(libraryStateMock.categories);
    });
  });

  describe('selectSearchedChecklists', () => {
    it('should return all checklists when term is empty and category is null', () => {
      expect(selectSearchedChecklists(libraryStateMock, '   ', null, 'user-1')).toHaveLength(3);
    });

    it('should filter by category only when term is empty', () => {
      const results = selectSearchedChecklists(libraryStateMock, '', 'cat-1', null);

      expect(results.map((item) => item.id)).toEqual(['checklist-1']);
    });

    it('should match title, description, category, author and tags ignoring accents', () => {
      const byTitle = selectSearchedChecklists(libraryStateMock, 'deploy', null, null);
      const byTag = selectSearchedChecklists(libraryStateMock, 'CI', null, null);
      const byAuthor = selectSearchedChecklists(libraryStateMock, 'bruno', null, null);
      const byAccent = selectSearchedChecklists(libraryStateMock, 'enfase', null, null);

      expect(byTitle.map((item) => item.id)).toEqual(['checklist-1']);
      expect(byTag.map((item) => item.id)).toEqual(['checklist-1']);
      expect(byAuthor.map((item) => item.id)).toEqual(['checklist-2']);
      expect(byAccent.map((item) => item.id)).toEqual(['checklist-2']);
    });

    it('should combine term and category filters', () => {
      const results = selectSearchedChecklists(libraryStateMock, 'review', 'cat-2', 'user-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('checklist-2');
      expect(selectSearchedChecklists(libraryStateMock, 'review', 'cat-1', null)).toEqual([]);
    });
  });
});

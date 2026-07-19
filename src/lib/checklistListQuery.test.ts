import type { ChecklistListQuery } from '@/types';

import { checklistListToUrlSearchParams } from './checklistListQuery';

describe('checklistListToUrlSearchParams', () => {
  const baseQuery: ChecklistListQuery = {
    page: 1,
    pageSize: 20,
  };

  it('should set page and default pageSize', () => {
    const params = checklistListToUrlSearchParams({ page: 2 });

    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('20');
  });

  it('should use provided pageSize', () => {
    const params = checklistListToUrlSearchParams({ ...baseQuery, pageSize: 50 });

    expect(params.get('pageSize')).toBe('50');
  });

  it('should include trimmed q when non-empty', () => {
    const params = checklistListToUrlSearchParams({ ...baseQuery, q: '  deploy  ' });

    expect(params.get('q')).toBe('deploy');
  });

  it('should omit q when empty or whitespace', () => {
    expect(checklistListToUrlSearchParams({ ...baseQuery, q: '' }).has('q')).toBe(false);
    expect(checklistListToUrlSearchParams({ ...baseQuery, q: '   ' }).has('q')).toBe(false);
    expect(checklistListToUrlSearchParams({ ...baseQuery }).has('q')).toBe(false);
  });

  it('should include categoryId and authorId when set', () => {
    const params = checklistListToUrlSearchParams({
      ...baseQuery,
      categoryId: 'cat-1',
      authorId: 'user-1',
    });

    expect(params.get('categoryId')).toBe('cat-1');
    expect(params.get('authorId')).toBe('user-1');
  });

  it('should include minRating only when greater than 0', () => {
    expect(
      checklistListToUrlSearchParams({ ...baseQuery, minRating: 0 }).has('minRating'),
    ).toBe(false);
    expect(
      checklistListToUrlSearchParams({ ...baseQuery, minRating: 3 }).get('minRating'),
    ).toBe('3');
  });

  it('should include favoritesOnly as true string when enabled', () => {
    const params = checklistListToUrlSearchParams({ ...baseQuery, favoritesOnly: true });

    expect(params.get('favoritesOnly')).toBe('true');
  });

  it('should omit favoritesOnly when false or undefined', () => {
    expect(
      checklistListToUrlSearchParams({ ...baseQuery, favoritesOnly: false }).has('favoritesOnly'),
    ).toBe(false);
    expect(checklistListToUrlSearchParams(baseQuery).has('favoritesOnly')).toBe(false);
  });

  it('should include viewerId when set', () => {
    const params = checklistListToUrlSearchParams({ ...baseQuery, viewerId: 'viewer-1' });

    expect(params.get('viewerId')).toBe('viewer-1');
  });

  it('should serialize a full query into search params', () => {
    const params = checklistListToUrlSearchParams({
      page: 3,
      pageSize: 10,
      q: 'ci',
      categoryId: 'cat-2',
      authorId: 'author-9',
      minRating: 4,
      favoritesOnly: true,
      viewerId: 'me',
    });

    expect(Object.fromEntries(params.entries())).toEqual({
      page: '3',
      pageSize: '10',
      q: 'ci',
      categoryId: 'cat-2',
      authorId: 'author-9',
      minRating: '4',
      favoritesOnly: 'true',
      viewerId: 'me',
    });
  });
});

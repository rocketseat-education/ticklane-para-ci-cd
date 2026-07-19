import { renderHook } from '@tests/utils/test-utils';

import { useCategoryGrid } from './use-category-grid';

describe('useCategoryGrid', () => {
  it('should expose theme-derived styles', () => {
    const { result } = renderHook(() => useCategoryGrid());

    expect(result.current.styles).toBeDefined();
  });
});

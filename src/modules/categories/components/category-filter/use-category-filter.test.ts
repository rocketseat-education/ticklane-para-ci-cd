import { act, renderHook } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';

import { useCategoryFilter } from './use-category-filter';

describe('useCategoryFilter', () => {
  it('should treat missing selection as all selected', () => {
    const { result } = renderHook(() => useCategoryFilter({}));

    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.styles).toBeDefined();
    expect(result.current.allIconSize).toBeGreaterThan(0);
  });

  it('should mark all as unselected when a category id is set', () => {
    const { result } = renderHook(() =>
      useCategoryFilter({ selectedCategoryId: categoriesMock[0].id }),
    );

    expect(result.current.isAllSelected).toBe(false);
  });

  it('should call onCategoryPress with null when all is pressed', () => {
    const onCategoryPress = jest.fn();
    const { result } = renderHook(() => useCategoryFilter({ onCategoryPress }));

    act(() => {
      result.current.handleAllPress();
    });

    expect(onCategoryPress).toHaveBeenCalledWith(null);
  });

  it('should call onCategoryPress with the category', () => {
    const onCategoryPress = jest.fn();
    const { result } = renderHook(() => useCategoryFilter({ onCategoryPress }));

    act(() => {
      result.current.handleCategoryPress(categoriesMock[0]);
    });

    expect(onCategoryPress).toHaveBeenCalledWith(categoriesMock[0]);
  });

  it('should no-op handlers when onCategoryPress is omitted', () => {
    const { result } = renderHook(() => useCategoryFilter({}));

    expect(() => {
      act(() => {
        result.current.handleAllPress();
        result.current.handleCategoryPress(categoriesMock[0]);
      });
    }).not.toThrow();
  });
});

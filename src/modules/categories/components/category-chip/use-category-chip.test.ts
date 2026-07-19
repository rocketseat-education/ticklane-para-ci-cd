import { act, renderHook } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';

import { useCategoryChip } from './use-category-chip';

describe('useCategoryChip', () => {
  it('should expose selected styles and call onPress with category', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useCategoryChip({
        category: categoriesMock[0],
        isSelected: true,
        onPress,
      }),
    );

    expect(result.current.styles).toBeDefined();
    expect(result.current.iconColor).toBeDefined();
    expect(result.current.labelColor).toBeDefined();

    act(() => {
      result.current.handlePress();
    });

    expect(onPress).toHaveBeenCalledWith(categoriesMock[0]);
  });

  it('should no-op press when onPress is omitted', () => {
    const { result } = renderHook(() =>
      useCategoryChip({
        category: categoriesMock[0],
        isSelected: false,
      }),
    );

    expect(() => {
      act(() => {
        result.current.handlePress();
      });
    }).not.toThrow();
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() =>
      useCategoryChip({
        category: categoriesMock[0],
        isSelected: false,
      }),
    );
    const idleStyles = result.current.styles;

    act(() => {
      result.current.handlePressIn();
    });

    expect(result.current.styles).not.toBe(idleStyles);

    act(() => {
      result.current.handlePressOut();
    });

    expect(result.current.styles).toBeDefined();
  });
});

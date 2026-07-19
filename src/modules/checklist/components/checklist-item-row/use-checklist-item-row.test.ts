import { act, renderHook } from '@tests/utils/test-utils';
import { checklistItemsMock } from '@mocks/data/checklists';

import { useChecklistItemRow } from './use-checklist-item-row';

const item = checklistItemsMock[0];

describe('useChecklistItemRow', () => {
  it('should be interactive and call onPress with the item', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() => useChecklistItemRow({ item, onPress }));

    expect(result.current.isInteractive).toBe(true);
    expect(result.current.chevronSize).toBeGreaterThan(0);
    expect(result.current.chevronColor).toBeDefined();

    act(() => {
      result.current.handlePress();
    });

    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('should not be interactive when onPress is omitted', () => {
    const { result } = renderHook(() => useChecklistItemRow({ item }));

    expect(result.current.isInteractive).toBe(false);

    expect(() => {
      act(() => {
        result.current.handlePress();
      });
    }).not.toThrow();
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() => useChecklistItemRow({ item, onPress: jest.fn() }));
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

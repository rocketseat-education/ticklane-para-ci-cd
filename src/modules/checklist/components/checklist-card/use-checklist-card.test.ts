import { act, renderHook } from '@tests/utils/test-utils';
import { checklistSummaryMock } from '@mocks/data/checklists';

import { useChecklistCard } from './use-checklist-card';

describe('useChecklistCard', () => {
  it('should call onPress with the checklist', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useChecklistCard({ checklist: checklistSummaryMock, onPress }),
    );

    act(() => {
      result.current.handlePress();
    });

    expect(onPress).toHaveBeenCalledWith(checklistSummaryMock);
  });

  it('should no-op press when onPress is omitted', () => {
    const { result } = renderHook(() => useChecklistCard({ checklist: checklistSummaryMock }));

    expect(() => {
      act(() => {
        result.current.handlePress();
      });
    }).not.toThrow();
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() => useChecklistCard({ checklist: checklistSummaryMock }));
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

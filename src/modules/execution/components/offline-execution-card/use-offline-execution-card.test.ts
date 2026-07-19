import { act, renderHook } from '@tests/utils/test-utils';
import { offlineExecutionsMock } from '@mocks/data/executions';

import { useOfflineExecutionCard } from './use-offline-execution-card';

const execution = offlineExecutionsMock[0];

describe('useOfflineExecutionCard', () => {
  it('should expose captions and default strip styles', () => {
    const { result } = renderHook(() =>
      useOfflineExecutionCard({
        execution,
        progressCaption: '2 de 8',
        dateCaption: 'hoje',
      }),
    );

    expect(result.current.progressCaption).toBe('2 de 8');
    expect(result.current.dateCaption).toBe('hoje');
    expect(result.current.styles).toBeDefined();
  });

  it('should support fill variant', () => {
    const { result } = renderHook(() =>
      useOfflineExecutionCard({
        execution,
        progressCaption: '1 de 4',
        dateCaption: 'ontem',
        variant: 'fill',
      }),
    );

    expect(result.current.styles).toBeDefined();
  });

  it('should call onPress with the execution', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useOfflineExecutionCard({
        execution,
        progressCaption: '2 de 8',
        dateCaption: 'hoje',
        onPress,
      }),
    );

    act(() => {
      result.current.handlePress();
    });

    expect(onPress).toHaveBeenCalledWith(execution);
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() =>
      useOfflineExecutionCard({
        execution,
        progressCaption: '2 de 8',
        dateCaption: 'hoje',
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

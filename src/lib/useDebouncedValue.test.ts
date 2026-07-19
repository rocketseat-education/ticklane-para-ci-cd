import { act, renderHook } from '@tests/utils/test-utils';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 300));

    expect(result.current).toBe('hello');
  });

  it('should update the debounced value after the delay', () => {
    let value = 'a';
    const { result, rerender } = renderHook(() => useDebouncedValue(value, 300));

    value = 'b';
    rerender();
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('should reset the timer when value changes before delay elapses', () => {
    let value = 'one';
    const { result, rerender } = renderHook(() => useDebouncedValue(value, 200));

    value = 'two';
    rerender();
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('one');

    value = 'three';
    rerender();
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('one');

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe('three');
  });

  it('should support non-string values', () => {
    let value = 1;
    const { result, rerender } = renderHook(() => useDebouncedValue(value, 100));

    value = 2;
    rerender();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(2);
  });
});

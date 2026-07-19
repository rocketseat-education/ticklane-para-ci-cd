import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { useColorScheme } from './use-color-scheme';

describe('useColorScheme', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return dark when native scheme is dark', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('dark');
  });

  it('should return light when native scheme is light', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
  });

  it('should return null for unsupported scheme values', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('unspecified' as 'light');
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBeNull();
  });

  it('should return null when native scheme is null', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(null);
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBeNull();
  });
});

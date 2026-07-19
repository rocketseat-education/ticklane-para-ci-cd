import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { AuthGateContext, type AuthGateContextValue } from './auth-gate-context';
import { useAuthGateState } from './use-auth-gate-state';

const gateValue: AuthGateContextValue = {
  isVisible: true,
  intent: 'favorite',
  show: jest.fn(),
  hide: jest.fn(),
  resolve: jest.fn(),
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthGateContext.Provider value={gateValue}>{children}</AuthGateContext.Provider>
  );
}

describe('useAuthGateState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when used outside AuthGateProvider', () => {
    expect(() => renderHook(() => useAuthGateState())).toThrow(
      'useAuthGateState must be used within an AuthGateProvider',
    );
  });

  it('should return the auth gate context value when provided', () => {
    const { result } = renderHook(() => useAuthGateState(), { wrapper });

    expect(result.current).toBe(gateValue);
    expect(result.current.isVisible).toBe(true);
    expect(result.current.intent).toBe('favorite');
  });

  it('should expose show/hide/resolve from the provider value', () => {
    const { result } = renderHook(() => useAuthGateState(), { wrapper });

    act(() => {
      result.current.hide();
      result.current.resolve(true);
    });

    expect(gateValue.hide).toHaveBeenCalledTimes(1);
    expect(gateValue.resolve).toHaveBeenCalledWith(true);
  });
});

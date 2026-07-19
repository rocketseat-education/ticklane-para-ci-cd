import { act, renderHook } from '@tests/utils/test-utils';
import { Alert } from 'react-native';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useDeleteAccountSection } from './use-delete-account-section';

const mockReplace = jest.fn();
const mockSignOut = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

jest.mock('@/lib/deleteAccount', () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

describe('useDeleteAccountSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start in idle and expose copy/styles', () => {
    const { result } = renderHook(() => useDeleteAccountSection());

    expect(result.current.step).toBe('idle');
    expect(result.current.copy).toBe(COPY.screens.profile.deleteAccount);
    expect(result.current.styles).toBeDefined();
  });

  it('should move to confirm then back to idle on cancel', () => {
    const { result } = renderHook(() => useDeleteAccountSection());

    act(() => {
      result.current.handleStartPress();
    });

    expect(result.current.step).toBe('confirm');

    act(() => {
      result.current.handleCancelPress();
    });

    expect(result.current.step).toBe('idle');
  });

  it('should alert and stay on confirm when deleteAccount fails', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: false, error: 'Servidor indisponível' });
    const { result } = renderHook(() => useDeleteAccountSection());

    act(() => {
      result.current.handleStartPress();
    });

    await act(async () => {
      await result.current.handleConfirmPress();
    });

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      COPY.screens.profile.deleteAccount.errorTitle,
      'Servidor indisponível',
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.step).toBe('confirm');
  });

  it('should sign out and navigate home after successful deletion', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useDeleteAccountSection());

    act(() => {
      result.current.handleStartPress();
    });

    await act(async () => {
      await result.current.handleConfirmPress();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.tabs.home);
    expect(result.current.step).toBe('idle');
  });
});

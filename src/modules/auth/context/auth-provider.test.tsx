import { act, renderHook, waitFor } from '@testing-library/react-native';
import { authenticatedUserMock } from '@mocks/data/users';

import { AuthProvider } from './auth-provider';
import { useAuth } from './use-auth';

const mockFetchAuthMe = jest.fn();
const mockRequestEmailOtp = jest.fn();
const mockVerifyEmailOtp = jest.fn();
const mockSignOutApi = jest.fn();

jest.mock('@/lib/fetchAuthMe', () => ({
  fetchAuthMe: (...args: unknown[]) => mockFetchAuthMe(...args),
}));

jest.mock('@/lib/requestEmailOtp', () => ({
  requestEmailOtp: (...args: unknown[]) => mockRequestEmailOtp(...args),
}));

jest.mock('@/lib/verifyEmailOtp', () => ({
  verifyEmailOtp: (...args: unknown[]) => mockVerifyEmailOtp(...args),
}));

jest.mock('@/lib/signOutApi', () => ({
  signOutApi: (...args: unknown[]) => mockSignOutApi(...args),
}));

function renderAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAuthMe.mockResolvedValue(null);
    mockRequestEmailOtp.mockResolvedValue({ ok: true });
    mockVerifyEmailOtp.mockResolvedValue({ ok: true, user: authenticatedUserMock });
    mockSignOutApi.mockResolvedValue(undefined);
  });

  it('should resolve as guest when /me returns null', async () => {
    const { result } = renderAuth();

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.authResolved).toBe(true);
    });

    expect(result.current.status).toBe('guest');
    expect(result.current.isGuest).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser.id).toBe('guest');
  });

  it('should resolve as authenticated when /me returns a user', async () => {
    mockFetchAuthMe.mockResolvedValue(authenticatedUserMock);

    const { result } = renderAuth();

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser).toEqual(authenticatedUserMock);
  });

  it('should fall back to guest when /me fails', async () => {
    mockFetchAuthMe.mockRejectedValue(new Error('network'));

    const { result } = renderAuth();

    await waitFor(() => {
      expect(result.current.authResolved).toBe(true);
    });

    expect(result.current.status).toBe('guest');
  });

  it('should request OTP through requestEmailLoginCode', async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.authResolved).toBe(true));

    let response: { ok: boolean } | undefined;
    await act(async () => {
      response = await result.current.requestEmailLoginCode('ana@example.com');
    });

    expect(mockRequestEmailOtp).toHaveBeenCalledWith('ana@example.com');
    expect(response).toEqual({ ok: true });
  });

  it('should authenticate when verifyEmailLoginCode succeeds', async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.authResolved).toBe(true));

    await act(async () => {
      await result.current.verifyEmailLoginCode('ana@example.com', '123456');
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.currentUser).toEqual(authenticatedUserMock);
  });

  it('should keep guest session when verifyEmailLoginCode fails', async () => {
    mockVerifyEmailOtp.mockResolvedValue({ ok: false, error: 'Código inválido' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.authResolved).toBe(true));

    await act(async () => {
      await result.current.verifyEmailLoginCode('ana@example.com', '000000');
    });

    expect(result.current.status).toBe('guest');
  });

  it('should applySessionUser and signOut', async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.authResolved).toBe(true));

    await act(async () => {
      result.current.applySessionUser(authenticatedUserMock);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.getLatestUser()).toEqual(authenticatedUserMock);

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOutApi).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('guest');
  });
});

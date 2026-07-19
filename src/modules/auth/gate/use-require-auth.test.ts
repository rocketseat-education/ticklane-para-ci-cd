import { act, renderHook } from '@tests/utils/test-utils';

import { useRequireAuth } from './use-require-auth';

const mockShow = jest.fn();

jest.mock('../context/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('./use-auth-gate-state', () => ({
  useAuthGateState: () => ({
    show: mockShow,
  }),
}));

import { useAuth } from '../context/use-auth';

const useAuthMock = useAuth as jest.Mock;

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true immediately when the user is already authenticated', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });

    const { result } = renderHook(() => useRequireAuth());

    let allowed = false;
    await act(async () => {
      allowed = await result.current('comment');
    });

    expect(allowed).toBe(true);
    expect(mockShow).not.toHaveBeenCalled();
  });

  it('should open the auth gate and return its result when unauthenticated', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    mockShow.mockResolvedValue(true);

    const { result } = renderHook(() => useRequireAuth());

    let allowed = false;
    await act(async () => {
      allowed = await result.current('favorite');
    });

    expect(mockShow).toHaveBeenCalledWith('favorite');
    expect(allowed).toBe(true);
  });

  it('should return false when the gate is dismissed without auth', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    mockShow.mockResolvedValue(false);

    const { result } = renderHook(() => useRequireAuth());

    let allowed = true;
    await act(async () => {
      allowed = await result.current('create');
    });

    expect(allowed).toBe(false);
  });
});

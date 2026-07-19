import { act, renderHook } from '@tests/utils/test-utils';

import { ROUTES } from '@/constants/routes';

import { useAuthorBadge } from './use-author-badge';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useAuthorBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be pressable when authorId is set and interactive', () => {
    const { result } = renderHook(() => useAuthorBadge({ authorId: 'user-1' }));

    expect(result.current.isPressable).toBe(true);
    expect(result.current.styles).toBeDefined();
  });

  it('should not be pressable without authorId', () => {
    const { result } = renderHook(() => useAuthorBadge({}));

    expect(result.current.isPressable).toBe(false);
  });

  it('should not be pressable when isInteractive is false', () => {
    const { result } = renderHook(() =>
      useAuthorBadge({ authorId: 'user-1', isInteractive: false }),
    );

    expect(result.current.isPressable).toBe(false);
  });

  it('should navigate to author route on press', () => {
    const { result } = renderHook(() => useAuthorBadge({ authorId: 'user-1' }));

    act(() => {
      result.current.handlePress();
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.author('user-1'));
  });

  it('should no-op press when authorId is missing', () => {
    const { result } = renderHook(() => useAuthorBadge({}));

    act(() => {
      result.current.handlePress();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() => useAuthorBadge({ authorId: 'user-1' }));
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

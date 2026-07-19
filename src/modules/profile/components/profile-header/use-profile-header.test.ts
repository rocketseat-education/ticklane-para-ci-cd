import { renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { useProfileHeader } from './use-profile-header';

describe('useProfileHeader', () => {
  it('should prefer email as subtitle for authenticated users', () => {
    const { result } = renderHook(() => useProfileHeader({ user: authenticatedUserMock }));

    expect(result.current.isGuest).toBe(false);
    expect(result.current.displayName).toBe(authenticatedUserMock.displayName);
    expect(result.current.displaySubtitle).toBe(authenticatedUserMock.email);
  });

  it('should fall back to @username when email is missing', () => {
    const { result } = renderHook(() =>
      useProfileHeader({
        user: {
          ...authenticatedUserMock,
          email: undefined,
        },
      }),
    );

    expect(result.current.displaySubtitle).toBe(`@${authenticatedUserMock.username}`);
  });

  it('should mark guests and fall back to @username without email', () => {
    const { result } = renderHook(() => useProfileHeader({ user: guestUserMock }));

    expect(result.current.isGuest).toBe(true);
    expect(result.current.displayName).toBe(guestUserMock.displayName);
    expect(result.current.displaySubtitle).toBe(`@${guestUserMock.username}`);
  });

  it('should use empty subtitle when neither email nor username exist', () => {
    const { result } = renderHook(() =>
      useProfileHeader({
        user: {
          ...authenticatedUserMock,
          email: undefined,
          username: '',
        },
      }),
    );

    expect(result.current.displaySubtitle).toBe('');
  });
});

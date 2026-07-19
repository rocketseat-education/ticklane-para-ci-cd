import { renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock } from '@mocks/data/users';

import { useAuthorHeader } from './use-author-header';

describe('useAuthorHeader', () => {
  it('should expose styles and @username', () => {
    const { result } = renderHook(() => useAuthorHeader({ user: authenticatedUserMock }));

    expect(result.current.styles).toBeDefined();
    expect(result.current.username).toBe(`@${authenticatedUserMock.username}`);
  });
});

import { act, renderHook } from '@tests/utils/test-utils';

import { ROUTES } from '@/constants/routes';

import { useCommentItem } from './use-comment-item';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useCommentItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to author route on author press', () => {
    const { result } = renderHook(() => useCommentItem({ authorId: 'user-2' }));

    expect(result.current.styles).toBeDefined();
    expect(result.current.hitSlop).toBeDefined();

    act(() => {
      result.current.handleAuthorPress();
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.author('user-2'));
  });
});

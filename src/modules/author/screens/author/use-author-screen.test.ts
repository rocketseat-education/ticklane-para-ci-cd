import { act, renderHook } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useAuthorScreen } from './use-author-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useAuthorById: jest.fn(),
  useAuthorStats: jest.fn(),
  useChecklistsByAuthor: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import { useAuthorById, useAuthorStats, useChecklistsByAuthor } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useAuthorByIdMock = useAuthorById as jest.Mock;
const useAuthorStatsMock = useAuthorStats as jest.Mock;
const useChecklistsByAuthorMock = useChecklistsByAuthor as jest.Mock;

const authorId = authenticatedUserMock.id;
const authorStatsMock = { commentsCount: 7, favoritesSum: 17 };

describe('useAuthorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useAuthorByIdMock.mockReturnValue(authenticatedUserMock);
    useChecklistsByAuthorMock.mockReturnValue(checklistSummariesMock);
    useAuthorStatsMock.mockReturnValue(authorStatsMock);
  });

  it('should return author, checklists, stats and copy', () => {
    const { result } = renderHook(() => useAuthorScreen({ id: authorId }));

    expect(result.current.author).toEqual(authenticatedUserMock);
    expect(result.current.checklists).toEqual(checklistSummariesMock);
    expect(result.current.stats).toEqual([
      { label: COPY.screens.author.stats.checklists, value: checklistSummariesMock.length },
      { label: COPY.screens.author.stats.comments, value: authorStatsMock.commentsCount },
      { label: COPY.screens.author.stats.favorites, value: authorStatsMock.favoritesSum },
    ]);
    expect(result.current.checklistsTitle).toBe(COPY.screens.author.checklistsTitle);
    expect(result.current.emptyTitle).toBe(COPY.screens.author.emptyTitle);
    expect(result.current.emptyDescription).toBe(COPY.screens.author.emptyDescription);
    expect(result.current.notFoundTitle).toBe(COPY.screens.author.notFoundTitle);
    expect(result.current.notFoundDescription).toBe(COPY.screens.author.notFoundDescription);
    expect(result.current.styles).toBeDefined();
    expect(useAuthorByIdMock).toHaveBeenCalledWith(authorId);
    expect(useChecklistsByAuthorMock).toHaveBeenCalledWith(authorId, authenticatedUserMock.id);
    expect(useAuthorStatsMock).toHaveBeenCalledWith(authorId);
  });

  it('should return empty stats and null viewerId when author is missing or guest', () => {
    useAuthorByIdMock.mockReturnValue(undefined);
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });
    useChecklistsByAuthorMock.mockReturnValue([]);

    const { result } = renderHook(() => useAuthorScreen({ id: 'missing' }));

    expect(result.current.author).toBeUndefined();
    expect(result.current.stats).toEqual([]);
    expect(useChecklistsByAuthorMock).toHaveBeenCalledWith('missing', null);
  });

  it('should navigate back and to checklist details', () => {
    const { result } = renderHook(() => useAuthorScreen({ id: authorId }));

    act(() => {
      result.current.handleBack();
      result.current.handleChecklistPress(checklistSummariesMock[0]);
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
  });
});

import { act, renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useFavoritesScreen } from './use-favorites-screen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useFavoriteChecklists: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import { useFavoriteChecklists } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useFavoriteChecklistsMock = useFavoriteChecklists as jest.Mock;

describe('useFavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useFavoriteChecklistsMock.mockReturnValue(checklistSummariesMock);
  });

  it('should return copy, favorites and handlers for authenticated users', () => {
    const { result } = renderHook(() => useFavoritesScreen());

    expect(result.current.title).toBe(COPY.screens.favorites.title);
    expect(result.current.subtitle).toBe(COPY.screens.favorites.subtitle);
    expect(result.current.emptyTitle).toBe(COPY.states.emptyTitle);
    expect(result.current.emptyDescription).toBe(COPY.screens.favorites.emptyDescription);
    expect(result.current.connectLabel).toBe(COPY.screens.profile.connectCta);
    expect(result.current.favorites).toEqual(checklistSummariesMock);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.handleChecklistPress).toBeDefined();
    expect(result.current.handleConnectPress).toBeDefined();
    expect(result.current.styles).toBeDefined();
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
  });

  it('should use guest empty description and null viewerId when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });
    useFavoriteChecklistsMock.mockReturnValue([]);

    const { result } = renderHook(() => useFavoritesScreen());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.emptyDescription).toBe(COPY.screens.favorites.guestEmptyDescription);
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(null);
  });

  it('should navigate to checklist details when handleChecklistPress is called', () => {
    const { result } = renderHook(() => useFavoritesScreen());

    act(() => {
      result.current.handleChecklistPress(checklistSummariesMock[0]);
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
  });

  it('should navigate to auth when handleConnectPress is called', () => {
    const { result } = renderHook(() => useFavoritesScreen());

    act(() => {
      result.current.handleConnectPress();
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.auth);
  });
});

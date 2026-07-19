import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useMyFavoritesScreen } from './use-my-favorites-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReload = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useFavoriteChecklists: jest.fn(),
  useLibrary: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import { useFavoriteChecklists, useLibrary } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useFavoriteChecklistsMock = useFavoriteChecklists as jest.Mock;
const useLibraryMock = useLibrary as jest.Mock;

describe('useMyFavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useLibraryMock.mockReturnValue({ reload: mockReload });
    useFavoriteChecklistsMock.mockReturnValue(checklistSummariesMock);
  });

  it('should return copy, favorites and handlers for authenticated users', async () => {
    const { result } = renderHook(() => useMyFavoritesScreen());

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });

    expect(result.current.screenCopy).toBe(COPY.screens.profileMyFavoritesList);
    expect(result.current.favorites).toEqual(checklistSummariesMock);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.emptyDescription).toBe(
      COPY.screens.profileMyFavoritesList.emptyDescription,
    );
    expect(result.current.connectLabel).toBe(COPY.screens.profile.connectCta);
    expect(result.current.styles).toBeDefined();
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
  });

  it('should use guest empty description and null viewerId when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });
    useFavoriteChecklistsMock.mockReturnValue([]);

    const { result } = renderHook(() => useMyFavoritesScreen());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.emptyDescription).toBe(
      COPY.screens.profileMyFavoritesList.guestEmptyDescription,
    );
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(null);
  });

  it('should navigate back, to checklist details, explore and auth', () => {
    const { result } = renderHook(() => useMyFavoritesScreen());

    act(() => {
      result.current.handleBack();
      result.current.handleChecklistPress(checklistSummariesMock[0]);
      result.current.handleExplorePress();
      result.current.handleConnectPress();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.tabs.search);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.auth);
  });
});

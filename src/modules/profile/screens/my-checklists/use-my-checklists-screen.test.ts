import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useMyChecklistsScreen } from './use-my-checklists-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReload = jest.fn();
const mockRequireAuth = jest.fn().mockResolvedValue(true);

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

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/state/library', () => ({
  useChecklistsByAuthor: jest.fn(),
  useLibrary: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import { useChecklistsByAuthor, useLibrary } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useChecklistsByAuthorMock = useChecklistsByAuthor as jest.Mock;
const useLibraryMock = useLibrary as jest.Mock;

describe('useMyChecklistsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useLibraryMock.mockReturnValue({ reload: mockReload });
    useChecklistsByAuthorMock.mockReturnValue(checklistSummariesMock);
    mockRequireAuth.mockResolvedValue(true);
  });

  it('should return copy, checklists and handlers for authenticated users', async () => {
    const { result } = renderHook(() => useMyChecklistsScreen());

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });

    expect(result.current.screenCopy).toBe(COPY.screens.profileMyChecklistsList);
    expect(result.current.checklists).toEqual(checklistSummariesMock);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.emptyDescription).toBe(
      COPY.screens.profileMyChecklistsList.emptyDescription,
    );
    expect(result.current.connectLabel).toBe(COPY.screens.profile.connectCta);
    expect(result.current.styles).toBeDefined();
    expect(useChecklistsByAuthorMock).toHaveBeenCalledWith(
      authenticatedUserMock.id,
      authenticatedUserMock.id,
    );
  });

  it('should use guest empty description and null viewerId when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });
    useChecklistsByAuthorMock.mockReturnValue([]);

    const { result } = renderHook(() => useMyChecklistsScreen());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.emptyDescription).toBe(
      COPY.screens.profileMyChecklistsList.guestEmptyDescription,
    );
    expect(useChecklistsByAuthorMock).toHaveBeenCalledWith(guestUserMock.id, null);
  });

  it('should navigate back, to checklist details, explore and auth', () => {
    const { result } = renderHook(() => useMyChecklistsScreen());

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

  it('should navigate to create when requireAuth allows it', async () => {
    const { result } = renderHook(() => useMyChecklistsScreen());

    await act(async () => {
      await result.current.handleCreatePress();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('create');
    expect(mockPush).toHaveBeenCalledWith(ROUTES.create);
  });

  it('should not navigate to create when requireAuth denies it', async () => {
    mockRequireAuth.mockResolvedValue(false);
    const { result } = renderHook(() => useMyChecklistsScreen());

    await act(async () => {
      await result.current.handleCreatePress();
    });

    expect(mockPush).not.toHaveBeenCalledWith(ROUTES.create);
  });
});

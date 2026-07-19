import { act, renderHook } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { offlineExecutionsMock } from '@mocks/data/executions';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useProfileScreen } from './use-profile-screen';

const mockPush = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockRequireAuth = jest.fn().mockResolvedValue(true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/modules/execution/hooks/use-offline-executions', () => ({
  useOfflineExecutions: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useChecklistsByAuthor: jest.fn(),
  useCommentsByAuthor: jest.fn(),
  useFavoriteChecklists: jest.fn(),
}));

jest.mock('@/lib/offlineExecution', () => ({
  formatOfflineExecutionUpdatedAt: jest.fn((value: string) => `formatted:${value}`),
}));

import { useAuth } from '@/modules/auth/context';
import { useOfflineExecutions } from '@/modules/execution/hooks/use-offline-executions';
import {
  useChecklistsByAuthor,
  useCommentsByAuthor,
  useFavoriteChecklists,
} from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useOfflineExecutionsMock = useOfflineExecutions as jest.Mock;
const useChecklistsByAuthorMock = useChecklistsByAuthor as jest.Mock;
const useCommentsByAuthorMock = useCommentsByAuthor as jest.Mock;
const useFavoriteChecklistsMock = useFavoriteChecklists as jest.Mock;

describe('useProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
      signOut: mockSignOut,
    });
    useOfflineExecutionsMock.mockReturnValue({ executions: offlineExecutionsMock });
    useChecklistsByAuthorMock.mockReturnValue(checklistSummariesMock);
    useFavoriteChecklistsMock.mockReturnValue([checklistSummariesMock[0]]);
    useCommentsByAuthorMock.mockReturnValue([]);
    mockRequireAuth.mockResolvedValue(true);
  });

  it('should return authenticated profile data and sections', () => {
    const { result } = renderHook(() => useProfileScreen());

    expect(result.current.title).toBe(COPY.screens.profile.title);
    expect(result.current.subtitle).toBe(COPY.screens.profile.authenticatedSubtitle);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.currentUser).toEqual(authenticatedUserMock);
    expect(result.current.myChecklists).toEqual(checklistSummariesMock);
    expect(result.current.myFavorites).toEqual([checklistSummariesMock[0]]);
    expect(result.current.runningExecutions).toEqual(offlineExecutionsMock);
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
  });

  it('should clear authored content for guests and use guest subtitle', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
      signOut: mockSignOut,
    });

    const { result } = renderHook(() => useProfileScreen());

    expect(result.current.subtitle).toBe(COPY.screens.profile.guestSubtitle);
    expect(result.current.isGuest).toBe(true);
    expect(result.current.myChecklists).toEqual([]);
    expect(result.current.myFavorites).toEqual([]);
    expect(result.current.myComments).toEqual([]);
    expect(result.current.guestEmptyDescriptions.myChecklists).toBe(
      COPY.screens.profile.sections.myChecklists.guestEmptyDescription,
    );
    expect(useFavoriteChecklistsMock).toHaveBeenCalledWith(null);
  });

  it('should navigate to auth, edit and checklist details', () => {
    const { result } = renderHook(() => useProfileScreen());

    act(() => {
      result.current.handleConnectPress();
      result.current.handleEditPress();
      result.current.handleChecklistPress(checklistSummariesMock[0]);
      result.current.handleRunningExecutionPress(offlineExecutionsMock[0]);
      result.current.handleRunningSeeAllPress();
      result.current.handleMyChecklistsSeeAllPress();
      result.current.handleMyFavoritesSeeAllPress();
      result.current.handleExploreHome();
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.auth);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.profileEdit);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.execution(offlineExecutionsMock[0].id));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.runningExecutionsList);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.profileMyChecklistsList);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.profileMyFavoritesList);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.tabs.home);
  });

  it('should sign out when handleLogoutPress is called', async () => {
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => {
      await result.current.handleLogoutPress();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should navigate to create when requireAuth allows it', async () => {
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => {
      await result.current.handleCreatePress();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('create');
    expect(mockPush).toHaveBeenCalledWith(ROUTES.create);
  });

  it('should not navigate to create when requireAuth denies it', async () => {
    mockRequireAuth.mockResolvedValue(false);
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => {
      await result.current.handleCreatePress();
    });

    expect(mockPush).not.toHaveBeenCalledWith(ROUTES.create);
  });

  it('should navigate to search when exploring favorites is allowed', async () => {
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => {
      await result.current.handleExploreFavorites();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('favorite');
    expect(mockPush).toHaveBeenCalledWith(ROUTES.tabs.search);
  });
});

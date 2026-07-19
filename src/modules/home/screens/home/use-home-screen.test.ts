import { act, renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useHomeScreen } from './use-home-screen';

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
  usePopularChecklists: jest.fn(),
  useTrendingChecklists: jest.fn(),
  useRecentChecklists: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import {
  usePopularChecklists,
  useRecentChecklists,
  useTrendingChecklists,
} from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const usePopularChecklistsMock = usePopularChecklists as jest.Mock;
const useTrendingChecklistsMock = useTrendingChecklists as jest.Mock;
const useRecentChecklistsMock = useRecentChecklists as jest.Mock;

describe('useHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    usePopularChecklistsMock.mockReturnValue([checklistSummariesMock[0]]);
    useTrendingChecklistsMock.mockReturnValue([checklistSummariesMock[1]]);
    useRecentChecklistsMock.mockReturnValue(checklistSummariesMock);
  });

  it('should return copy, checklist sections and handlers', () => {
    const { result } = renderHook(() => useHomeScreen());

    expect(result.current.title).toBe(COPY.screens.home.title);
    expect(result.current.subtitle).toBe(COPY.screens.home.subtitle);
    expect(result.current.popularTitle).toBe(COPY.screens.home.popularTitle);
    expect(result.current.trendingTitle).toBe(COPY.screens.home.trendingTitle);
    expect(result.current.recentTitle).toBe(COPY.screens.home.recentTitle);
    expect(result.current.popularChecklists).toEqual([checklistSummariesMock[0]]);
    expect(result.current.trendingChecklists).toEqual([checklistSummariesMock[1]]);
    expect(result.current.recentChecklists).toEqual(checklistSummariesMock);
    expect(result.current.handleChecklistPress).toBeDefined();
    expect(result.current.styles).toBeDefined();
    expect(usePopularChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
    expect(useTrendingChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
    expect(useRecentChecklistsMock).toHaveBeenCalledWith(authenticatedUserMock.id);
  });

  it('should pass null viewerId when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    renderHook(() => useHomeScreen());

    expect(usePopularChecklistsMock).toHaveBeenCalledWith(null);
    expect(useTrendingChecklistsMock).toHaveBeenCalledWith(null);
    expect(useRecentChecklistsMock).toHaveBeenCalledWith(null);
  });

  it('should navigate to checklist details when handleChecklistPress is called', () => {
    const { result } = renderHook(() => useHomeScreen());

    act(() => {
      result.current.handleChecklistPress(checklistSummariesMock[0]);
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistSummariesMock[0].id));
  });
});

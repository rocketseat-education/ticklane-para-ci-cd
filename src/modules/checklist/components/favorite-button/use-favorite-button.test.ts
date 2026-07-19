import { act, renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';

import { useFavoriteButton } from './use-favorite-button';

const mockRequireAuth = jest.fn();
const mockIsFavorite = jest.fn();
const mockToggleFavorite = jest.fn();
const mockGetLatestUser = jest.fn();

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/state/library', () => ({
  useLibrary: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

import { useAuth } from '@/modules/auth/context';

const useAuthMock = useAuth as jest.Mock;

describe('useFavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
      getLatestUser: mockGetLatestUser,
    });
    mockGetLatestUser.mockReturnValue(authenticatedUserMock);
    mockIsFavorite.mockReturnValue(false);
    mockRequireAuth.mockResolvedValue(true);
  });

  it('should expose outline bookmark state when not favorited', () => {
    const { result } = renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));

    expect(mockIsFavorite).toHaveBeenCalledWith('checklist-1', authenticatedUserMock.id);
    expect(result.current.isFavorite).toBe(false);
    expect(result.current.iconName).toBe('bookmark-outline');
    expect(result.current.accessibilityLabel).toBe(COPY.actions.favorite);
  });

  it('should expose filled bookmark state when favorited', () => {
    mockIsFavorite.mockReturnValue(true);

    const { result } = renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));

    expect(result.current.isFavorite).toBe(true);
    expect(result.current.iconName).toBe('bookmark');
    expect(result.current.accessibilityLabel).toBe(COPY.actions.unfavorite);
  });

  it('should pass null viewer id for guests when checking favorite', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
      getLatestUser: mockGetLatestUser,
    });

    renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));

    expect(mockIsFavorite).toHaveBeenCalledWith('checklist-1', null);
  });

  it('should toggle favorite after successful auth', async () => {
    const { result } = renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));

    await act(async () => {
      await result.current.handlePress();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('favorite');
    expect(mockToggleFavorite).toHaveBeenCalledWith('checklist-1', authenticatedUserMock.id);
  });

  it('should not toggle when auth is denied', async () => {
    mockRequireAuth.mockResolvedValue(false);
    const { result } = renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));

    await act(async () => {
      await result.current.handlePress();
    });

    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it('should track press in/out state via styles recreation', () => {
    const { result } = renderHook(() => useFavoriteButton({ checklistId: 'checklist-1' }));
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

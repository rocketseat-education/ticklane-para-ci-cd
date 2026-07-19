import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { checklistCommentsMock } from '@mocks/data/comments';
import { checklistDetailsMock, checklistItemsMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useDetailsScreen } from './use-details-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReload = jest.fn();
const mockRequireAuth = jest.fn();
const mockCreateOfflineExecutionFromChecklist = jest.fn();
const mockAlert = jest.fn();

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

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: (...args: unknown[]) => mockAlert(...args),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/state/library', () => ({
  useChecklist: jest.fn(),
  useCommentsByChecklist: jest.fn(),
  useLibrary: jest.fn(),
}));

jest.mock('@/lib/offlineExecution', () => ({
  createOfflineExecutionFromChecklist: (...args: unknown[]) =>
    mockCreateOfflineExecutionFromChecklist(...args),
}));

import { useAuth } from '@/modules/auth/context';
import { useChecklist, useCommentsByChecklist, useLibrary } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useChecklistMock = useChecklist as jest.Mock;
const useCommentsByChecklistMock = useCommentsByChecklist as jest.Mock;
const useLibraryMock = useLibrary as jest.Mock;

describe('useDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useLibraryMock.mockReturnValue({
      reload: mockReload,
    });
    useChecklistMock.mockReturnValue(checklistDetailsMock);
    useCommentsByChecklistMock.mockReturnValue(checklistCommentsMock);
    mockRequireAuth.mockResolvedValue(true);
    mockCreateOfflineExecutionFromChecklist.mockResolvedValue('exec-1');
  });

  it('should return copy, checklist, comments and handlers for author', async () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });

    expect(result.current.title).toBe(COPY.screens.checklistDetails.title);
    expect(result.current.subtitle).toBe(checklistDetailsMock.id);
    expect(result.current.ctaLabel).toBe(COPY.screens.checklistDetails.cta);
    expect(result.current.editLabel).toBe(COPY.screens.checklistDetails.editCta);
    expect(result.current.itemsTitle).toBe(COPY.screens.checklistDetails.itemsTitle);
    expect(result.current.linksTitle).toBe(COPY.screens.checklistDetails.linksTitle);
    expect(result.current.commentsTitle).toBe(COPY.screens.checklistDetails.commentsTitle);
    expect(result.current.emptyTitle).toBe(COPY.states.emptyTitle);
    expect(result.current.emptyDescription).toBe(COPY.states.placeholderDescription);
    expect(result.current.checklist).toEqual(checklistDetailsMock);
    expect(result.current.comments).toEqual(checklistCommentsMock);
    expect(result.current.isAuthor).toBe(true);
    expect(result.current.isRateSheetVisible).toBe(false);
    expect(result.current.styles).toBeDefined();
    expect(useChecklistMock).toHaveBeenCalledWith(checklistDetailsMock.id, authenticatedUserMock.id);
    expect(useCommentsByChecklistMock).toHaveBeenCalledWith(checklistDetailsMock.id);
  });

  it('should pass null viewerId and not mark as author when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    expect(result.current.isAuthor).toBe(false);
    expect(useChecklistMock).toHaveBeenCalledWith(checklistDetailsMock.id, null);
  });

  it('should go back when handleBack is called', () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    act(() => {
      result.current.handleBack();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should start offline execution and navigate when handleStartExecution succeeds', async () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleStartExecution();
    });

    expect(mockCreateOfflineExecutionFromChecklist).toHaveBeenCalledWith(checklistDetailsMock);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.execution('exec-1'));
  });

  it('should not start execution when checklist is missing', async () => {
    useChecklistMock.mockReturnValue(null);

    const { result } = renderHook(() => useDetailsScreen({ id: 'missing' }));

    await act(async () => {
      await result.current.handleStartExecution();
    });

    expect(mockCreateOfflineExecutionFromChecklist).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not navigate when offline execution creation fails', async () => {
    mockCreateOfflineExecutionFromChecklist.mockResolvedValue(null);

    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleStartExecution();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should navigate to item details when handleItemPress is called', () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    act(() => {
      result.current.handleItemPress(checklistItemsMock[0]);
    });

    expect(mockPush).toHaveBeenCalledWith(
      ROUTES.itemDetails(checklistDetailsMock.id, checklistItemsMock[0].id),
    );
  });

  it('should open rate sheet after requireAuth succeeds', async () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleRatePress();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('rate');
    expect(result.current.isRateSheetVisible).toBe(true);
  });

  it('should not open rate sheet when requireAuth fails', async () => {
    mockRequireAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleRatePress();
    });

    expect(result.current.isRateSheetVisible).toBe(false);
  });

  it('should close rate sheet when handleRateSheetClose is called', async () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleRatePress();
    });

    act(() => {
      result.current.handleRateSheetClose();
    });

    expect(result.current.isRateSheetVisible).toBe(false);
  });

  it('should navigate to edit when handleEditPress succeeds auth', async () => {
    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleEditPress();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('create');
    expect(mockPush).toHaveBeenCalledWith(ROUTES.checklistEdit(checklistDetailsMock.id));
  });

  it('should not navigate to edit when requireAuth fails', async () => {
    mockRequireAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useDetailsScreen({ id: checklistDetailsMock.id }));

    await act(async () => {
      await result.current.handleEditPress();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';
import { Alert, Keyboard } from 'react-native';

import { COPY } from '@/constants/copy';

import { useCommentComposer } from './use-comment-composer';

const mockRequireAuth = jest.fn();
const mockAddComment = jest.fn();
const mockGetLatestUser = jest.fn();

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/state/library', () => ({
  useLibrary: () => ({
    addComment: mockAddComment,
  }),
}));

import { useAuth } from '@/modules/auth/context';

const useAuthMock = useAuth as jest.Mock;

const target = { type: 'checklist' as const, checklistId: 'checklist-1' };

describe('useCommentComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(jest.fn());

    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
      getLatestUser: mockGetLatestUser,
    });
    mockGetLatestUser.mockReturnValue(authenticatedUserMock);
    mockRequireAuth.mockResolvedValue(true);
    mockAddComment.mockResolvedValue({ ok: true, id: 'comment-new' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should expose initial composer state and copy', () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    expect(result.current.text).toBe('');
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.isModalVisible).toBe(false);
    expect(result.current.avatarInitials).toBe(authenticatedUserMock.initials);
    expect(result.current.placeholder).toBe(COPY.screens.checklistDetails.commentPlaceholder);
    expect(result.current.modalTitle).toBe(COPY.screens.checklistDetails.commentModalTitle);
  });

  it('should enable submit when text is non-empty', () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    act(() => {
      result.current.handleChangeText('  Olá  ');
    });

    expect(result.current.text).toBe('  Olá  ');
    expect(result.current.canSubmit).toBe(true);
  });

  it('should open modal after auth succeeds for authenticated users', async () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    await act(async () => {
      await result.current.handleOpen();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('comment');
    expect(result.current.isModalVisible).toBe(true);
  });

  it('should not open modal when auth is denied', async () => {
    mockRequireAuth.mockResolvedValue(false);
    const { result } = renderHook(() => useCommentComposer({ target }));

    await act(async () => {
      await result.current.handleOpen();
    });

    expect(result.current.isModalVisible).toBe(false);
  });

  it('should wait before opening modal when user was a guest', async () => {
    jest.useFakeTimers();
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
      getLatestUser: mockGetLatestUser,
    });

    const { result } = renderHook(() => useCommentComposer({ target }));

    await act(async () => {
      const openPromise = result.current.handleOpen();
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(350);
      await openPromise;
    });

    expect(result.current.isModalVisible).toBe(true);
  });

  it('should submit comment, then close and clear text on success', async () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    act(() => {
      result.current.handleChangeText('Novo comentário');
    });

    await act(async () => {
      await result.current.handleOpen();
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAddComment).toHaveBeenCalledWith(
      target,
      'Novo comentário',
      authenticatedUserMock.id,
    );
    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(result.current.isModalVisible).toBe(false);
    expect(result.current.text).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should alert and keep modal open when addComment fails', async () => {
    mockAddComment.mockResolvedValue({ ok: false, error: 'Sem rede' });
    const { result } = renderHook(() => useCommentComposer({ target }));

    act(() => {
      result.current.handleChangeText('Falha');
    });

    await act(async () => {
      await result.current.handleOpen();
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Não foi possível comentar', 'Sem rede');
    expect(result.current.isModalVisible).toBe(true);
    expect(result.current.text).toBe('Falha');
  });

  it('should ignore submit when text is empty', async () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAddComment).not.toHaveBeenCalled();
  });

  it('should close and clear draft via handleClose', async () => {
    const { result } = renderHook(() => useCommentComposer({ target }));

    await act(async () => {
      await result.current.handleOpen();
    });

    act(() => {
      result.current.handleChangeText('rascunho');
      result.current.handleClose();
    });

    expect(result.current.isModalVisible).toBe(false);
    expect(result.current.text).toBe('');
  });
});

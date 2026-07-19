import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { libraryStateMock } from '@mocks/data/libraryState';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import type { ChecklistWriteResponse } from '@/lib/checklistWriteApi';
import type { Comment } from '@/types';

import { useLibrary } from './hooks';
import { LibraryProvider } from './library-provider';
import type { ChecklistFormInput, LibraryState, UpdateChecklistInput } from './library-types';

const mockFetchLibraryFromApi = jest.fn();
const mockAddFavoriteRequest = jest.fn();
const mockRemoveFavoriteRequest = jest.fn();
const mockSetRatingRequest = jest.fn();
const mockCreateCommentRequest = jest.fn();
const mockCreateChecklistRequest = jest.fn();
const mockUpdateChecklistRequest = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/lib/fetchLibraryFromApi', () => ({
  fetchLibraryFromApi: (...args: unknown[]) => mockFetchLibraryFromApi(...args),
}));

jest.mock('@/lib/favoriteApi', () => ({
  addFavoriteRequest: (...args: unknown[]) => mockAddFavoriteRequest(...args),
  removeFavoriteRequest: (...args: unknown[]) => mockRemoveFavoriteRequest(...args),
}));

jest.mock('@/lib/ratingApi', () => ({
  setRatingRequest: (...args: unknown[]) => mockSetRatingRequest(...args),
}));

jest.mock('@/lib/commentApi', () => ({
  createCommentRequest: (...args: unknown[]) => mockCreateCommentRequest(...args),
}));

jest.mock('@/lib/checklistWriteApi', () => ({
  createChecklistRequest: (...args: unknown[]) => mockCreateChecklistRequest(...args),
  updateChecklistRequest: (...args: unknown[]) => mockUpdateChecklistRequest(...args),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('@/components/brand-loading', () => {
  const ReactNative = require('react-native');
  return {
    BrandLoading: () => (
      <ReactNative.View testID="brand-loading">
        <ReactNative.Text>Loading</ReactNative.Text>
      </ReactNative.View>
    ),
  };
});

function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function cloneLibrary(state: LibraryState = libraryStateMock): LibraryState {
  return structuredClone(state);
}

function mockFetchResolved(data: LibraryState = cloneLibrary()) {
  mockFetchLibraryFromApi.mockImplementation((signal?: AbortSignal) => {
    return new Promise<LibraryState>((resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const onAbort = () => reject(createAbortError());
      signal?.addEventListener('abort', onAbort, { once: true });

      queueMicrotask(() => {
        if (signal?.aborted) {
          return;
        }
        signal?.removeEventListener('abort', onAbort);
        resolve(cloneLibrary(data));
      });
    });
  });
}

function mockFetchRejected(error: unknown) {
  mockFetchLibraryFromApi.mockImplementation((signal?: AbortSignal) => {
    return new Promise<LibraryState>((_resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const onAbort = () => reject(createAbortError());
      signal?.addEventListener('abort', onAbort, { once: true });

      queueMicrotask(() => {
        if (signal?.aborted) {
          return;
        }
        signal?.removeEventListener('abort', onAbort);
        reject(error);
      });
    });
  });
}

function mockAuth(overrides: {
  authResolved?: boolean;
  currentUser?: typeof authenticatedUserMock | typeof guestUserMock;
} = {}) {
  mockUseAuth.mockReturnValue({
    authResolved: overrides.authResolved ?? true,
    currentUser: overrides.currentUser ?? authenticatedUserMock,
  });
}

function LibraryWrapper({ children }: { children: ReactNode }) {
  return <LibraryProvider>{children}</LibraryProvider>;
}

async function renderLibraryHook() {
  const view = renderHook(() => useLibrary(), { wrapper: LibraryWrapper });

  await waitFor(() => {
    expect(view.result.current.checklists.length).toBeGreaterThan(0);
  });

  return view;
}

const createInput: ChecklistFormInput = {
  title: 'Nova checklist',
  description: 'Descrição',
  categoryId: 'cat-1',
  tags: ['nova'],
  visibility: 'public',
  items: [{ title: 'Passo 1', description: 'Detalhe' }],
  links: [{ label: 'Docs', url: 'https://example.com' }],
};

const updateInput: UpdateChecklistInput = {
  title: 'Checklist atualizada',
  description: 'Nova descrição',
  categoryId: 'cat-1',
  tags: ['updated'],
  visibility: 'public',
  items: [{ id: 'item-1', title: 'Passo atualizado' }],
  links: [{ label: 'Docs', url: 'https://example.com/docs' }],
};

function writeResponse(overrides?: Partial<ChecklistWriteResponse['checklist']>): ChecklistWriteResponse {
  return {
    checklist: {
      id: 'checklist-new',
      title: 'Nova checklist',
      description: 'Descrição',
      categoryId: 'cat-1',
      visibility: 'public',
      authorId: 'user-1',
      tags: ['nova'],
      averageRating: 0,
      favoritesCount: 0,
      executionsCount: 0,
      commentsCount: 0,
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
      ...overrides,
    },
    checklistItems: [
      {
        id: 'item-new-1',
        checklistId: overrides?.id ?? 'checklist-new',
        title: 'Passo 1',
        order: 0,
      },
    ],
    checklistLinks: [
      {
        id: 'link-new-1',
        checklistId: overrides?.id ?? 'checklist-new',
        label: 'Docs',
        url: 'https://example.com',
      },
    ],
  };
}

describe('LibraryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
    mockFetchResolved();
    mockAddFavoriteRequest.mockResolvedValue({ ok: true });
    mockRemoveFavoriteRequest.mockResolvedValue({ ok: true });
    mockSetRatingRequest.mockResolvedValue({ ok: true });
    mockCreateCommentRequest.mockResolvedValue({
      ok: true,
      comment: {
        id: 'comment-new',
        checklistId: 'checklist-1',
        authorId: 'user-1',
        content: 'Novo comentário',
        createdAt: '2026-02-01T10:00:00.000Z',
      } satisfies Comment,
    });
    mockCreateChecklistRequest.mockResolvedValue({ ok: true, data: writeResponse() });
    mockUpdateChecklistRequest.mockResolvedValue({
      ok: true,
      data: writeResponse({ id: 'checklist-1', title: 'Checklist atualizada' }),
    });
  });

  it('should stay loading while authResolved is false', () => {
    mockAuth({ authResolved: false, currentUser: guestUserMock });

    render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    expect(screen.getByTestId('brand-loading')).toBeTruthy();
    expect(screen.queryByText('child')).toBeNull();
    expect(mockFetchLibraryFromApi).not.toHaveBeenCalled();
  });

  it('should load the library successfully and expose ready state', async () => {
    const { result } = await renderLibraryHook();

    expect(result.current.checklists).toHaveLength(libraryStateMock.checklists.length);
    expect(result.current.favorites).toEqual(libraryStateMock.favorites);
    expect(result.current.categories).toEqual(libraryStateMock.categories);
    expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(1);
  });

  it('should show error status and message on non-abort load failure', async () => {
    mockFetchRejected(new Error('Servidor caiu'));

    render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Servidor indisponível')).toBeTruthy();
    });

    expect(screen.getByText('Servidor caiu')).toBeTruthy();
    expect(screen.queryByText('child')).toBeNull();
  });

  it('should use fallback error message when load rejects a non-Error', async () => {
    mockFetchRejected('boom');

    render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Erro desconhecido')).toBeTruthy();
    });
  });

  it('should ignore AbortError from an aborted in-flight fetch', async () => {
    let callCount = 0;
    mockFetchLibraryFromApi.mockImplementation((signal?: AbortSignal) => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise<LibraryState>((_resolve, reject) => {
          const onAbort = () => reject(createAbortError());
          signal?.addEventListener('abort', onAbort, { once: true });
        });
      }
      return Promise.resolve(cloneLibrary());
    });

    mockAuth({ currentUser: guestUserMock });
    const { rerender } = render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    expect(screen.getByTestId('brand-loading')).toBeTruthy();

    mockAuth({ currentUser: authenticatedUserMock });
    rerender(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('child')).toBeTruthy();
    });

    expect(screen.queryByText('Servidor indisponível')).toBeNull();
    expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(2);
  });

  it('should ignore a direct AbortError rejection without entering error state', async () => {
    mockFetchLibraryFromApi.mockRejectedValue(createAbortError());

    render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('brand-loading')).toBeTruthy();
    expect(screen.queryByText('Servidor indisponível')).toBeNull();
    expect(screen.queryByText('child')).toBeNull();
  });
  it('should reload when the session user changes', async () => {
    mockAuth({ currentUser: guestUserMock });
    const { rerender } = render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('child')).toBeTruthy();
    });
    expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(1);

    mockAuth({ currentUser: authenticatedUserMock });
    rerender(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(2);
    });
  });

  it('should skip reload when auth re-resolves with the same session user', async () => {
    mockAuth({ authResolved: true, currentUser: authenticatedUserMock });
    const { rerender } = render(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('child')).toBeTruthy();
    });
    expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(1);

    mockAuth({ authResolved: false, currentUser: authenticatedUserMock });
    rerender(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    mockAuth({ authResolved: true, currentUser: authenticatedUserMock });
    rerender(
      <LibraryProvider>
        <Text>child</Text>
      </LibraryProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchLibraryFromApi).toHaveBeenCalledTimes(1);
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('should reload successfully via reload()', async () => {
    const { result } = await renderLibraryHook();

    const updated = cloneLibrary();
    updated.checklists[0] = { ...updated.checklists[0], title: 'Deploy atualizado' };
    mockFetchResolved(updated);

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.checklists[0].title).toBe('Deploy atualizado');
    });
  });

  it('should keep ready state when reload() fails', async () => {
    const { result } = await renderLibraryHook();

    mockFetchLibraryFromApi.mockRejectedValue(new Error('Falha no reload'));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.checklists.length).toBeGreaterThan(0);
    expect(result.current.checklists[0].id).toBe('checklist-1');
  });

  it('should keep ready state when reload() rejects a non-Error', async () => {
    const { result } = await renderLibraryHook();

    mockFetchLibraryFromApi.mockRejectedValue('reload-boom');

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.checklists.length).toBeGreaterThan(0);
  });

  describe('isFavorite', () => {
    it('should return true when the favorite exists', async () => {
      const { result } = await renderLibraryHook();
      expect(result.current.isFavorite('checklist-1', 'user-1')).toBe(true);
    });

    it('should return false when the favorite does not exist', async () => {
      const { result } = await renderLibraryHook();
      expect(result.current.isFavorite('checklist-3', 'user-1')).toBe(false);
    });

    it('should return false when userId is null', async () => {
      const { result } = await renderLibraryHook();
      expect(result.current.isFavorite('checklist-1', null)).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add a favorite optimistically and call the API', async () => {
      const { result } = await renderLibraryHook();

      let next: boolean | undefined;
      act(() => {
        next = result.current.toggleFavorite('checklist-3', 'user-1');
      });

      expect(next).toBe(true);
      expect(result.current.isFavorite('checklist-3', 'user-1')).toBe(true);
      expect(
        result.current.checklists.find((entry) => entry.id === 'checklist-3')?.favoritesCount,
      ).toBe(libraryStateMock.checklists[2].favoritesCount + 1);

      await waitFor(() => {
        expect(mockAddFavoriteRequest).toHaveBeenCalledWith('checklist-3');
      });
    });

    it('should remove a favorite optimistically and call the API', async () => {
      const { result } = await renderLibraryHook();

      let next: boolean | undefined;
      act(() => {
        next = result.current.toggleFavorite('checklist-1', 'user-1');
      });

      expect(next).toBe(false);
      expect(result.current.isFavorite('checklist-1', 'user-1')).toBe(false);
      expect(
        result.current.checklists.find((entry) => entry.id === 'checklist-1')?.favoritesCount,
      ).toBe(libraryStateMock.checklists[0].favoritesCount - 1);

      await waitFor(() => {
        expect(mockRemoveFavoriteRequest).toHaveBeenCalledWith('checklist-1');
      });
    });

    it('should revert the optimistic add when the API fails', async () => {
      mockAddFavoriteRequest.mockResolvedValue({ ok: false, error: 'falhou' });
      const { result } = await renderLibraryHook();

      act(() => {
        result.current.toggleFavorite('checklist-3', 'user-1');
      });

      expect(result.current.isFavorite('checklist-3', 'user-1')).toBe(true);

      await waitFor(() => {
        expect(result.current.isFavorite('checklist-3', 'user-1')).toBe(false);
      });
    });

    it('should no-op when applying the same favorite state twice in one render', async () => {
      const { result } = await renderLibraryHook();
      const countBefore = result.current.checklists.find(
        (entry) => entry.id === 'checklist-1',
      )!.favoritesCount;

      // Same closure sees wasFavorite=true twice → both request becomeFavorite=false.
      // First updater removes; second hits exists === becomeFavorite and returns current.
      act(() => {
        result.current.toggleFavorite('checklist-1', 'user-1');
        result.current.toggleFavorite('checklist-1', 'user-1');
      });

      expect(result.current.isFavorite('checklist-1', 'user-1')).toBe(false);
      expect(
        result.current.checklists.find((entry) => entry.id === 'checklist-1')?.favoritesCount,
      ).toBe(countBefore - 1);

      await waitFor(() => {
        expect(mockRemoveFavoriteRequest).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('rateChecklist', () => {
    it('should create a new rating', async () => {
      const { result } = await renderLibraryHook();

      act(() => {
        result.current.rateChecklist('checklist-3', 4, 'user-1');
      });

      expect(
        result.current.ratings.some(
          (rating) =>
            rating.checklistId === 'checklist-3' &&
            rating.userId === 'user-1' &&
            rating.score === 4,
        ),
      ).toBe(true);

      await waitFor(() => {
        expect(mockSetRatingRequest).toHaveBeenCalledWith('checklist-3', 4);
      });
    });

    it('should update an existing rating', async () => {
      mockSetRatingRequest.mockResolvedValue({ ok: true, averageRating: 4.2 });
      const { result } = await renderLibraryHook();

      act(() => {
        result.current.rateChecklist('checklist-1', 3, 'user-1');
      });

      expect(
        result.current.ratings.find(
          (rating) => rating.checklistId === 'checklist-1' && rating.userId === 'user-1',
        )?.score,
      ).toBe(3);

      await waitFor(() => {
        expect(
          result.current.checklists.find((entry) => entry.id === 'checklist-1')?.averageRating,
        ).toBe(4.2);
      });
    });

    it('should remove a rating when score is zero or less', async () => {
      const { result } = await renderLibraryHook();

      act(() => {
        result.current.rateChecklist('checklist-1', 0, 'user-1');
      });

      expect(
        result.current.ratings.some(
          (rating) => rating.checklistId === 'checklist-1' && rating.userId === 'user-1',
        ),
      ).toBe(false);

      await waitFor(() => {
        expect(mockSetRatingRequest).toHaveBeenCalledWith('checklist-1', 0);
      });
    });

    it('should revert the optimistic rating when the API fails', async () => {
      mockSetRatingRequest.mockResolvedValue({ ok: false, error: 'falhou' });
      const { result } = await renderLibraryHook();

      act(() => {
        result.current.rateChecklist('checklist-1', 2, 'user-1');
      });

      expect(
        result.current.ratings.find(
          (rating) => rating.checklistId === 'checklist-1' && rating.userId === 'user-1',
        )?.score,
      ).toBe(2);

      await waitFor(() => {
        expect(
          result.current.ratings.find(
            (rating) => rating.checklistId === 'checklist-1' && rating.userId === 'user-1',
          )?.score,
        ).toBe(5);
      });
    });
  });

  describe('createChecklist', () => {
    it('should create a checklist and merge write response into state', async () => {
      const { result } = await renderLibraryHook();

      let response: Awaited<ReturnType<typeof result.current.createChecklist>> | undefined;
      await act(async () => {
        response = await result.current.createChecklist(createInput);
      });

      expect(response).toEqual({ ok: true, checklistId: 'checklist-new' });
      expect(result.current.checklists.some((entry) => entry.id === 'checklist-new')).toBe(true);
      expect(mockCreateChecklistRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nova checklist',
          categoryId: 'cat-1',
          visibility: 'public',
          items: [{ title: 'Passo 1', description: 'Detalhe' }],
        }),
      );
    });

    it('should return the API error when createChecklist fails', async () => {
      mockCreateChecklistRequest.mockResolvedValue({ ok: false, error: 'Não autorizado' });
      const { result } = await renderLibraryHook();

      let response: Awaited<ReturnType<typeof result.current.createChecklist>> | undefined;
      await act(async () => {
        response = await result.current.createChecklist(createInput);
      });

      expect(response).toEqual({ ok: false, error: 'Não autorizado' });
      expect(result.current.checklists.some((entry) => entry.id === 'checklist-new')).toBe(false);
    });

    it('should default visibility to public when omitted', async () => {
      const { result } = await renderLibraryHook();
      const { visibility: _ignored, ...withoutVisibility } = createInput;

      await act(async () => {
        await result.current.createChecklist(withoutVisibility);
      });

      expect(mockCreateChecklistRequest).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public' }),
      );
    });
  });

  describe('updateChecklist', () => {
    it('should update a checklist and merge write response into state', async () => {
      const { result } = await renderLibraryHook();

      let response: Awaited<ReturnType<typeof result.current.updateChecklist>> | undefined;
      await act(async () => {
        response = await result.current.updateChecklist('checklist-1', updateInput);
      });

      expect(response).toEqual({ ok: true, checklistId: 'checklist-1' });
      expect(result.current.checklists.find((entry) => entry.id === 'checklist-1')?.title).toBe(
        'Checklist atualizada',
      );
      expect(mockUpdateChecklistRequest).toHaveBeenCalledWith(
        'checklist-1',
        expect.objectContaining({
          title: 'Checklist atualizada',
          items: [{ id: 'item-1', title: 'Passo atualizado', description: undefined }],
        }),
      );
    });

    it('should return the API error when updateChecklist fails', async () => {
      mockUpdateChecklistRequest.mockResolvedValue({ ok: false, error: 'Sem permissão' });
      const { result } = await renderLibraryHook();

      let response: Awaited<ReturnType<typeof result.current.updateChecklist>> | undefined;
      await act(async () => {
        response = await result.current.updateChecklist('checklist-1', updateInput);
      });

      expect(response).toEqual({ ok: false, error: 'Sem permissão' });
      expect(result.current.checklists.find((entry) => entry.id === 'checklist-1')?.title).toBe(
        'Deploy checklist',
      );
    });

    it('should omit item id when updating with new items', async () => {
      const { result } = await renderLibraryHook();

      await act(async () => {
        await result.current.updateChecklist('checklist-1', {
          ...updateInput,
          items: [{ title: 'Item sem id', description: 'novo' }],
        });
      });

      expect(mockUpdateChecklistRequest).toHaveBeenCalledWith(
        'checklist-1',
        expect.objectContaining({
          items: [{ title: 'Item sem id', description: 'novo' }],
        }),
      );
    });
  });

  describe('addComment', () => {
    it('should add a checklist-level comment', async () => {
      const { result } = await renderLibraryHook();
      const previousCount = result.current.checklists.find(
        (entry) => entry.id === 'checklist-1',
      )!.commentsCount;

      let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;
      await act(async () => {
        response = await result.current.addComment(
          { type: 'checklist', checklistId: 'checklist-1' },
          'Novo comentário',
          'user-1',
        );
      });

      expect(response).toEqual({ ok: true, id: 'comment-new' });
      expect(result.current.comments.some((comment) => comment.id === 'comment-new')).toBe(true);
      expect(
        result.current.checklists.find((entry) => entry.id === 'checklist-1')?.commentsCount,
      ).toBe(previousCount + 1);
      expect(mockCreateCommentRequest).toHaveBeenCalledWith(
        'checklist-1',
        'Novo comentário',
        undefined,
      );
    });

    it('should add an item-level comment', async () => {
      mockCreateCommentRequest.mockResolvedValue({
        ok: true,
        comment: {
          id: 'comment-item-new',
          checklistId: 'checklist-1',
          itemId: 'item-1',
          authorId: 'user-1',
          content: 'Comentário no passo',
          createdAt: '2026-02-01T11:00:00.000Z',
        } satisfies Comment,
      });

      const { result } = await renderLibraryHook();

      let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;
      await act(async () => {
        response = await result.current.addComment(
          { type: 'item', checklistId: 'checklist-1', itemId: 'item-1' },
          'Comentário no passo',
          'user-1',
        );
      });

      expect(response).toEqual({ ok: true, id: 'comment-item-new' });
      expect(
        result.current.comments.find((comment) => comment.id === 'comment-item-new')?.itemId,
      ).toBe('item-1');
      expect(mockCreateCommentRequest).toHaveBeenCalledWith(
        'checklist-1',
        'Comentário no passo',
        'item-1',
      );
    });

    it('should return the API error when addComment fails', async () => {
      mockCreateCommentRequest.mockResolvedValue({ ok: false, error: 'Conteúdo inválido' });
      const { result } = await renderLibraryHook();
      const commentsBefore = result.current.comments.length;

      let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;
      await act(async () => {
        response = await result.current.addComment(
          { type: 'checklist', checklistId: 'checklist-1' },
          '   ',
          'user-1',
        );
      });

      expect(response).toEqual({ ok: false, error: 'Conteúdo inválido' });
      expect(result.current.comments).toHaveLength(commentsBefore);
      expect(mockCreateCommentRequest).toHaveBeenCalledWith('checklist-1', '   ', undefined);
    });

    it('should not duplicate a comment that already exists in state', async () => {
      mockCreateCommentRequest.mockResolvedValue({
        ok: true,
        comment: {
          id: 'comment-1',
          checklistId: 'checklist-1',
          authorId: 'user-2',
          content: 'Ótimo checklist de deploy.',
          createdAt: '2026-01-12T10:00:00.000Z',
        } satisfies Comment,
      });

      const { result } = await renderLibraryHook();
      const commentsBefore = result.current.comments.length;
      const countBefore = result.current.checklists.find(
        (entry) => entry.id === 'checklist-1',
      )!.commentsCount;

      let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;
      await act(async () => {
        response = await result.current.addComment(
          { type: 'checklist', checklistId: 'checklist-1' },
          'duplicado',
          'user-1',
        );
      });

      expect(response).toEqual({ ok: true, id: 'comment-1' });
      expect(result.current.comments).toHaveLength(commentsBefore);
      expect(
        result.current.checklists.find((entry) => entry.id === 'checklist-1')?.commentsCount,
      ).toBe(countBefore);
    });
  });
});

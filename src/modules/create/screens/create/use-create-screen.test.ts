import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';
import { checklistDetailsMock } from '@mocks/data/checklists';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useCreateScreen } from './use-create-screen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRequireAuth = jest.fn();
const mockCreateChecklist = jest.fn();
const mockUpdateChecklist = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/modules/auth/gate', () => ({
  useRequireAuth: () => mockRequireAuth,
}));

jest.mock('@/state/library', () => ({
  useCategoriesCatalog: jest.fn(),
  useChecklist: jest.fn(),
  useLibrary: jest.fn(),
}));

import { useAuth } from '@/modules/auth/context';
import { useCategoriesCatalog, useChecklist, useLibrary } from '@/state/library';

const useAuthMock = useAuth as jest.Mock;
const useCategoriesCatalogMock = useCategoriesCatalog as jest.Mock;
const useChecklistMock = useChecklist as jest.Mock;
const useLibraryMock = useLibrary as jest.Mock;

describe('useCreateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    useCategoriesCatalogMock.mockReturnValue(categoriesMock);
    useChecklistMock.mockReturnValue(null);
    useLibraryMock.mockReturnValue({
      createChecklist: mockCreateChecklist,
      updateChecklist: mockUpdateChecklist,
    });
    mockRequireAuth.mockResolvedValue(true);
    mockCreateChecklist.mockResolvedValue({ ok: true, checklistId: 'checklist-new' });
    mockUpdateChecklist.mockResolvedValue({ ok: true, checklistId: checklistDetailsMock.id });
  });

  it('should return create-mode copy and empty form defaults', () => {
    const { result } = renderHook(() => useCreateScreen());

    expect(result.current.screenTitle).toBe(COPY.screens.create.title);
    expect(result.current.screenSubtitle).toBe(COPY.screens.create.subtitle);
    expect(result.current.submitLabel).toBe(COPY.screens.create.cta);
    expect(result.current.sectionsCopy).toEqual(COPY.screens.create.sections);
    expect(result.current.fieldsCopy).toEqual(COPY.screens.create.fields);
    expect(result.current.title).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.selectedCategoryId).toBeNull();
    expect(result.current.tags).toEqual([]);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.categories).toEqual(categoriesMock);
    expect(result.current.isFormReady).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.styles).toBeDefined();
  });

  it('should update title, description, category and tags', () => {
    const { result } = renderHook(() => useCreateScreen());

    act(() => {
      result.current.handleTitleChange('Nova checklist');
      result.current.handleDescriptionChange('Descrição');
      result.current.handleCategorySelect(categoriesMock[0]);
      result.current.handleAddTag('deploy');
    });

    expect(result.current.title).toBe('Nova checklist');
    expect(result.current.description).toBe('Descrição');
    expect(result.current.selectedCategoryId).toBe(categoriesMock[0].id);
    expect(result.current.tags).toEqual(['deploy']);

    act(() => {
      result.current.handleCategorySelect(categoriesMock[0]);
      result.current.handleRemoveTag('deploy');
    });

    expect(result.current.selectedCategoryId).toBeNull();
    expect(result.current.tags).toEqual([]);
  });

  it('should manage draft items', () => {
    const { result } = renderHook(() => useCreateScreen());
    const firstTempId = result.current.items[0].tempId;

    act(() => {
      result.current.handleChangeItemTitle(firstTempId, 'Passo 1');
      result.current.handleChangeItemDescription(firstTempId, 'Detalhe');
      result.current.handleAddItem();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].title).toBe('Passo 1');
    expect(result.current.items[0].description).toBe('Detalhe');

    const secondTempId = result.current.items[1].tempId;

    act(() => {
      result.current.handleRemoveItem(secondTempId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].tempId).toBe(firstTempId);
  });

  it('should set validation errors when submit form is invalid', async () => {
    const { result } = renderHook(() => useCreateScreen());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors.title).toBe(COPY.screens.create.validation.titleRequired);
    expect(result.current.errors.category).toBe(COPY.screens.create.validation.categoryRequired);
    expect(result.current.errors.items).toBe(COPY.screens.create.validation.itemsRequired);
    expect(mockCreateChecklist).not.toHaveBeenCalled();
  });

  it('should create checklist and replace route on success', async () => {
    const { result } = renderHook(() => useCreateScreen());
    const firstTempId = result.current.items[0].tempId;

    act(() => {
      result.current.handleTitleChange('Deploy iOS');
      result.current.handleDescriptionChange('Guia');
      result.current.handleCategorySelect(categoriesMock[0]);
      result.current.handleAddTag('ios');
      result.current.handleChangeItemTitle(firstTempId, 'Build');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockRequireAuth).toHaveBeenCalledWith('create');
    expect(mockCreateChecklist).toHaveBeenCalledWith({
      title: 'Deploy iOS',
      description: 'Guia',
      categoryId: categoriesMock[0].id,
      tags: ['ios'],
      visibility: 'public',
      items: [{ title: 'Build', description: undefined }],
    });
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.checklistDetails('checklist-new'));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should set submit error when createChecklist fails', async () => {
    mockCreateChecklist.mockResolvedValue({ ok: false, error: 'Falha ao criar' });

    const { result } = renderHook(() => useCreateScreen());
    const firstTempId = result.current.items[0].tempId;

    act(() => {
      result.current.handleTitleChange('Deploy iOS');
      result.current.handleCategorySelect(categoriesMock[0]);
      result.current.handleChangeItemTitle(firstTempId, 'Build');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors.submit).toBe('Falha ao criar');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should not submit when requireAuth fails', async () => {
    mockRequireAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useCreateScreen());
    const firstTempId = result.current.items[0].tempId;

    act(() => {
      result.current.handleTitleChange('Deploy iOS');
      result.current.handleCategorySelect(categoriesMock[0]);
      result.current.handleChangeItemTitle(firstTempId, 'Build');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockCreateChecklist).not.toHaveBeenCalled();
  });

  it('should initialize edit mode from existing checklist owned by current user', async () => {
    useChecklistMock.mockReturnValue(checklistDetailsMock);

    const { result } = renderHook(() => useCreateScreen({ checklistId: checklistDetailsMock.id }));

    await waitFor(() => {
      expect(result.current.title).toBe(checklistDetailsMock.title);
    });

    expect(result.current.screenTitle).toBe(COPY.screens.editChecklist.title);
    expect(result.current.submitLabel).toBe(COPY.screens.editChecklist.cta);
    expect(result.current.description).toBe(checklistDetailsMock.description);
    expect(result.current.selectedCategoryId).toBe(checklistDetailsMock.categoryId);
    expect(result.current.tags).toEqual(checklistDetailsMock.tags);
    expect(result.current.items).toHaveLength(checklistDetailsMock.items.length);
    expect(result.current.items[0].title).toBe(checklistDetailsMock.items[0].title);
    expect(result.current.isFormReady).toBe(true);
    expect(useChecklistMock).toHaveBeenCalledWith(checklistDetailsMock.id, authenticatedUserMock.id);
  });

  it('should go back when editing checklist owned by another user', async () => {
    useChecklistMock.mockReturnValue({
      ...checklistDetailsMock,
      authorId: 'other-user',
    });

    renderHook(() => useCreateScreen({ checklistId: checklistDetailsMock.id }));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('should update checklist and replace route on edit submit', async () => {
    useChecklistMock.mockReturnValue(checklistDetailsMock);

    const { result } = renderHook(() => useCreateScreen({ checklistId: checklistDetailsMock.id }));

    await waitFor(() => {
      expect(result.current.title).toBe(checklistDetailsMock.title);
    });

    act(() => {
      result.current.handleTitleChange('Deploy atualizado');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUpdateChecklist).toHaveBeenCalledWith(
      checklistDetailsMock.id,
      expect.objectContaining({
        title: 'Deploy atualizado',
        categoryId: checklistDetailsMock.categoryId,
        tags: checklistDetailsMock.tags,
        visibility: checklistDetailsMock.visibility,
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.checklistDetails(checklistDetailsMock.id));
  });

  it('should go back when handleClose is called', () => {
    const { result } = renderHook(() => useCreateScreen());

    act(() => {
      result.current.handleClose();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should pass null viewerId when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    renderHook(() => useCreateScreen({ checklistId: checklistDetailsMock.id }));

    expect(useChecklistMock).toHaveBeenCalledWith(checklistDetailsMock.id, null);
  });
});

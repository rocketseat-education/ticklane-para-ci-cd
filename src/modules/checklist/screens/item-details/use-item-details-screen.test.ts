import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { itemCommentsMock } from '@mocks/data/comments';
import { checklistItemsMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { useItemDetailsScreen } from './use-item-details-screen';

const mockBack = jest.fn();
const mockReload = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
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

jest.mock('@/state/library', () => ({
  useChecklistItem: jest.fn(),
  useCommentsByItem: jest.fn(),
  useLibrary: jest.fn(),
}));

import { useChecklistItem, useCommentsByItem, useLibrary } from '@/state/library';

const useChecklistItemMock = useChecklistItem as jest.Mock;
const useCommentsByItemMock = useCommentsByItem as jest.Mock;
const useLibraryMock = useLibrary as jest.Mock;

const checklistId = 'checklist-1';
const item = checklistItemsMock[0];

describe('useItemDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLibraryMock.mockReturnValue({
      reload: mockReload,
    });
    useChecklistItemMock.mockReturnValue(item);
    useCommentsByItemMock.mockReturnValue(itemCommentsMock);
  });

  it('should return item, comments, copy and handlers', async () => {
    const { result } = renderHook(() =>
      useItemDetailsScreen({ checklistId, itemId: item.id }),
    );

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });

    expect(result.current.item).toEqual(item);
    expect(result.current.comments).toEqual(itemCommentsMock);
    expect(result.current.itemLabel).toBe(COPY.screens.itemDetails.itemLabel);
    expect(result.current.commentsTitle).toBe(COPY.screens.itemDetails.commentsTitle);
    expect(result.current.noCommentsTitle).toBe(COPY.screens.itemDetails.noCommentsTitle);
    expect(result.current.noCommentsDescription).toBe(
      COPY.screens.itemDetails.noCommentsDescription,
    );
    expect(result.current.notFoundTitle).toBe(COPY.screens.itemDetails.notFoundTitle);
    expect(result.current.notFoundDescription).toBe(COPY.screens.itemDetails.notFoundDescription);
    expect(result.current.styles).toBeDefined();
    expect(useChecklistItemMock).toHaveBeenCalledWith(checklistId, item.id);
    expect(useCommentsByItemMock).toHaveBeenCalledWith(item.id);
  });

  it('should return null item when checklist item is missing', () => {
    useChecklistItemMock.mockReturnValue(null);

    const { result } = renderHook(() =>
      useItemDetailsScreen({ checklistId, itemId: 'missing' }),
    );

    expect(result.current.item).toBeNull();
  });

  it('should go back when handleBack is called', () => {
    const { result } = renderHook(() =>
      useItemDetailsScreen({ checklistId, itemId: item.id }),
    );

    act(() => {
      result.current.handleBack();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

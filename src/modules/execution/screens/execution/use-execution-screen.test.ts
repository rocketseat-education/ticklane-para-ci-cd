import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { offlineExecutionDetailMock } from '@mocks/data/executions';

import { COPY } from '@/constants/copy';

import { useExecutionScreen } from './use-execution-screen';

const mockBack = jest.fn();
const mockGetOfflineExecutionWithItems = jest.fn();
const mockSetOfflineExecutionItemChecked = jest.fn();

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

jest.mock('@/lib/offlineExecution', () => ({
  getOfflineExecutionWithItems: (...args: unknown[]) => mockGetOfflineExecutionWithItems(...args),
  setOfflineExecutionItemChecked: (...args: unknown[]) =>
    mockSetOfflineExecutionItemChecked(...args),
}));

describe('useExecutionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOfflineExecutionWithItems.mockResolvedValue(offlineExecutionDetailMock);
    mockSetOfflineExecutionItemChecked.mockResolvedValue(undefined);
  });

  it('should load execution detail and return progress counts', async () => {
    const { result } = renderHook(() => useExecutionScreen({ id: offlineExecutionDetailMock.id }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detail).toEqual(offlineExecutionDetailMock);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.doneCount).toBe(1);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.screenCopy).toBe(COPY.screens.execution);
    expect(result.current.styles).toBeDefined();
    expect(mockGetOfflineExecutionWithItems).toHaveBeenCalledWith(offlineExecutionDetailMock.id);
  });

  it('should mark as not found when execution does not exist', async () => {
    mockGetOfflineExecutionWithItems.mockResolvedValue(null);

    const { result } = renderHook(() => useExecutionScreen({ id: 'missing' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detail).toBeNull();
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.doneCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should go back when handleBack is called', async () => {
    const { result } = renderHook(() => useExecutionScreen({ id: offlineExecutionDetailMock.id }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should toggle item checked state and reload silently', async () => {
    const updatedDetail = {
      ...offlineExecutionDetailMock,
      items: offlineExecutionDetailMock.items.map((item, index) =>
        index === 1 ? { ...item, checked: true } : item,
      ),
    };
    mockGetOfflineExecutionWithItems
      .mockResolvedValueOnce(offlineExecutionDetailMock)
      .mockResolvedValueOnce(updatedDetail);

    const { result } = renderHook(() => useExecutionScreen({ id: offlineExecutionDetailMock.id }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const uncheckedItem = offlineExecutionDetailMock.items[1];

    await act(async () => {
      await result.current.handleToggleItem(uncheckedItem, true);
    });

    expect(mockSetOfflineExecutionItemChecked).toHaveBeenCalledWith(
      offlineExecutionDetailMock.id,
      uncheckedItem.id,
      true,
    );
    expect(result.current.detail).toEqual(updatedDetail);
    expect(result.current.doneCount).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });
});

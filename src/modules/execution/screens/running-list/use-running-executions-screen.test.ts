import { act, renderHook } from '@tests/utils/test-utils';
import { offlineExecutionsMock } from '@mocks/data/executions';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import { useRunningExecutionsScreen } from './use-running-executions-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@/modules/execution/hooks/use-offline-executions', () => ({
  useOfflineExecutions: jest.fn(),
}));

jest.mock('@/lib/offlineExecution', () => ({
  formatOfflineExecutionUpdatedAt: jest.fn((value: string) => `formatted:${value}`),
}));

import { useOfflineExecutions } from '@/modules/execution/hooks/use-offline-executions';
import { formatOfflineExecutionUpdatedAt } from '@/lib/offlineExecution';

const useOfflineExecutionsMock = useOfflineExecutions as jest.Mock;

describe('useRunningExecutionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOfflineExecutionsMock.mockReturnValue({ executions: offlineExecutionsMock });
  });

  it('should return copy, executions and format helpers', () => {
    const { result } = renderHook(() => useRunningExecutionsScreen());

    expect(result.current.screenCopy).toBe(COPY.screens.runningExecutionsList);
    expect(result.current.executions).toEqual(offlineExecutionsMock);
    expect(result.current.progressOf).toBe(COPY.screens.profile.sections.runningExecutions.progressOf);
    expect(result.current.formatRunningExecutionDate).toBe(formatOfflineExecutionUpdatedAt);
    expect(result.current.styles).toBeDefined();
    expect(result.current.progressOf(2, 8)).toBe('2 de 8');
  });

  it('should navigate back, to execution and home', () => {
    const { result } = renderHook(() => useRunningExecutionsScreen());

    act(() => {
      result.current.handleBack();
      result.current.handleExecutionPress(offlineExecutionsMock[0]);
      result.current.handleExploreHome();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.execution(offlineExecutionsMock[0].id));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.tabs.home);
  });
});

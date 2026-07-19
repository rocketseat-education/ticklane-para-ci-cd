import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { offlineExecutionsMock } from '@mocks/data/executions';

import { COPY } from '@/constants/copy';

import { RunningExecutionsScreen } from './running-executions-screen';
import { useRunningExecutionsScreen } from './use-running-executions-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-running-executions-screen', () => ({
  useRunningExecutionsScreen: jest.fn(),
}));

jest.mock('@/modules/execution/components/offline-execution-card', () => {
  const { Text, Pressable } = require('react-native');
  return {
    OfflineExecutionCard: ({
      execution,
      onPress,
    }: {
      execution: { id: string; title: string };
      onPress: (execution: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={execution.title}
        onPress={() => onPress(execution)}
      >
        <Text>{execution.title}</Text>
      </Pressable>
    ),
  };
});

const useRunningExecutionsScreenMock = useRunningExecutionsScreen as jest.Mock;
const screenCopy = COPY.screens.runningExecutionsList;

const defaultMock = {
  styles: {
    scrollContent: {},
    topBar: {},
    list: {},
  },
  screenCopy,
  executions: offlineExecutionsMock,
  progressOf: COPY.screens.profile.sections.runningExecutions.progressOf,
  formatRunningExecutionDate: jest.fn((value: string) => `formatted:${value}`),
  handleBack: jest.fn(),
  handleExecutionPress: jest.fn(),
  handleExploreHome: jest.fn(),
};

describe('Screen: RunningExecutionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRunningExecutionsScreenMock.mockReturnValue(defaultMock);
  });

  it('should render title, subtitle and executions list', () => {
    render(<RunningExecutionsScreen />);

    expect(screen.getByText(screenCopy.title)).toBeTruthy();
    expect(screen.getByText(screenCopy.subtitle)).toBeTruthy();
    expect(screen.getByText(offlineExecutionsMock[0].title)).toBeTruthy();
    expect(screen.getByText(offlineExecutionsMock[1].title)).toBeTruthy();
  });

  it('should call handleBack and handleExecutionPress', () => {
    const handleBack = jest.fn();
    const handleExecutionPress = jest.fn();
    useRunningExecutionsScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
      handleExecutionPress,
    });

    render(<RunningExecutionsScreen />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));
    fireEvent.press(screen.getByLabelText(offlineExecutionsMock[0].title));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleExecutionPress).toHaveBeenCalledWith(offlineExecutionsMock[0]);
  });

  it('should render empty state and call handleExploreHome', () => {
    const handleExploreHome = jest.fn();
    useRunningExecutionsScreenMock.mockReturnValue({
      ...defaultMock,
      executions: [],
      handleExploreHome,
    });

    render(<RunningExecutionsScreen />);

    expect(screen.getByText(screenCopy.emptyTitle)).toBeTruthy();
    expect(screen.getByText(screenCopy.emptyDescription)).toBeTruthy();
    fireEvent.press(screen.getByText(screenCopy.exploreCta));
    expect(handleExploreHome).toHaveBeenCalledTimes(1);
  });
});

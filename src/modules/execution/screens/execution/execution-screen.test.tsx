import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { offlineExecutionDetailMock } from '@mocks/data/executions';

import { COPY } from '@/constants/copy';

import { ExecutionScreen } from './execution-screen';
import { useExecutionScreen } from './use-execution-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-execution-screen', () => ({
  useExecutionScreen: jest.fn(),
}));

jest.mock('@/modules/checklist/components', () => {
  const { Text, View } = require('react-native');
  return {
    LinksList: ({ links }: { links: { label: string }[] }) => (
      <View>
        {links.map((link) => (
          <Text key={link.label}>{link.label}</Text>
        ))}
      </View>
    ),
  };
});

const useExecutionScreenMock = useExecutionScreen as jest.Mock;

const defaultMock = {
  styles: {
    topBar: {},
    center: {},
    scrollContent: {},
    section: {},
    notice: {},
    progressRow: {},
    progressBarWrap: {},
    list: {},
    itemRow: {},
    itemBody: {},
  },
  screenCopy: COPY.screens.execution,
  detail: offlineExecutionDetailMock,
  isLoading: false,
  isNotFound: false,
  doneCount: 1,
  totalCount: 2,
  handleBack: jest.fn(),
  handleToggleItem: jest.fn(),
};

describe('Screen: ExecutionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExecutionScreenMock.mockReturnValue(defaultMock);
  });

  it('should render loading state', () => {
    useExecutionScreenMock.mockReturnValue({
      ...defaultMock,
      isLoading: true,
      detail: null,
    });

    render(<ExecutionScreen id={offlineExecutionDetailMock.id} />);

    expect(screen.getByLabelText(COPY.actions.back)).toBeTruthy();
    expect(useExecutionScreenMock).toHaveBeenCalledWith({ id: offlineExecutionDetailMock.id });
  });

  it('should render not found state', () => {
    useExecutionScreenMock.mockReturnValue({
      ...defaultMock,
      detail: null,
      isNotFound: true,
    });

    render(<ExecutionScreen id="missing" />);

    expect(screen.getByText(COPY.screens.execution.notFoundTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.execution.notFoundDescription)).toBeTruthy();
  });

  it('should render execution details, progress and items', () => {
    render(<ExecutionScreen id={offlineExecutionDetailMock.id} />);

    expect(screen.getByText(offlineExecutionDetailMock.categoryName)).toBeTruthy();
    expect(screen.getByText(offlineExecutionDetailMock.title)).toBeTruthy();
    expect(screen.getByText(offlineExecutionDetailMock.description)).toBeTruthy();
    expect(screen.getByText(COPY.screens.execution.offlineNotice)).toBeTruthy();
    expect(screen.getByText(COPY.screens.execution.progressLabel)).toBeTruthy();
    expect(screen.getByText(COPY.screens.execution.progressCount(1, 2))).toBeTruthy();
    expect(screen.getByText(offlineExecutionDetailMock.links[0].label)).toBeTruthy();
    expect(screen.getByText(offlineExecutionDetailMock.items[0].title)).toBeTruthy();
    expect(screen.getByText(offlineExecutionDetailMock.items[1].title)).toBeTruthy();
  });

  it('should call handleBack when back button is pressed', () => {
    const handleBack = jest.fn();
    useExecutionScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
    });

    render(<ExecutionScreen id={offlineExecutionDetailMock.id} />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('should call handleToggleItem when checkbox is pressed', () => {
    const handleToggleItem = jest.fn();
    useExecutionScreenMock.mockReturnValue({
      ...defaultMock,
      handleToggleItem,
    });

    render(<ExecutionScreen id={offlineExecutionDetailMock.id} />);
    fireEvent.press(screen.getByLabelText(offlineExecutionDetailMock.items[1].title));

    expect(handleToggleItem).toHaveBeenCalledWith(offlineExecutionDetailMock.items[1], true);
  });
});

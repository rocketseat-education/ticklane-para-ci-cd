import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { MyChecklistsScreen } from './my-checklists-screen';
import { useMyChecklistsScreen } from './use-my-checklists-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-my-checklists-screen', () => ({
  useMyChecklistsScreen: jest.fn(),
}));

jest.mock('@/modules/checklist/components', () => {
  const { Text, Pressable } = require('react-native');
  return {
    ChecklistListItem: ({
      checklist,
      onPress,
    }: {
      checklist: { id: string; title: string };
      onPress: (checklist: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={checklist.title}
        onPress={() => onPress(checklist)}
      >
        <Text>{checklist.title}</Text>
      </Pressable>
    ),
  };
});

const useMyChecklistsScreenMock = useMyChecklistsScreen as jest.Mock;
const screenCopy = COPY.screens.profileMyChecklistsList;

const defaultMock = {
  styles: {
    scrollContent: {},
    topBar: {},
    list: {},
    emptyActions: {},
  },
  screenCopy,
  checklists: checklistSummariesMock,
  isGuest: false,
  emptyDescription: screenCopy.emptyDescription,
  connectLabel: COPY.screens.profile.connectCta,
  handleBack: jest.fn(),
  handleChecklistPress: jest.fn(),
  handleExplorePress: jest.fn(),
  handleConnectPress: jest.fn(),
  handleCreatePress: jest.fn(),
};

describe('Screen: MyChecklistsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMyChecklistsScreenMock.mockReturnValue(defaultMock);
  });

  it('should render title, subtitle and checklists list', () => {
    render(<MyChecklistsScreen />);

    expect(screen.getByText(screenCopy.title)).toBeTruthy();
    expect(screen.getByText(screenCopy.subtitle)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[1].title)).toBeTruthy();
  });

  it('should call handleBack and handleChecklistPress', () => {
    const handleBack = jest.fn();
    const handleChecklistPress = jest.fn();
    useMyChecklistsScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
      handleChecklistPress,
    });

    render(<MyChecklistsScreen />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should render create and explore CTAs when empty for authenticated users', () => {
    const handleCreatePress = jest.fn();
    const handleExplorePress = jest.fn();
    useMyChecklistsScreenMock.mockReturnValue({
      ...defaultMock,
      checklists: [],
      handleCreatePress,
      handleExplorePress,
    });

    render(<MyChecklistsScreen />);

    expect(screen.getByText(screenCopy.emptyTitle)).toBeTruthy();
    expect(screen.getByText(screenCopy.emptyDescription)).toBeTruthy();
    fireEvent.press(screen.getByText(screenCopy.createCta));
    fireEvent.press(screen.getByText(screenCopy.exploreCta));
    expect(handleCreatePress).toHaveBeenCalledTimes(1);
    expect(handleExplorePress).toHaveBeenCalledTimes(1);
  });

  it('should render connect CTA for guests', () => {
    const handleConnectPress = jest.fn();
    useMyChecklistsScreenMock.mockReturnValue({
      ...defaultMock,
      checklists: [],
      isGuest: true,
      emptyDescription: screenCopy.guestEmptyDescription,
      handleConnectPress,
    });

    render(<MyChecklistsScreen />);

    expect(screen.getByText(screenCopy.guestEmptyDescription)).toBeTruthy();
    fireEvent.press(screen.getByText(COPY.screens.profile.connectCta));
    expect(handleConnectPress).toHaveBeenCalledTimes(1);
  });
});

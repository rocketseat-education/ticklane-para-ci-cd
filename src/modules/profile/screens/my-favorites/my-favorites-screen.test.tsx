import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { MyFavoritesScreen } from './my-favorites-screen';
import { useMyFavoritesScreen } from './use-my-favorites-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-my-favorites-screen', () => ({
  useMyFavoritesScreen: jest.fn(),
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

const useMyFavoritesScreenMock = useMyFavoritesScreen as jest.Mock;
const screenCopy = COPY.screens.profileMyFavoritesList;

const defaultMock = {
  styles: {
    scrollContent: {},
    topBar: {},
    list: {},
    emptyActions: {},
  },
  screenCopy,
  favorites: checklistSummariesMock,
  isGuest: false,
  emptyDescription: screenCopy.emptyDescription,
  connectLabel: COPY.screens.profile.connectCta,
  handleBack: jest.fn(),
  handleChecklistPress: jest.fn(),
  handleExplorePress: jest.fn(),
  handleConnectPress: jest.fn(),
};

describe('Screen: MyFavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMyFavoritesScreenMock.mockReturnValue(defaultMock);
  });

  it('should render title, subtitle and favorites list', () => {
    render(<MyFavoritesScreen />);

    expect(screen.getByText(screenCopy.title)).toBeTruthy();
    expect(screen.getByText(screenCopy.subtitle)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[1].title)).toBeTruthy();
  });

  it('should call handleBack and handleChecklistPress', () => {
    const handleBack = jest.fn();
    const handleChecklistPress = jest.fn();
    useMyFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
      handleChecklistPress,
    });

    render(<MyFavoritesScreen />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should render explore CTA when empty for authenticated users without connect', () => {
    const handleExplorePress = jest.fn();
    useMyFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      favorites: [],
      handleExplorePress,
    });

    render(<MyFavoritesScreen />);

    expect(screen.getByText(screenCopy.emptyTitle)).toBeTruthy();
    expect(screen.getByText(screenCopy.emptyDescription)).toBeTruthy();
    expect(screen.queryByText(COPY.screens.profile.connectCta)).toBeNull();
    fireEvent.press(screen.getByText(screenCopy.exploreCta));
    expect(handleExplorePress).toHaveBeenCalledTimes(1);
  });

  it('should render connect CTA for guests', () => {
    const handleConnectPress = jest.fn();
    useMyFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      favorites: [],
      isGuest: true,
      emptyDescription: screenCopy.guestEmptyDescription,
      handleConnectPress,
    });

    render(<MyFavoritesScreen />);

    expect(screen.getByText(screenCopy.guestEmptyDescription)).toBeTruthy();
    fireEvent.press(screen.getByText(COPY.screens.profile.connectCta));
    expect(handleConnectPress).toHaveBeenCalledTimes(1);
  });
});

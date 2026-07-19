import { checklistSummariesMock } from '@mocks/data/checklists';
import { fireEvent, render, screen } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { FavoritesScreen } from './favorites-screen';
import { useFavoritesScreen } from './use-favorites-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-favorites-screen', () => ({
  useFavoritesScreen: jest.fn(),
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

const useFavoritesScreenMock = useFavoritesScreen as jest.Mock;

const defaultMock = {
  styles: {
    scrollContent: {},
    list: {},
    guestCta: {},
  },
  title: COPY.screens.favorites.title,
  subtitle: COPY.screens.favorites.subtitle,
  emptyTitle: COPY.states.emptyTitle,
  emptyDescription: COPY.screens.favorites.emptyDescription,
  connectLabel: COPY.screens.profile.connectCta,
  favorites: checklistSummariesMock,
  isGuest: false,
  handleChecklistPress: jest.fn(),
  handleConnectPress: jest.fn(),
};

describe('Screen: FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFavoritesScreenMock.mockReturnValue(defaultMock);
  });

  it('should render title, subtitle and favorites list', () => {
    render(<FavoritesScreen />);

    expect(screen.getByText(COPY.screens.favorites.title)).toBeFalsy();
    expect(screen.getByText(COPY.screens.favorites.subtitle)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[1].title)).toBeTruthy();
  });

  it('should call handleChecklistPress when a checklist is pressed', () => {
    const handleChecklistPress = jest.fn();
    useFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      handleChecklistPress,
    });

    render(<FavoritesScreen />);
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleChecklistPress).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should render empty state for authenticated users without connect CTA', () => {
    useFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      favorites: [],
      isGuest: false,
    });

    render(<FavoritesScreen />);

    expect(screen.getByText(COPY.states.emptyTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.favorites.emptyDescription)).toBeTruthy();
    expect(screen.queryByText(COPY.screens.profile.connectCta)).toBeNull();
  });

  it('should render connect CTA for guests and call handleConnectPress', () => {
    const handleConnectPress = jest.fn();
    useFavoritesScreenMock.mockReturnValue({
      ...defaultMock,
      favorites: [],
      isGuest: true,
      emptyDescription: COPY.screens.favorites.guestEmptyDescription,
      handleConnectPress,
    });

    render(<FavoritesScreen />);

    expect(screen.getByText(COPY.screens.favorites.guestEmptyDescription)).toBeTruthy();
    fireEvent.press(screen.getByText(COPY.screens.profile.connectCta));
    expect(handleConnectPress).toHaveBeenCalledTimes(1);
  });
});

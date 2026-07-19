import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { HomeScreen } from './home-screen';
import { useHomeScreen } from './use-home-screen';

jest.mock('./use-home-screen', () => ({
  useHomeScreen: jest.fn(),
}));

jest.mock('@/components/horizontal-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HorizontalList: ({
      data,
      keyExtractor,
      renderItem,
    }: {
      data: unknown[];
      keyExtractor: (item: unknown) => string;
      renderItem: (item: unknown) => React.ReactNode;
    }) => (
      <View>
        {data.map((item) => (
          <React.Fragment key={keyExtractor(item)}>{renderItem(item)}</React.Fragment>
        ))}
      </View>
    ),
  };
});

jest.mock('@/modules/checklist/components', () => {
  const { Text, Pressable } = require('react-native');
  return {
    ChecklistCard: ({
      checklist,
      onPress,
    }: {
      checklist: { id: string; title: string };
      onPress: (checklist: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`card-${checklist.title}`}
        onPress={() => onPress(checklist)}
      >
        <Text>{checklist.title}</Text>
      </Pressable>
    ),
    ChecklistListItem: ({
      checklist,
      onPress,
    }: {
      checklist: { id: string; title: string };
      onPress: (checklist: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`item-${checklist.title}`}
        onPress={() => onPress(checklist)}
      >
        <Text>{checklist.title}</Text>
      </Pressable>
    ),
  };
});

const useHomeScreenMock = useHomeScreen as jest.Mock;

const defaultMock = {
  styles: {
    scrollContent: {},
    section: {},
    list: {},
  },
  title: COPY.screens.home.title,
  subtitle: COPY.screens.home.subtitle,
  popularTitle: COPY.screens.home.popularTitle,
  trendingTitle: COPY.screens.home.trendingTitle,
  recentTitle: COPY.screens.home.recentTitle,
  popularChecklists: [checklistSummariesMock[0]],
  trendingChecklists: [checklistSummariesMock[1]],
  recentChecklists: checklistSummariesMock,
  handleChecklistPress: jest.fn(),
};

describe('Screen: HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHomeScreenMock.mockReturnValue(defaultMock);
  });

  it('should render headers and section titles', () => {
    render(<HomeScreen />);

    expect(screen.getByText(COPY.screens.home.title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.home.subtitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.home.popularTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.home.trendingTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.home.recentTitle)).toBeTruthy();
  });

  it('should call handleChecklistPress when a popular card is pressed', () => {
    const handleChecklistPress = jest.fn();
    useHomeScreenMock.mockReturnValue({
      ...defaultMock,
      handleChecklistPress,
    });

    render(<HomeScreen />);
    fireEvent.press(screen.getByLabelText(`card-${checklistSummariesMock[0].title}`));

    expect(handleChecklistPress).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should call handleChecklistPress when a recent list item is pressed', () => {
    const handleChecklistPress = jest.fn();
    useHomeScreenMock.mockReturnValue({
      ...defaultMock,
      handleChecklistPress,
    });

    render(<HomeScreen />);
    fireEvent.press(screen.getByLabelText(`item-${checklistSummariesMock[1].title}`));

    expect(handleChecklistPress).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[1]);
  });
});

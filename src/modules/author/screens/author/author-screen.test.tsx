import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { authenticatedUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';

import { AuthorScreen } from './author-screen';
import { useAuthorScreen } from './use-author-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-author-screen', () => ({
  useAuthorScreen: jest.fn(),
}));

jest.mock('../../components/author-header', () => {
  const { Text, View } = require('react-native');
  return {
    AuthorHeader: ({
      user,
      stats,
    }: {
      user: { displayName: string };
      stats: { label: string; value: string | number }[];
    }) => (
      <View>
        <Text>{user.displayName}</Text>
        {stats.map((stat) => (
          <Text key={stat.label}>
            {stat.value} {stat.label}
          </Text>
        ))}
      </View>
    ),
  };
});

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

const useAuthorScreenMock = useAuthorScreen as jest.Mock;

const defaultMock = {
  styles: {
    scrollContent: {},
    topBar: {},
    section: {},
    list: {},
  },
  author: authenticatedUserMock,
  checklists: checklistSummariesMock,
  stats: [
    { label: COPY.screens.author.stats.checklists, value: 2 },
    { label: COPY.screens.author.stats.comments, value: 7 },
    { label: COPY.screens.author.stats.favorites, value: 17 },
  ],
  checklistsTitle: COPY.screens.author.checklistsTitle,
  emptyTitle: COPY.screens.author.emptyTitle,
  emptyDescription: COPY.screens.author.emptyDescription,
  notFoundTitle: COPY.screens.author.notFoundTitle,
  notFoundDescription: COPY.screens.author.notFoundDescription,
  handleBack: jest.fn(),
  handleChecklistPress: jest.fn(),
};

describe('Screen: AuthorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthorScreenMock.mockReturnValue(defaultMock);
  });

  it('should render author header, checklists title and list', () => {
    render(<AuthorScreen id={authenticatedUserMock.id} />);

    expect(useAuthorScreenMock).toHaveBeenCalledWith({ id: authenticatedUserMock.id });
    expect(screen.getByText(authenticatedUserMock.displayName)).toBeTruthy();
    expect(screen.getByText(COPY.screens.author.checklistsTitle)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[1].title)).toBeTruthy();
  });

  it('should call handleBack and handleChecklistPress', () => {
    const handleBack = jest.fn();
    const handleChecklistPress = jest.fn();
    useAuthorScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
      handleChecklistPress,
    });

    render(<AuthorScreen id={authenticatedUserMock.id} />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should render empty checklists state when author has no checklists', () => {
    useAuthorScreenMock.mockReturnValue({
      ...defaultMock,
      checklists: [],
    });

    render(<AuthorScreen id={authenticatedUserMock.id} />);

    expect(screen.getByText(COPY.screens.author.emptyTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.author.emptyDescription)).toBeTruthy();
  });

  it('should render not found state when author is missing', () => {
    const handleBack = jest.fn();
    useAuthorScreenMock.mockReturnValue({
      ...defaultMock,
      author: undefined,
      handleBack,
    });

    render(<AuthorScreen id="missing" />);

    expect(screen.getByText(COPY.screens.author.notFoundTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.author.notFoundDescription)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(COPY.actions.back));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';
import { checklistSummariesMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { SearchScreen } from './search-screen';
import { useSearchScreen } from './use-search-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-search-screen', () => ({
  useSearchScreen: jest.fn(),
}));

jest.mock('@/components/search-bar', () => {
  const { TextInput } = require('react-native');
  return {
    SearchBar: ({
      value,
      placeholder,
      onChangeText,
    }: {
      value: string;
      placeholder: string;
      onChangeText: (text: string) => void;
    }) => (
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        accessibilityLabel="search-input"
      />
    ),
  };
});

jest.mock('@/modules/categories/components', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    CategoryFilter: ({
      categories,
      allLabel,
      onCategoryPress,
    }: {
      categories: { id: string; name: string }[];
      allLabel: string;
      onCategoryPress: (category: { id: string; name: string } | null) => void;
    }) => (
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={allLabel} onPress={() => onCategoryPress(null)}>
          <Text>{allLabel}</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            onPress={() => onCategoryPress(category)}
          >
            <Text>{category.name}</Text>
          </Pressable>
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

const useSearchScreenMock = useSearchScreen as jest.Mock;

const defaultMock = {
  styles: {
    controls: {},
    inlineMessage: {},
    listRefreshBanner: {},
    loaderWrap: {},
    footerLoader: {},
    listContent: {},
    itemGap: {},
  },
  title: COPY.screens.search.title,
  subtitle: COPY.screens.search.subtitle,
  placeholder: COPY.screens.search.placeholder,
  allCategoriesLabel: COPY.screens.search.allCategoriesLabel,
  emptyTitle: COPY.states.emptyTitle,
  emptyDescription: COPY.states.placeholderDescription,
  listUpdatingLabel: COPY.screens.search.listUpdating,
  term: '',
  categories: categoriesMock,
  selectedCategoryId: null,
  items: checklistSummariesMock,
  loading: false,
  loadingMore: false,
  listError: null,
  setTerm: jest.fn(),
  handleCategoryPress: jest.fn(),
  handleChecklistPress: jest.fn(),
  loadMore: jest.fn(),
};

describe('Screen: SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearchScreenMock.mockReturnValue(defaultMock);
  });

  it('should render header, search controls and checklist items', () => {
    render(<SearchScreen />);

    expect(screen.getByText(COPY.screens.search.title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.search.subtitle)).toBeTruthy();
    expect(screen.getByLabelText('search-input')).toBeTruthy();
    expect(screen.getByText(COPY.screens.search.allCategoriesLabel)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistSummariesMock[1].title)).toBeTruthy();
  });

  it('should call setTerm when search text changes', () => {
    const setTerm = jest.fn();
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      setTerm,
    });

    render(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('search-input'), 'deploy');

    expect(setTerm).toHaveBeenCalledWith('deploy');
  });

  it('should call handleChecklistPress when a checklist is pressed', () => {
    const handleChecklistPress = jest.fn();
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      handleChecklistPress,
    });

    render(<SearchScreen />);
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });

  it('should call handleCategoryPress when a category is pressed', () => {
    const handleCategoryPress = jest.fn();
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      handleCategoryPress,
    });

    render(<SearchScreen />);
    fireEvent.press(screen.getByLabelText(categoriesMock[0].name));

    expect(handleCategoryPress).toHaveBeenCalledWith(categoriesMock[0]);
  });

  it('should render empty state when there are no items and not loading', () => {
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      items: [],
      loading: false,
      listError: null,
    });

    render(<SearchScreen />);

    expect(screen.getByText(COPY.states.emptyTitle)).toBeTruthy();
    expect(screen.getByText(COPY.states.placeholderDescription)).toBeTruthy();
  });

  it('should render error state when listError is set', () => {
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      items: [],
      listError: 'Falha de rede',
    });

    render(<SearchScreen />);

    expect(screen.getByText('Erro')).toBeTruthy();
    expect(screen.getByText('Falha de rede')).toBeTruthy();
  });

  it('should show list updating banner when refreshing with existing items', () => {
    useSearchScreenMock.mockReturnValue({
      ...defaultMock,
      loading: true,
      items: checklistSummariesMock,
      listError: null,
    });

    render(<SearchScreen />);

    expect(screen.getByLabelText(COPY.screens.search.listUpdating)).toBeTruthy();
    expect(screen.getByText(COPY.screens.search.listUpdating)).toBeTruthy();
  });
});

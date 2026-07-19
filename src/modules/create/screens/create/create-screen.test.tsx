import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { categoriesMock } from '@mocks/data/categories';

import { COPY } from '@/constants/copy';

import { CreateScreen } from './create-screen';
import { useCreateScreen } from './use-create-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-create-screen', () => ({
  useCreateScreen: jest.fn(),
}));

jest.mock('../../components/category-selector', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    CategorySelector: ({
      categories,
      selectedCategoryId,
      onSelect,
    }: {
      categories: { id: string; name: string }[];
      selectedCategoryId: string | null;
      onSelect: (category: { id: string; name: string }) => void;
    }) => (
      <View>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            onPress={() => onSelect(category)}
          >
            <Text>
              {category.name}
              {selectedCategoryId === category.id ? ' (selected)' : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

jest.mock('../../components/items-editor', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    ItemsEditor: ({
      items,
      onAddItem,
      onChangeItemTitle,
    }: {
      items: { tempId: string; title: string }[];
      onAddItem: () => void;
      onChangeItemTitle: (tempId: string, value: string) => void;
    }) => (
      <View>
        {items.map((item) => (
          <Pressable
            key={item.tempId}
            accessibilityRole="button"
            accessibilityLabel={`item-${item.tempId}`}
            onPress={() => onChangeItemTitle(item.tempId, `${item.title}-edited`)}
          >
            <Text>{item.title || 'empty-item'}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="add-item" onPress={onAddItem}>
          <Text>add-item</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('../../components/tag-input', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    TagInput: ({
      tags,
      onAdd,
      onRemove,
    }: {
      tags: string[];
      onAdd: (tag: string) => void;
      onRemove: (tag: string) => void;
    }) => (
      <View>
        {tags.map((tag) => (
          <Pressable
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={`remove-${tag}`}
            onPress={() => onRemove(tag)}
          >
            <Text>{tag}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="add-tag" onPress={() => onAdd('nova')}>
          <Text>add-tag</Text>
        </Pressable>
      </View>
    ),
  };
});

const useCreateScreenMock = useCreateScreen as jest.Mock;

const draftItem = {
  tempId: 'draft-1',
  title: 'Build',
  description: '',
};

const defaultMock = {
  styles: {
    loading: {},
    flex: {},
    scrollContent: {},
    section: {},
  },
  title: 'Deploy iOS',
  description: 'Guia de publicação',
  selectedCategoryId: categoriesMock[0].id,
  tags: ['ios'],
  items: [draftItem],
  categories: categoriesMock,
  errors: {},
  isSubmitting: false,
  isFormReady: true,
  screenTitle: COPY.screens.create.title,
  screenSubtitle: COPY.screens.create.subtitle,
  sectionsCopy: COPY.screens.create.sections,
  fieldsCopy: COPY.screens.create.fields,
  submitLabel: COPY.screens.create.cta,
  handleTitleChange: jest.fn(),
  handleDescriptionChange: jest.fn(),
  handleCategorySelect: jest.fn(),
  handleAddTag: jest.fn(),
  handleRemoveTag: jest.fn(),
  handleAddItem: jest.fn(),
  handleRemoveItem: jest.fn(),
  handleChangeItemTitle: jest.fn(),
  handleChangeItemDescription: jest.fn(),
  handleClose: jest.fn(),
  handleSubmit: jest.fn(),
};

describe('Screen: CreateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCreateScreenMock.mockReturnValue(defaultMock);
  });

  it('should render loading state when form is not ready', () => {
    useCreateScreenMock.mockReturnValue({
      ...defaultMock,
      isFormReady: false,
    });

    render(<CreateScreen checklistId="checklist-1" />);

    expect(useCreateScreenMock).toHaveBeenCalledWith({ checklistId: 'checklist-1' });
  });

  it('should render form sections, values and submit button', () => {
    render(<CreateScreen />);

    expect(screen.getByText(COPY.screens.create.title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.subtitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.sections.details)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.sections.category)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.sections.tags)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.sections.items)).toBeTruthy();
    expect(screen.getByDisplayValue('Deploy iOS')).toBeTruthy();
    expect(screen.getByDisplayValue('Guia de publicação')).toBeTruthy();
    expect(screen.getByLabelText(categoriesMock[0].name)).toBeTruthy();
    expect(screen.getByText('ios')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.cta)).toBeTruthy();
  });

  it('should call handlers from form interactions', () => {
    const handleTitleChange = jest.fn();
    const handleCategorySelect = jest.fn();
    const handleAddTag = jest.fn();
    const handleRemoveTag = jest.fn();
    const handleAddItem = jest.fn();
    const handleChangeItemTitle = jest.fn();
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    useCreateScreenMock.mockReturnValue({
      ...defaultMock,
      handleTitleChange,
      handleCategorySelect,
      handleAddTag,
      handleRemoveTag,
      handleAddItem,
      handleChangeItemTitle,
      handleClose,
      handleSubmit,
    });

    render(<CreateScreen />);

    fireEvent.changeText(screen.getByDisplayValue('Deploy iOS'), 'Novo título');
    fireEvent.press(screen.getByLabelText(categoriesMock[0].name));
    fireEvent.press(screen.getByLabelText('add-tag'));
    fireEvent.press(screen.getByLabelText('remove-ios'));
    fireEvent.press(screen.getByLabelText('add-item'));
    fireEvent.press(screen.getByLabelText('item-draft-1'));
    fireEvent.press(screen.getByLabelText(COPY.actions.cancel));
    fireEvent.press(screen.getByText(COPY.screens.create.cta));

    expect(handleTitleChange).toHaveBeenCalledWith('Novo título');
    expect(handleCategorySelect).toHaveBeenCalledWith(categoriesMock[0]);
    expect(handleAddTag).toHaveBeenCalledWith('nova');
    expect(handleRemoveTag).toHaveBeenCalledWith('ios');
    expect(handleAddItem).toHaveBeenCalledTimes(1);
    expect(handleChangeItemTitle).toHaveBeenCalledWith('draft-1', 'Build-edited');
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should render validation errors', () => {
    useCreateScreenMock.mockReturnValue({
      ...defaultMock,
      errors: {
        title: COPY.screens.create.validation.titleRequired,
        category: COPY.screens.create.validation.categoryRequired,
        items: COPY.screens.create.validation.itemsRequired,
        submit: 'Falha ao salvar',
      },
    });

    render(<CreateScreen />);

    expect(screen.getByText(COPY.screens.create.validation.titleRequired)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.validation.categoryRequired)).toBeTruthy();
    expect(screen.getByText(COPY.screens.create.validation.itemsRequired)).toBeTruthy();
    expect(screen.getByText('Falha ao salvar')).toBeTruthy();
  });
});

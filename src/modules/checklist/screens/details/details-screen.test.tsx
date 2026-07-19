import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistCommentsMock } from '@mocks/data/comments';
import { checklistDetailsMock, checklistItemsMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { DetailsScreen } from './details-screen';
import { useDetailsScreen } from './use-details-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-details-screen', () => ({
  useDetailsScreen: jest.fn(),
}));

jest.mock('@/modules/checklist/components', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    ChecklistHeader: ({
      checklist,
      onRatePress,
    }: {
      checklist: { title: string };
      onRatePress: () => void;
    }) => (
      <View>
        <Text>{checklist.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="rate-checklist" onPress={onRatePress}>
          <Text>rate</Text>
        </Pressable>
      </View>
    ),
    ChecklistItemRow: ({
      item,
      onPress,
    }: {
      item: { id: string; title: string };
      onPress: (item: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => onPress(item)}
      >
        <Text>{item.title}</Text>
      </Pressable>
    ),
    CommentComposer: () => <Text>comment-composer</Text>,
    CommentsList: ({ comments }: { comments: { content: string }[] }) => (
      <View>
        {comments.map((comment) => (
          <Text key={comment.content}>{comment.content}</Text>
        ))}
      </View>
    ),
    LinksList: ({ links }: { links: { label: string }[] }) => (
      <View>
        {links.map((link) => (
          <Text key={link.label}>{link.label}</Text>
        ))}
      </View>
    ),
    RateChecklistSheet: ({
      visible,
      onClose,
      checklistTitle,
    }: {
      visible: boolean;
      onClose: () => void;
      checklistTitle: string;
    }) =>
      visible ? (
        <View>
          <Text>{`rate-sheet-${checklistTitle}`}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="close-rate-sheet" onPress={onClose}>
            <Text>close</Text>
          </Pressable>
        </View>
      ) : null,
  };
});

const useDetailsScreenMock = useDetailsScreen as jest.Mock;

const defaultMock = {
  styles: {
    topBar: {},
    scrollContent: {},
    section: {},
    list: {},
    emptyComments: {},
  },
  title: COPY.screens.checklistDetails.title,
  subtitle: checklistDetailsMock.id,
  ctaLabel: COPY.screens.checklistDetails.cta,
  editLabel: COPY.screens.checklistDetails.editCta,
  isAuthor: true,
  itemsTitle: COPY.screens.checklistDetails.itemsTitle,
  linksTitle: COPY.screens.checklistDetails.linksTitle,
  commentsTitle: COPY.screens.checklistDetails.commentsTitle,
  emptyTitle: COPY.states.emptyTitle,
  emptyDescription: COPY.states.placeholderDescription,
  checklist: checklistDetailsMock,
  comments: checklistCommentsMock,
  isRateSheetVisible: false,
  handleBack: jest.fn(),
  handleStartExecution: jest.fn(),
  handleItemPress: jest.fn(),
  handleRatePress: jest.fn(),
  handleRateSheetClose: jest.fn(),
  handleEditPress: jest.fn(),
};

describe('Screen: DetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDetailsScreenMock.mockReturnValue(defaultMock);
  });

  it('should render checklist header, links, items and comments', () => {
    render(<DetailsScreen id={checklistDetailsMock.id} />);

    expect(screen.getByText(checklistDetailsMock.title)).toBeTruthy();
    expect(screen.getByText(checklistDetailsMock.links[0].label)).toBeTruthy();
    expect(screen.getByText(COPY.screens.checklistDetails.itemsTitle)).toBeTruthy();
    expect(screen.getByText(checklistItemsMock[0].title)).toBeTruthy();
    expect(screen.getByText(checklistItemsMock[1].title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.checklistDetails.cta)).toBeTruthy();
    expect(screen.getByText(checklistCommentsMock[0].content)).toBeTruthy();
    expect(useDetailsScreenMock).toHaveBeenCalledWith({ id: checklistDetailsMock.id });
  });

  it('should render empty state when checklist is missing', () => {
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      checklist: null,
    });

    render(<DetailsScreen id="missing" />);

    expect(screen.getByText(COPY.states.emptyTitle)).toBeTruthy();
    expect(screen.getByText(COPY.states.placeholderDescription)).toBeTruthy();
  });

  it('should call handleBack when back button is pressed', () => {
    const handleBack = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('should call handleEditPress when author presses edit', () => {
    const handleEditPress = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleEditPress,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);
    fireEvent.press(screen.getByLabelText(COPY.screens.checklistDetails.editCta));

    expect(handleEditPress).toHaveBeenCalledTimes(1);
  });

  it('should not render edit button when user is not author', () => {
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      isAuthor: false,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);

    expect(screen.queryByLabelText(COPY.screens.checklistDetails.editCta)).toBeNull();
  });

  it('should call handleItemPress when an item is pressed', () => {
    const handleItemPress = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleItemPress,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);
    fireEvent.press(screen.getByLabelText(checklistItemsMock[0].title));

    expect(handleItemPress).toHaveBeenCalledWith(checklistItemsMock[0]);
  });

  it('should call handleStartExecution when CTA is pressed', () => {
    const handleStartExecution = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleStartExecution,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);
    fireEvent.press(screen.getByText(COPY.screens.checklistDetails.cta));

    expect(handleStartExecution).toHaveBeenCalledTimes(1);
  });

  it('should call handleRatePress when rate action is pressed', () => {
    const handleRatePress = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleRatePress,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);
    fireEvent.press(screen.getByLabelText('rate-checklist'));

    expect(handleRatePress).toHaveBeenCalledTimes(1);
  });

  it('should render no-comments state when comments list is empty', () => {
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      comments: [],
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);

    expect(screen.getByText(COPY.screens.checklistDetails.noCommentsTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.checklistDetails.noCommentsDescription)).toBeTruthy();
  });

  it('should render rate sheet and call handleRateSheetClose', () => {
    const handleRateSheetClose = jest.fn();
    useDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      isRateSheetVisible: true,
      handleRateSheetClose,
    });

    render(<DetailsScreen id={checklistDetailsMock.id} />);

    expect(screen.getByText(`rate-sheet-${checklistDetailsMock.title}`)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('close-rate-sheet'));
    expect(handleRateSheetClose).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { itemCommentsMock } from '@mocks/data/comments';
import { checklistItemsMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { ItemDetailsScreen } from './item-details-screen';
import { useItemDetailsScreen } from './use-item-details-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-item-details-screen', () => ({
  useItemDetailsScreen: jest.fn(),
}));

jest.mock('@/modules/checklist/components', () => {
  const { Text, View } = require('react-native');
  return {
    ItemHeader: ({
      item,
      itemLabel,
    }: {
      item: { title: string };
      itemLabel: string;
    }) => (
      <View>
        <Text>{itemLabel}</Text>
        <Text>{item.title}</Text>
      </View>
    ),
    CommentComposer: () => <Text>comment-composer</Text>,
    CommentsList: ({ comments }: { comments: { content: string }[] }) => (
      <View>
        {comments.map((comment) => (
          <Text key={comment.content}>{comment.content}</Text>
        ))}
      </View>
    ),
  };
});

const useItemDetailsScreenMock = useItemDetailsScreen as jest.Mock;

const item = checklistItemsMock[0];
const checklistId = 'checklist-1';

const defaultMock = {
  styles: {
    topBar: {},
    scrollContent: {},
    section: {},
    emptyComments: {},
  },
  item,
  comments: itemCommentsMock,
  itemLabel: COPY.screens.itemDetails.itemLabel,
  commentsTitle: COPY.screens.itemDetails.commentsTitle,
  noCommentsTitle: COPY.screens.itemDetails.noCommentsTitle,
  noCommentsDescription: COPY.screens.itemDetails.noCommentsDescription,
  notFoundTitle: COPY.screens.itemDetails.notFoundTitle,
  notFoundDescription: COPY.screens.itemDetails.notFoundDescription,
  handleBack: jest.fn(),
};

describe('Screen: ItemDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useItemDetailsScreenMock.mockReturnValue(defaultMock);
  });

  it('should render item header, comments and composer', () => {
    render(<ItemDetailsScreen checklistId={checklistId} itemId={item.id} />);

    expect(screen.getByText(COPY.screens.itemDetails.itemLabel)).toBeTruthy();
    expect(screen.getByText(item.title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.itemDetails.commentsTitle)).toBeTruthy();
    expect(screen.getByText('comment-composer')).toBeTruthy();
    expect(screen.getByText(itemCommentsMock[0].content)).toBeTruthy();
    expect(useItemDetailsScreenMock).toHaveBeenCalledWith({
      checklistId,
      itemId: item.id,
    });
  });

  it('should render not found state when item is missing', () => {
    useItemDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      item: null,
    });

    render(<ItemDetailsScreen checklistId={checklistId} itemId="missing" />);

    expect(screen.getByText(COPY.screens.itemDetails.notFoundTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.itemDetails.notFoundDescription)).toBeTruthy();
  });

  it('should call handleBack when back button is pressed', () => {
    const handleBack = jest.fn();
    useItemDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      handleBack,
    });

    render(<ItemDetailsScreen checklistId={checklistId} itemId={item.id} />);
    fireEvent.press(screen.getByLabelText(COPY.actions.back));

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('should render empty comments state when there are no comments', () => {
    useItemDetailsScreenMock.mockReturnValue({
      ...defaultMock,
      comments: [],
    });

    render(<ItemDetailsScreen checklistId={checklistId} itemId={item.id} />);

    expect(screen.getByText(COPY.screens.itemDetails.noCommentsTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.itemDetails.noCommentsDescription)).toBeTruthy();
  });
});

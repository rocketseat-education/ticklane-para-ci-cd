import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { checklistSummariesMock } from '@mocks/data/checklists';
import { offlineExecutionsMock } from '@mocks/data/executions';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';

import { ProfileScreen } from './profile-screen';
import { useProfileScreen } from './use-profile-screen';

jest.mock('./use-profile-screen', () => ({
  useProfileScreen: jest.fn(),
}));

jest.mock('../../components/profile-header', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    ProfileHeader: ({
      connectLabel,
      logoutLabel,
      editLabel,
      onConnectPress,
      onEditPress,
      onLogoutPress,
    }: {
      connectLabel: string;
      logoutLabel: string;
      editLabel: string;
      onConnectPress: () => void;
      onEditPress: () => void;
      onLogoutPress: () => void;
    }) => (
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={connectLabel} onPress={onConnectPress}>
          <Text>{connectLabel}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={editLabel} onPress={onEditPress}>
          <Text>{editLabel}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={logoutLabel} onPress={onLogoutPress}>
          <Text>{logoutLabel}</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('../../components/profile-section', () => {
  const { Text, Pressable, View } = require('react-native');
  return {
    ProfileSection: ({
      title,
      isEmpty,
      emptyTitle,
      ctaLabel,
      onCtaPress,
      headerAction,
      children,
    }: {
      title: string;
      isEmpty: boolean;
      emptyTitle: string;
      ctaLabel: string;
      onCtaPress: () => void;
      headerAction?: React.ReactNode;
      children: React.ReactNode;
    }) => (
      <View>
        <Text>{title}</Text>
        {headerAction}
        {isEmpty ? (
          <>
            <Text>{emptyTitle}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={ctaLabel} onPress={onCtaPress}>
              <Text>{ctaLabel}</Text>
            </Pressable>
          </>
        ) : (
          children
        )}
      </View>
    ),
  };
});

jest.mock('../../components/delete-account-section', () => {
  const { Text } = require('react-native');
  return {
    DeleteAccountSection: () => <Text>Eliminar conta</Text>,
  };
});

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
        accessibilityLabel={checklist.title}
        onPress={() => onPress(checklist)}
      >
        <Text>{checklist.title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/modules/execution/components/offline-execution-card', () => {
  const { Text, Pressable } = require('react-native');
  return {
    OfflineExecutionCard: ({
      execution,
      onPress,
    }: {
      execution: { id: string; title: string };
      onPress: (execution: { id: string; title: string }) => void;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={execution.title}
        onPress={() => onPress(execution)}
      >
        <Text>{execution.title}</Text>
      </Pressable>
    ),
  };
});

const useProfileScreenMock = useProfileScreen as jest.Mock;
const sectionsCopy = COPY.screens.profile.sections;

const defaultMock = {
  styles: {
    scrollContent: {},
    list: {},
  },
  sectionsCopy,
  guestBadgeLabel: COPY.auth.guestBadge,
  connectLabel: COPY.screens.profile.connectCta,
  logoutLabel: COPY.screens.profile.logoutCta,
  editLabel: COPY.screens.profile.editCta,
  currentUser: authenticatedUserMock,
  isGuest: false,
  myChecklists: checklistSummariesMock,
  myFavorites: [checklistSummariesMock[0]],
  runningExecutions: offlineExecutionsMock,
  runningProgressOf: sectionsCopy.runningExecutions.progressOf,
  formatRunningExecutionDate: jest.fn(() => 'hoje'),
  guestEmptyDescriptions: {
    myChecklists: sectionsCopy.myChecklists.guestEmptyDescription,
    myFavorites: sectionsCopy.myFavorites.guestEmptyDescription,
    myComments: sectionsCopy.myComments.guestEmptyDescription,
    runningExecutions: sectionsCopy.runningExecutions.guestEmptyDescription,
  },
  handleConnectPress: jest.fn(),
  handleEditPress: jest.fn(),
  handleLogoutPress: jest.fn(),
  handleChecklistPress: jest.fn(),
  handleCreatePress: jest.fn(),
  handleExploreFavorites: jest.fn(),
  handleExploreHome: jest.fn(),
  handleRunningExecutionPress: jest.fn(),
  handleRunningSeeAllPress: jest.fn(),
  handleMyChecklistsSeeAllPress: jest.fn(),
  handleMyFavoritesSeeAllPress: jest.fn(),
};

describe('Screen: ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfileScreenMock.mockReturnValue(defaultMock);
  });

  it('should render sections and checklist cards for authenticated users', () => {
    render(<ProfileScreen />);

    expect(screen.getByText(sectionsCopy.runningExecutions.title)).toBeTruthy();
    expect(screen.getByText(sectionsCopy.myChecklists.title)).toBeTruthy();
    expect(screen.getByText(sectionsCopy.myFavorites.title)).toBeTruthy();
    expect(screen.getAllByText(checklistSummariesMock[0].title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(offlineExecutionsMock[0].title).length).toBeGreaterThan(0);
    expect(screen.getByText('Eliminar conta')).toBeTruthy();
  });

  it('should call handlers from profile header actions', () => {
    const handleConnectPress = jest.fn();
    const handleEditPress = jest.fn();
    const handleLogoutPress = jest.fn();
    useProfileScreenMock.mockReturnValue({
      ...defaultMock,
      handleConnectPress,
      handleEditPress,
      handleLogoutPress,
    });

    render(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText(COPY.screens.profile.connectCta));
    fireEvent.press(screen.getByLabelText(COPY.screens.profile.editCta));
    fireEvent.press(screen.getByLabelText(COPY.screens.profile.logoutCta));

    expect(handleConnectPress).toHaveBeenCalledTimes(1);
    expect(handleEditPress).toHaveBeenCalledTimes(1);
    expect(handleLogoutPress).toHaveBeenCalledTimes(1);
  });

  it('should hide delete account and show empty guest CTAs for guests', () => {
    const handleCreatePress = jest.fn();
    useProfileScreenMock.mockReturnValue({
      ...defaultMock,
      currentUser: guestUserMock,
      isGuest: true,
      myChecklists: [],
      myFavorites: [],
      runningExecutions: [],
      handleCreatePress,
    });

    render(<ProfileScreen />);

    expect(screen.queryByText('Eliminar conta')).toBeNull();
    expect(screen.getByText(sectionsCopy.myChecklists.emptyTitle)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(sectionsCopy.myChecklists.cta));
    expect(handleCreatePress).toHaveBeenCalledTimes(1);
  });

  it('should call handleChecklistPress when a checklist card is pressed', () => {
    const handleChecklistPress = jest.fn();
    useProfileScreenMock.mockReturnValue({
      ...defaultMock,
      myChecklists: [checklistSummariesMock[0]],
      myFavorites: [],
      runningExecutions: [],
      handleChecklistPress,
    });

    render(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText(checklistSummariesMock[0].title));

    expect(handleChecklistPress).toHaveBeenCalledWith(checklistSummariesMock[0]);
  });
});

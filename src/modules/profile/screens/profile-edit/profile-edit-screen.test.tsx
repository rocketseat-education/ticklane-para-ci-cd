import { fireEvent, render, screen } from '@tests/utils/test-utils';
import { authenticatedUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';

import { ProfileEditScreen } from './profile-edit-screen';
import { useProfileEditScreen } from './use-profile-edit-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-profile-edit-screen', () => ({
  useProfileEditScreen: jest.fn(),
}));

jest.mock('@/components/avatar', () => {
  const { Text } = require('react-native');
  return {
    Avatar: ({ name }: { name: string }) => <Text>{`avatar:${name}`}</Text>,
  };
});

const useProfileEditScreenMock = useProfileEditScreen as jest.Mock;
const copy = COPY.screens.profileEdit;

const userWithAvatar = {
  ...authenticatedUserMock,
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Bio actual',
};

const defaultMock = {
  styles: {
    kbAvoid: {},
    scroll: {},
    avatarBlock: {},
    avatarActions: {},
    formBlock: {},
    textarea: {},
    submitRow: {},
  },
  copy,
  authResolved: true,
  isAuthenticated: true,
  currentUser: userWithAvatar,
  displayName: userWithAvatar.displayName,
  bio: userWithAvatar.bio ?? '',
  feedback: null as { kind: 'success' | 'error' | 'info'; text: string } | null,
  saving: false,
  pendingAvatar: null as 'upload' | 'delete' | null,
  dirty: true,
  setDisplayName: jest.fn(),
  setBio: jest.fn(),
  handleSubmit: jest.fn(),
  handlePickAvatar: jest.fn(),
  handleRemoveAvatar: jest.fn(),
  handleClose: jest.fn(),
  MAX_BIO: 280,
  MAX_DISPLAY_NAME: 80,
};

describe('Screen: ProfileEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfileEditScreenMock.mockReturnValue(defaultMock);
  });

  it('should render loading state when auth is not resolved', () => {
    useProfileEditScreenMock.mockReturnValue({
      ...defaultMock,
      authResolved: false,
    });

    render(<ProfileEditScreen />);

    expect(screen.getByText('A carregar perfil…')).toBeTruthy();
  });

  it('should render nothing when not authenticated', () => {
    useProfileEditScreenMock.mockReturnValue({
      ...defaultMock,
      isAuthenticated: false,
    });

    const { toJSON } = render(<ProfileEditScreen />);

    expect(toJSON()).toBeNull();
  });

  it('should render title, form fields and avatar actions', () => {
    render(<ProfileEditScreen />);

    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.subtitle)).toBeTruthy();
    expect(screen.getByText(`avatar:${userWithAvatar.displayName}`)).toBeTruthy();
    expect(screen.getByText(copy.nameLabel)).toBeTruthy();
    expect(screen.getByText(copy.bioLabel)).toBeTruthy();
    expect(screen.getByText(copy.avatarChangeCta)).toBeTruthy();
    expect(screen.getByText(copy.avatarRemoveCta)).toBeTruthy();
    expect(screen.getByText(copy.saveCta)).toBeTruthy();
    expect(screen.getByText(copy.cancelCta)).toBeTruthy();
  });

  it('should call handlers from avatar and form actions', () => {
    const handlePickAvatar = jest.fn();
    const handleRemoveAvatar = jest.fn();
    const handleSubmit = jest.fn();
    const handleClose = jest.fn();
    useProfileEditScreenMock.mockReturnValue({
      ...defaultMock,
      handlePickAvatar,
      handleRemoveAvatar,
      handleSubmit,
      handleClose,
    });

    render(<ProfileEditScreen />);

    fireEvent.press(screen.getByText(copy.avatarChangeCta));
    fireEvent.press(screen.getByText(copy.avatarRemoveCta));
    fireEvent.press(screen.getByText(copy.saveCta));
    fireEvent.press(screen.getByText(copy.cancelCta));
    fireEvent.press(screen.getByLabelText(COPY.actions.cancel));

    expect(handlePickAvatar).toHaveBeenCalledTimes(1);
    expect(handleRemoveAvatar).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('should render feedback message when present', () => {
    useProfileEditScreenMock.mockReturnValue({
      ...defaultMock,
      feedback: { kind: 'success', text: copy.successMessage },
    });

    render(<ProfileEditScreen />);

    expect(screen.getByText(copy.successMessage)).toBeTruthy();
  });

  it('should show upload CTA when user has no avatar', () => {
    useProfileEditScreenMock.mockReturnValue({
      ...defaultMock,
      currentUser: authenticatedUserMock,
    });

    render(<ProfileEditScreen />);

    expect(screen.getByText(copy.avatarUploadCta)).toBeTruthy();
    expect(screen.queryByText(copy.avatarRemoveCta)).toBeNull();
  });
});

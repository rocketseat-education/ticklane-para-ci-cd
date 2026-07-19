import { fireEvent, render, screen } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { AuthScreen } from './auth-screen';
import { useAuthScreen } from './use-auth-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('./use-auth-screen', () => ({
  useAuthScreen: jest.fn(),
}));

jest.mock('../../components/email-otp-form', () => {
  const { Text } = require('react-native');
  return {
    EmailOtpForm: ({ flow }: { flow: { step: string } }) => (
      <Text>{`otp-form-${flow.step}`}</Text>
    ),
  };
});

jest.mock('@/components/icon-button', () => {
  const { Pressable, Text } = require('react-native');
  return {
    IconButton: ({
      accessibilityLabel,
      onPress,
    }: {
      accessibilityLabel: string;
      onPress: () => void;
    }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    ),
  };
});

const useAuthScreenMock = useAuthScreen as jest.Mock;

const defaultMock = {
  styles: {
    kbAvoid: {},
    content: {},
    footer: {},
  },
  title: COPY.screens.auth.title,
  subtitle: COPY.screens.auth.subtitle,
  keepBrowsingLabel: COPY.auth.keepBrowsing,
  flow: {
    step: 'email' as const,
  },
  handleClose: jest.fn(),
};

describe('Screen: AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthScreenMock.mockReturnValue(defaultMock);
  });

  it('should render email step title, subtitle, form and keep browsing label', () => {
    render(<AuthScreen />);

    expect(screen.getByText(COPY.screens.auth.title)).toBeTruthy();
    expect(screen.getByText(COPY.screens.auth.subtitle)).toBeTruthy();
    expect(screen.getByText('otp-form-email')).toBeTruthy();
    expect(screen.getByText(COPY.auth.keepBrowsing)).toBeTruthy();
  });

  it('should render code subtitle when flow is on code step', () => {
    useAuthScreenMock.mockReturnValue({
      ...defaultMock,
      title: COPY.screens.auth.codeTitle,
      flow: { step: 'code' },
    });

    render(<AuthScreen />);

    expect(screen.getByText(COPY.screens.auth.codeTitle)).toBeTruthy();
    expect(screen.getByText(COPY.screens.auth.codeSubtitle)).toBeTruthy();
    expect(screen.getByText('otp-form-code')).toBeTruthy();
  });

  it('should call handleClose when cancel button is pressed', () => {
    const handleClose = jest.fn();
    useAuthScreenMock.mockReturnValue({
      ...defaultMock,
      handleClose,
    });

    render(<AuthScreen />);
    fireEvent.press(screen.getByLabelText(COPY.actions.cancel));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

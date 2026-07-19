import { fireEvent, render, screen } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { DeleteAccountSection } from './delete-account-section';
import { useDeleteAccountSection } from './use-delete-account-section';

jest.mock('./use-delete-account-section', () => ({
  useDeleteAccountSection: jest.fn(),
}));

jest.mock('@/components/button', () => {
  const { Pressable, Text } = require('react-native');
  return {
    Button: ({
      label,
      onPress,
      isDisabled,
    }: {
      label: string;
      onPress?: () => void;
      isDisabled?: boolean;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={isDisabled}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

const useDeleteAccountSectionMock = useDeleteAccountSection as jest.Mock;
const copy = COPY.screens.profile.deleteAccount;

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render idle CTA and call handleStartPress', () => {
    const handleStartPress = jest.fn();
    useDeleteAccountSectionMock.mockReturnValue({
      styles: { root: {}, actions: {}, bulletList: {} },
      copy,
      step: 'idle',
      handleStartPress,
      handleCancelPress: jest.fn(),
      handleConfirmPress: jest.fn(),
    });

    render(<DeleteAccountSection />);

    expect(screen.getAllByText(copy.sectionTitle).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText(copy.cta));
    expect(handleStartPress).toHaveBeenCalledTimes(1);
  });

  it('should render confirm step actions', () => {
    const handleConfirmPress = jest.fn();
    const handleCancelPress = jest.fn();
    useDeleteAccountSectionMock.mockReturnValue({
      styles: { root: {}, actions: {}, bulletList: {} },
      copy,
      step: 'confirm',
      handleStartPress: jest.fn(),
      handleCancelPress,
      handleConfirmPress,
    });

    render(<DeleteAccountSection />);

    expect(screen.getByText(copy.confirmTitle)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(copy.confirmCta));
    fireEvent.press(screen.getByLabelText(copy.cancelCta));
    expect(handleConfirmPress).toHaveBeenCalledTimes(1);
    expect(handleCancelPress).toHaveBeenCalledTimes(1);
  });

  it('should show deleting label while deleting', () => {
    useDeleteAccountSectionMock.mockReturnValue({
      styles: { root: {}, actions: {}, bulletList: {} },
      copy,
      step: 'deleting',
      handleStartPress: jest.fn(),
      handleCancelPress: jest.fn(),
      handleConfirmPress: jest.fn(),
    });

    render(<DeleteAccountSection />);

    expect(screen.getByLabelText(copy.deletingLabel)).toBeTruthy();
  });
});

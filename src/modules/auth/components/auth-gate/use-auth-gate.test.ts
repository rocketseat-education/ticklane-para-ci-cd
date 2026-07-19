import { act, renderHook } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { useAuthGate } from './use-auth-gate';

const mockResolve = jest.fn();
const mockHide = jest.fn();
const mockReset = jest.fn();
const mockUseAuthGateState = jest.fn();
const mockUseEmailOtpFlow = jest.fn();

jest.mock('../../gate/use-auth-gate-state', () => ({
  useAuthGateState: () => mockUseAuthGateState(),
}));

jest.mock('../../hooks/use-email-otp-flow', () => ({
  useEmailOtpFlow: (options?: { onAuthenticated?: () => void }) =>
    mockUseEmailOtpFlow(options),
}));

describe('useAuthGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthGateState.mockReturnValue({
      isVisible: true,
      intent: 'favorite',
      resolve: mockResolve,
      hide: mockHide,
    });
    mockUseEmailOtpFlow.mockReturnValue({
      pendingSend: false,
      pendingVerify: false,
      reset: mockReset,
    });
  });

  it('should expose gate copy for the current intent', () => {
    const { result } = renderHook(() => useAuthGate());

    expect(result.current.isVisible).toBe(true);
    expect(result.current.title).toBe(COPY.auth.gate.title);
    expect(result.current.cancelLabel).toBe(COPY.auth.gate.cancel);
    expect(result.current.description).toBe(
      `${COPY.auth.gate.descriptionPrefix} ${COPY.auth.gate.intents.favorite}.`,
    );
    expect(result.current.isBusy).toBe(false);
    expect(result.current.styles).toBeDefined();
  });

  it('should use fallback intent copy when intent is null', () => {
    mockUseAuthGateState.mockReturnValue({
      isVisible: true,
      intent: null,
      resolve: mockResolve,
      hide: mockHide,
    });

    const { result } = renderHook(() => useAuthGate());

    expect(result.current.description).toBe(
      `${COPY.auth.gate.descriptionPrefix} ${COPY.auth.gate.intents.fallback}.`,
    );
  });

  it('should resolve true when OTP flow authenticates', () => {
    renderHook(() => useAuthGate());

    const options = mockUseEmailOtpFlow.mock.calls[0][0] as { onAuthenticated: () => void };
    options.onAuthenticated();

    expect(mockResolve).toHaveBeenCalledWith(true);
  });

  it('should reset the flow when the sheet becomes hidden', () => {
    mockUseAuthGateState.mockReturnValue({
      isVisible: false,
      intent: 'comment',
      resolve: mockResolve,
      hide: mockHide,
    });

    renderHook(() => useAuthGate());

    expect(mockReset).toHaveBeenCalled();
  });

  it('should hide on cancel when not busy', () => {
    const { result } = renderHook(() => useAuthGate());

    act(() => {
      result.current.handleCancel();
    });

    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('should not hide on cancel while send or verify is pending', () => {
    mockUseEmailOtpFlow.mockReturnValue({
      pendingSend: true,
      pendingVerify: false,
      reset: mockReset,
    });

    const { result } = renderHook(() => useAuthGate());

    expect(result.current.isBusy).toBe(true);

    act(() => {
      result.current.handleCancel();
    });

    expect(mockHide).not.toHaveBeenCalled();
  });
});

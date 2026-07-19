import { act, renderHook } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { useAuthScreen } from './use-auth-screen';

const mockBack = jest.fn();
const mockUseEmailOtpFlow = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('../../hooks/use-email-otp-flow', () => ({
  useEmailOtpFlow: (options: { onAuthenticated?: () => void }) => mockUseEmailOtpFlow(options),
}));

const defaultFlow = {
  step: 'email' as const,
  email: '',
  code: '',
  feedback: null,
  pendingSend: false,
  pendingVerify: false,
  canSubmitEmail: false,
  canSubmitCode: false,
  setEmail: jest.fn(),
  setCode: jest.fn(),
  submitEmail: jest.fn(),
  submitCode: jest.fn(),
  resend: jest.fn(),
  editEmail: jest.fn(),
  reset: jest.fn(),
};

describe('useAuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmailOtpFlow.mockImplementation(() => defaultFlow);
  });

  it('should return email-step copy and flow when on email step', () => {
    const { result } = renderHook(() => useAuthScreen());

    expect(result.current.title).toBe(COPY.screens.auth.title);
    expect(result.current.subtitle).toBe(COPY.screens.auth.subtitle);
    expect(result.current.keepBrowsingLabel).toBe(COPY.auth.keepBrowsing);
    expect(result.current.flow).toEqual(defaultFlow);
    expect(result.current.styles).toBeDefined();
  });

  it('should return code title when flow is on code step', () => {
    mockUseEmailOtpFlow.mockImplementation(() => ({
      ...defaultFlow,
      step: 'code',
    }));

    const { result } = renderHook(() => useAuthScreen());

    expect(result.current.title).toBe(COPY.screens.auth.codeTitle);
  });

  it('should go back when handleClose is called', () => {
    const { result } = renderHook(() => useAuthScreen());

    act(() => {
      result.current.handleClose();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should wire onAuthenticated to router.back', () => {
    let capturedOnAuthenticated: (() => void) | undefined;
    mockUseEmailOtpFlow.mockImplementation((options: { onAuthenticated?: () => void }) => {
      capturedOnAuthenticated = options.onAuthenticated;
      return defaultFlow;
    });

    renderHook(() => useAuthScreen());

    act(() => {
      capturedOnAuthenticated?.();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

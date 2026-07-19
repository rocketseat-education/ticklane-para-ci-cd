import { act, renderHook, waitFor } from '@tests/utils/test-utils';

import { useEmailOtpFlow } from './use-email-otp-flow';

const mockRequestEmailLoginCode = jest.fn();
const mockVerifyEmailLoginCode = jest.fn();

jest.mock('../context/use-auth', () => ({
  useAuth: () => ({
    requestEmailLoginCode: mockRequestEmailLoginCode,
    verifyEmailLoginCode: mockVerifyEmailLoginCode,
  }),
}));

describe('useEmailOtpFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose initial email-step state and gated canSubmit flags', () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    expect(result.current.step).toBe('email');
    expect(result.current.email).toBe('');
    expect(result.current.code).toBe('');
    expect(result.current.feedback).toBeNull();
    expect(result.current.pendingSend).toBe(false);
    expect(result.current.pendingVerify).toBe(false);
    expect(result.current.canSubmitEmail).toBe(false);
    expect(result.current.canSubmitCode).toBe(false);
  });

  it('should enable canSubmitEmail when email is non-empty', () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    expect(result.current.canSubmitEmail).toBe(true);
  });

  it('should reject invalid emails without calling the API', async () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('not-an-email');
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: 'Insere um e-mail válido.',
    });
    expect(mockRequestEmailLoginCode).not.toHaveBeenCalled();
    expect(result.current.step).toBe('email');
  });

  it('should reject empty and overly long emails', async () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(result.current.feedback?.kind).toBe('error');

    act(() => {
      result.current.setEmail(`${'a'.repeat(250)}@b.com`);
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(mockRequestEmailLoginCode).not.toHaveBeenCalled();
  });

  it('should move to code step on successful email submit', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('  Ana@Example.COM ');
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(mockRequestEmailLoginCode).toHaveBeenCalledWith('ana@example.com');
    expect(result.current.step).toBe('code');
    expect(result.current.email).toBe('ana@example.com');
    expect(result.current.code).toBe('');
    expect(result.current.feedback).toEqual({
      kind: 'info',
      text: 'Enviámos um código para ana@example.com. Verifica o e-mail.',
    });
    expect(result.current.pendingSend).toBe(false);
  });

  it('should surface API error on email submit failure', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: false, error: 'Rate limited' });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(result.current.step).toBe('email');
    expect(result.current.feedback).toEqual({ kind: 'error', text: 'Rate limited' });
  });

  it('should ignore submitEmail while a send is already pending', async () => {
    let resolveRequest!: (value: { ok: true }) => void;
    mockRequestEmailLoginCode.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    let firstSubmit!: Promise<void>;
    act(() => {
      firstSubmit = result.current.submitEmail();
    });

    await waitFor(() => {
      expect(result.current.pendingSend).toBe(true);
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    expect(mockRequestEmailLoginCode).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ ok: true });
      await firstSubmit;
    });
  });

  it('should reject codes that are not 6 digits', async () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
      result.current.setCode('123');
    });

    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: 'O código tem 6 dígitos.',
    });
    expect(mockVerifyEmailLoginCode).not.toHaveBeenCalled();
  });

  it('should strip non-digits and cap code length at 6', () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setCode('12a34b56789');
    });

    expect(result.current.code).toBe('123456');
    expect(result.current.canSubmitCode).toBe(true);
  });

  it('should call onAuthenticated on successful code verify', async () => {
    mockVerifyEmailLoginCode.mockResolvedValue({ ok: true });
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() => useEmailOtpFlow({ onAuthenticated }));

    act(() => {
      result.current.setEmail('ana@example.com');
      result.current.setCode('123456');
    });

    await act(async () => {
      await result.current.submitCode();
    });

    expect(mockVerifyEmailLoginCode).toHaveBeenCalledWith('ana@example.com', '123456');
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(result.current.feedback).toBeNull();
  });

  it('should surface API error on code verify failure', async () => {
    mockVerifyEmailLoginCode.mockResolvedValue({ ok: false, error: 'Código inválido' });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
      result.current.setCode('123456');
    });

    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.feedback).toEqual({ kind: 'error', text: 'Código inválido' });
  });

  it('should ignore submitCode while verify is pending', async () => {
    let resolveVerify!: (value: { ok: true }) => void;
    mockVerifyEmailLoginCode.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveVerify = resolve;
        }),
    );

    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
      result.current.setCode('123456');
    });

    let firstSubmit!: Promise<void>;
    act(() => {
      firstSubmit = result.current.submitCode();
    });

    await waitFor(() => {
      expect(result.current.pendingVerify).toBe(true);
    });

    await act(async () => {
      await result.current.submitCode();
    });

    expect(mockVerifyEmailLoginCode).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveVerify({ ok: true });
      await firstSubmit;
    });
  });

  it('should resend code and show info feedback on success', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    await act(async () => {
      await result.current.resend();
    });

    expect(mockRequestEmailLoginCode).toHaveBeenCalledWith('ana@example.com');
    expect(result.current.feedback).toEqual({
      kind: 'info',
      text: 'Reenviámos o código para ana@example.com.',
    });
  });

  it('should surface resend API errors', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: false, error: 'Falha no reenvio' });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    await act(async () => {
      await result.current.resend();
    });

    expect(result.current.feedback).toEqual({ kind: 'error', text: 'Falha no reenvio' });
  });

  it('should no-op resend when email is empty', async () => {
    const { result } = renderHook(() => useEmailOtpFlow());

    await act(async () => {
      await result.current.resend();
    });

    expect(mockRequestEmailLoginCode).not.toHaveBeenCalled();
  });

  it('should return to email step on editEmail and clear code/feedback', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    act(() => {
      result.current.setCode('123456');
      result.current.editEmail();
    });

    expect(result.current.step).toBe('email');
    expect(result.current.code).toBe('');
    expect(result.current.feedback).toBeNull();
    expect(result.current.email).toBe('ana@example.com');
  });

  it('should reset all flow state', async () => {
    mockRequestEmailLoginCode.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useEmailOtpFlow());

    act(() => {
      result.current.setEmail('ana@example.com');
    });

    await act(async () => {
      await result.current.submitEmail();
    });

    act(() => {
      result.current.setCode('123456');
      result.current.reset();
    });

    expect(result.current.step).toBe('email');
    expect(result.current.email).toBe('');
    expect(result.current.code).toBe('');
    expect(result.current.feedback).toBeNull();
    expect(result.current.pendingSend).toBe(false);
    expect(result.current.pendingVerify).toBe(false);
  });
});

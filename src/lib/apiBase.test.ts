const ENV_KEYS = [
  'EXPO_PUBLIC_SANDBOX_MODE',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_API_URL_SANDBOX',
  'EXPO_PUBLIC_API_ACCESS_KEY',
  'API_ACCESS_KEY',
] as const;

type ApiBaseModule = typeof import('./apiBase');

describe('apiBase', () => {
  const originalEnv: Record<(typeof ENV_KEYS)[number], string | undefined> = {
    EXPO_PUBLIC_SANDBOX_MODE: undefined,
    EXPO_PUBLIC_API_URL: undefined,
    EXPO_PUBLIC_API_URL_SANDBOX: undefined,
    EXPO_PUBLIC_API_ACCESS_KEY: undefined,
    API_ACCESS_KEY: undefined,
  };

  let fetchMock: jest.Mock;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }

    fetchMock = jest.fn().mockResolvedValue(new Response('ok'));
    global.fetch = fetchMock as unknown as typeof fetch;

    jest.resetModules();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  function loadApiBase(): ApiBaseModule {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./apiBase') as ApiBaseModule;
  }

  describe('isSandboxMode', () => {
    it('should return true when EXPO_PUBLIC_SANDBOX_MODE is "true"', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'true';
      const { isSandboxMode } = loadApiBase();

      expect(isSandboxMode()).toBe(true);
    });

    it('should return true when EXPO_PUBLIC_SANDBOX_MODE is "1"', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = '1';
      const { isSandboxMode } = loadApiBase();

      expect(isSandboxMode()).toBe(true);
    });

    it('should return false when flag is unset or other values', () => {
      expect(loadApiBase().isSandboxMode()).toBe(false);

      jest.resetModules();
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'false';
      expect(loadApiBase().isSandboxMode()).toBe(false);
    });

    it('should ignore whitespace-only values', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = '   ';
      expect(loadApiBase().isSandboxMode()).toBe(false);
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return trimmed sandbox url without trailing slash', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'true';
      process.env.EXPO_PUBLIC_API_URL_SANDBOX = ' https://sandbox.example.com/ ';
      const { getApiBaseUrl } = loadApiBase();

      expect(getApiBaseUrl()).toBe('https://sandbox.example.com');
    });

    it('should throw when sandbox mode is on but sandbox url is missing', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'true';
      const { getApiBaseUrl } = loadApiBase();

      expect(() => getApiBaseUrl()).toThrow(
        'EXPO_PUBLIC_API_URL_SANDBOX é obrigatório quando EXPO_PUBLIC_SANDBOX_MODE está ativo.',
      );
    });

    it('should return trimmed production api url', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
      const { getApiBaseUrl } = loadApiBase();

      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });

    it('should throw when production api url is missing', () => {
      const { getApiBaseUrl } = loadApiBase();

      expect(() => getApiBaseUrl()).toThrow('EXPO_PUBLIC_API_URL não está definido no ambiente.');
    });
  });

  describe('getApiAuthHeaders', () => {
    it('should return empty headers in sandbox mode', () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'true';
      process.env.EXPO_PUBLIC_API_URL_SANDBOX = 'https://sandbox.example.com';
      const { getApiAuthHeaders } = loadApiBase();

      expect(getApiAuthHeaders()).toEqual({});
    });

    it('should return x-api-key from EXPO_PUBLIC_API_ACCESS_KEY', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
      process.env.EXPO_PUBLIC_API_ACCESS_KEY = 'public-key';
      const { getApiAuthHeaders } = loadApiBase();

      expect(getApiAuthHeaders()).toEqual({ 'x-api-key': 'public-key' });
    });

    it('should fall back to API_ACCESS_KEY', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
      process.env.API_ACCESS_KEY = 'server-key';
      const { getApiAuthHeaders } = loadApiBase();

      expect(getApiAuthHeaders()).toEqual({ 'x-api-key': 'server-key' });
    });

    it('should throw when access key is missing outside sandbox', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
      const { getApiAuthHeaders } = loadApiBase();

      expect(() => getApiAuthHeaders()).toThrow(
        'EXPO_PUBLIC_API_ACCESS_KEY (ou API_ACCESS_KEY) é obrigatório fora do modo sandbox.',
      );
    });
  });

  describe('apiFetch', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
      process.env.EXPO_PUBLIC_API_ACCESS_KEY = 'test-key';
    });

    it('should call fetch with absolute path joined to base url and auth headers', async () => {
      const { apiFetch } = loadApiBase();

      await apiFetch('/api/library');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/library',
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );

      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('x-api-key')).toBe('test-key');
    });

    it('should prefix relative paths without a leading slash', async () => {
      const { apiFetch } = loadApiBase();

      await apiFetch('api/library');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/library',
        expect.any(Object),
      );
    });

    it('should use absolute urls as-is', async () => {
      const { apiFetch } = loadApiBase();

      await apiFetch('https://other.example.com/path');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://other.example.com/path',
        expect.any(Object),
      );
    });

    it('should merge extra headers into the request', async () => {
      const { apiFetch } = loadApiBase();

      await apiFetch('/api/users/me', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
      });

      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('x-api-key')).toBe('test-key');
      expect(headers.get('content-type')).toBe('application/json');
      expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    });

    it('should forward AbortSignal to fetch', async () => {
      const { apiFetch } = loadApiBase();
      const controller = new AbortController();

      await apiFetch('/api/auth/me', { signal: controller.signal });

      expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    });

    it('should omit api key headers in sandbox mode', async () => {
      process.env.EXPO_PUBLIC_SANDBOX_MODE = 'true';
      process.env.EXPO_PUBLIC_API_URL_SANDBOX = 'https://sandbox.example.com';
      jest.resetModules();
      const { apiFetch } = loadApiBase();

      await apiFetch('/api/library');

      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('x-api-key')).toBeNull();
      expect(fetchMock.mock.calls[0][0]).toBe('https://sandbox.example.com/api/library');
    });
  });
});

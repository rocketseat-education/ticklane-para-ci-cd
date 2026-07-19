import { Platform } from 'react-native';

const mockOpenDatabaseAsync = jest.fn();
const mockExecAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: unknown[]) => mockOpenDatabaseAsync(...args),
}));

describe('getOfflineExecutionsDb', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockOpenDatabaseAsync.mockResolvedValue({
      execAsync: mockExecAsync,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
  });

  it('should return null on web', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    const { getOfflineExecutionsDb } = require('./db');

    await expect(getOfflineExecutionsDb()).resolves.toBeNull();
    expect(mockOpenDatabaseAsync).not.toHaveBeenCalled();
  });

  it('should open database and create schema on native', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    const { getOfflineExecutionsDb } = require('./db');
    const db = await getOfflineExecutionsDb();

    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('ticklane-offline-executions.db');
    expect(mockExecAsync).toHaveBeenCalled();
    expect(db).toEqual({ execAsync: mockExecAsync });
  });
});

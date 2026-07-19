import { formatOfflineExecutionUpdatedAt } from './formatUpdatedAt';

describe('formatOfflineExecutionUpdatedAt', () => {
  it('should format a valid ISO date in pt-PT', () => {
    const result = formatOfflineExecutionUpdatedAt('2026-01-15T10:00:00.000Z');

    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return empty string for invalid ISO', () => {
    expect(formatOfflineExecutionUpdatedAt('not-a-date')).toBe('');
    expect(formatOfflineExecutionUpdatedAt('')).toBe('');
  });

  it('should return empty string for NaN date values', () => {
    expect(formatOfflineExecutionUpdatedAt('invalid')).toBe('');
  });
});

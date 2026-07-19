import { createExecutionId } from './uuid';

const UUID_V4_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createExecutionId', () => {
  it('should return a uuid v4-like string', () => {
    expect(createExecutionId()).toMatch(UUID_V4_LIKE);
  });

  it('should return unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createExecutionId()));

    expect(ids.size).toBe(20);
  });

  it('should use Math.random for hex digits', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const id = createExecutionId();

    expect(id).toMatch(UUID_V4_LIKE);
    expect(id.startsWith('00000000-0000-4000-8000-')).toBe(true);

    spy.mockRestore();
  });
});

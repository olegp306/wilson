import { describe, expect, it } from 'vitest';
import { employeeId, tenantId, userId } from './branded';

describe('branded ids', () => {
  it('creates typed ids', () => {
    expect(tenantId('t1')).toBe('t1');
    expect(userId('u1')).toBe('u1');
    expect(employeeId('e1')).toBe('e1');
  });
});

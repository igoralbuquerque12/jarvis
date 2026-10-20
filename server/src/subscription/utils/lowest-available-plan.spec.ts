import { lowestAvailablePlan } from './lowest-available-plan';

describe('lowestAvailablePlan', () => {
  it('starts at 1 when no plan exists', () => {
    expect(lowestAvailablePlan([])).toBe(1);
  });

  it('takes the next number after a contiguous run', () => {
    expect(lowestAvailablePlan([1, 2, 3])).toBe(4);
  });

  it('fills the first gap', () => {
    expect(lowestAvailablePlan([3, 1, 4])).toBe(2);
  });

  it('ignores non-positive numbers', () => {
    expect(lowestAvailablePlan([0, -1, 2])).toBe(1);
  });
});

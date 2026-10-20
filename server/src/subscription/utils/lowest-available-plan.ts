/** Smallest positive integer not present in `taken` (1, 2, 3, ...). */
export function lowestAvailablePlan(taken: Iterable<number>): number {
  const used = new Set(taken);
  let plan = 1;

  while (used.has(plan)) {
    plan += 1;
  }

  return plan;
}

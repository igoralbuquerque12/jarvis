import { FREE_TIER_PLAN } from '../../subscription/constants/subscription-plans.constant';
import type { AssistantTool } from '../tools/tool.types';

/**
 * Keeps only what `plan` unlocks. An operation needs both its own `minPlan`
 * and its tool's (free tier when unset); a tool left empty is dropped.
 */
export function filterToolsByPlan(
  tools: AssistantTool[],
  plan: number,
): AssistantTool[] {
  return tools.flatMap((tool) => {
    const toolMinPlan = tool.minPlan ?? FREE_TIER_PLAN;
    const operations = tool.operations.filter(
      (operation) =>
        plan >= Math.max(toolMinPlan, operation.minPlan ?? FREE_TIER_PLAN),
    );

    return operations.length > 0 ? [{ ...tool, operations }] : [];
  });
}

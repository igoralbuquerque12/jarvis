import type { AssistantTool, ToolOperation } from '../tools/tool.types';
import { filterToolsByPlan } from './filter-tools-by-plan';

const operation = (name: string, minPlan?: number): ToolOperation => ({
  name,
  whenToUse: name,
  fields: [],
  example: {},
  minPlan,
});

const tool = (
  name: string,
  operations: ToolOperation[],
  minPlan?: number,
): AssistantTool => ({
  name,
  description: name,
  whenToUse: name,
  path: `/${name}`,
  minPlan,
  operations,
});

const names = (tools: AssistantTool[]) =>
  tools.map((item) => ({
    name: item.name,
    operations: item.operations.map((op) => op.name),
  }));

describe('filterToolsByPlan', () => {
  it('keeps tools without minPlan on the free tier', () => {
    const tools = [tool('events', [operation('create_event')])];

    expect(names(filterToolsByPlan(tools, 1))).toEqual([
      { name: 'events', operations: ['create_event'] },
    ]);
  });

  it('drops a tool whose minPlan is above the plan', () => {
    const tools = [
      tool('events', [operation('create_event')]),
      tool('reports', [operation('build_report')], 2),
    ];

    expect(names(filterToolsByPlan(tools, 1))).toEqual([
      { name: 'events', operations: ['create_event'] },
    ]);
    expect(filterToolsByPlan(tools, 2)).toHaveLength(2);
  });

  it('filters operations by their own minPlan and keeps the rest', () => {
    const tools = [
      tool('finance', [
        operation('list_accounts'),
        operation('list_assets', 3),
      ]),
    ];

    expect(names(filterToolsByPlan(tools, 2))).toEqual([
      { name: 'finance', operations: ['list_accounts'] },
    ]);
    expect(names(filterToolsByPlan(tools, 3))).toEqual([
      { name: 'finance', operations: ['list_accounts', 'list_assets'] },
    ]);
  });

  it('never exposes an operation below its tool minPlan', () => {
    const tools = [tool('reports', [operation('build_report', 1)], 2)];

    expect(filterToolsByPlan(tools, 1)).toEqual([]);
  });
});

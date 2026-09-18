import type { AssistantTool, ToolField } from '../tools/tool.types';

export type ToolSchema = {
  name: string;
  description: string;
  path: string;
  /** JSON Schema of the tool input: { operation, data }. */
  schema: Record<string, unknown>;
};

/**
 * Builds one JSON schema per tool for n8n (Call n8n Workflow Tool with
 * "Define using JSON Schema", or MCP Server Trigger tools).
 *
 * `data` is the union of every operation's fields; which ones are required
 * for each operation is stated in the field description and enforced by the
 * backend DTOs. This keeps a single flat schema n8n can handle instead of
 * a oneOf per operation.
 */
export function buildToolSchemas(tools: AssistantTool[]): ToolSchema[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: `${tool.description} ${tool.whenToUse}`,
    path: tool.path,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['operation', 'data'],
      properties: {
        operation: {
          type: 'string',
          enum: tool.operations.map((operation) => operation.name),
          description: tool.operations
            .map((operation) => `${operation.name}: ${operation.whenToUse}`)
            .join(' | '),
        },
        data: {
          type: 'object',
          additionalProperties: false,
          properties: mergeFields(tool),
          description:
            'Campos da operação escolhida. Envie {} quando a operação não tiver campos.',
        },
      },
    },
  }));
}

function mergeFields(tool: AssistantTool): Record<string, unknown> {
  const merged = new Map<
    string,
    { field: ToolField; usage: string[] }
  >();

  for (const operation of tool.operations) {
    for (const field of operation.fields) {
      const usage = `${operation.name}: ${field.required ? 'obrigatório' : 'opcional'}`;
      const existing = merged.get(field.name);

      if (existing) {
        existing.usage.push(usage);
      } else {
        merged.set(field.name, { field, usage: [usage] });
      }
    }
  }

  return Object.fromEntries(
    [...merged.entries()].map(([name, { field, usage }]) => [
      name,
      fieldToSchema(field, usage),
    ]),
  );
}

function fieldToSchema(field: ToolField, usage: string[]): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    type: field.type,
    description: `[${usage.join('; ')}] ${field.description}`,
  };

  if (field.enum) {
    schema.enum = [...field.enum];
  }

  if (field.format === 'uuid' || field.format === 'date' || field.format === 'date-time') {
    schema.format = field.format;
  }

  if (field.format === 'color') {
    schema.pattern = '^#[0-9A-Fa-f]{6}$';
  }

  if (field.type === 'array') {
    schema.items = field.items ?? {};
  }

  return schema;
}

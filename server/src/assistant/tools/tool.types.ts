/**
 * Tool catalogue types. Each `AssistantTool` becomes one tool exposed to the
 * model (8 in total). The same structure renders the prompt reference
 * (build-system-prompt.ts) and the JSON schemas used to configure typed
 * tool nodes in n8n (build-tool-schemas.ts).
 */
export type ToolFieldType =
  'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export type ToolFieldFormat = 'uuid' | 'date' | 'date-time' | 'color';

export type ToolField = {
  name: string;
  type: ToolFieldType;
  description: string;
  required?: boolean;
  enum?: readonly string[];
  format?: ToolFieldFormat;
  /** JSON schema of the items when `type` is "array". */
  items?: Record<string, unknown>;
};

export type ToolOperation = {
  /** Exact operation name sent in `operation`. Unique across all tools. */
  name: string;
  whenToUse: string;
  fields: ToolField[];
  /** Example of the `data` object. */
  example: Record<string, unknown>;
  notes?: string;
};

export type AssistantTool = {
  /** Tool name as the model sees it, e.g. "transactions". */
  name: string;
  description: string;
  whenToUse: string;
  /** Backend endpoint the n8n tool node must call (profileId from context). */
  path: string;
  operations: ToolOperation[];
};

// --- field factories -------------------------------------------------------

export const stringField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({ name, type: 'string', description, required });

export const numberField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({ name, type: 'number', description, required });

export const integerField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({ name, type: 'integer', description, required });

export const booleanField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({ name, type: 'boolean', description, required });

export const enumField = (
  name: string,
  values: readonly string[],
  description: string,
  required = true,
): ToolField => ({ name, type: 'string', enum: values, description, required });

export const uuidField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({
  name,
  type: 'string',
  format: 'uuid',
  description,
  required,
});

export const dateField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({
  name,
  type: 'string',
  format: 'date',
  description,
  required,
});

export const moneyField = (
  name: string,
  description: string,
  required = true,
): ToolField => ({
  name,
  type: 'number',
  description: `${description} Número positivo com até 2 casas decimais.`,
  required,
});

export const currencyField = (): ToolField =>
  stringField('currency', 'Moeda em 3 letras. Padrão "BRL".', false);

export const colorField = (): ToolField => ({
  name: 'color',
  type: 'string',
  format: 'color',
  description: 'Cor hexadecimal "#RRGGBB".',
  required: false,
});

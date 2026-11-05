/**
 * Tool catalogue types. Each `AssistantTool` is one tool of the catalogue the
 * model reads in the prompt (build-system-prompt.ts). n8n exposes a single
 * generic tool (`executar_ferramenta`) that receives `tool` + `operation` +
 * `data`; the backend routes it to the handler registered under `name`
 * (see tool-handler.ts), so a new tool needs no change in n8n.
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
  /** Extra minimum plan for this operation, on top of the tool's `minPlan`. */
  minPlan?: number;
};

export type AssistantTool = {
  /**
   * Tool name as the model sees it, e.g. "events". Must match the name of
   * exactly one `@AssistantToolHandlerFor` provider (checked on boot).
   */
  name: string;
  description: string;
  whenToUse: string;
  /**
   * Minimum plan to expose the tool (defaults to the free tier). Profiles
   * below it never see the tool in the catalogue sent to n8n.
   */
  minPlan?: number;
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

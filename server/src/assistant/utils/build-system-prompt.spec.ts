import { ASSISTANT_TOOLS } from '../tools/main.tools';
import {
  buildDirective,
  buildTemporalContext,
  renderToolsReference,
} from './build-system-prompt';
import { buildToolSchemas } from './build-tool-schemas';

describe('buildTemporalContext', () => {
  const reference = new Date('2026-09-10T17:30:00.000Z');

  it('formats the instant in the profile timezone with offset', () => {
    const context = buildTemporalContext('America/Sao_Paulo', reference);

    expect(context.now).toBe('2026-09-10T14:30:00-03:00');
    expect(context.nowHuman).toBe(
      'quinta-feira, 10 de setembro de 2026 às 14:30',
    );
    expect(context.timezone).toBe('America/Sao_Paulo');
  });

  it('falls back to America/Sao_Paulo for an invalid timezone', () => {
    const context = buildTemporalContext('Not/AZone', reference);

    expect(context.timezone).toBe('America/Sao_Paulo');
    expect(context.now).toBe('2026-09-10T14:30:00-03:00');
  });
});

describe('renderToolsReference', () => {
  const reference = renderToolsReference(ASSISTANT_TOOLS);

  it('documents every tool and every operation', () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(reference).toContain(`## Ferramenta "${tool.name}"`);
      for (const operation of tool.operations) {
        expect(reference).toContain(`### ${operation.name}`);
        expect(reference).toContain(`operation="${operation.name}"`);
      }
    }
  });

  it('renders typed field lines', () => {
    expect(reference).toContain(
      '- type ("UNIQUE" | "RECURRENCE", obrigatório)',
    );
    expect(reference).toContain('- date (string "YYYY-MM-DD", obrigatório)');
    expect(reference).toContain('- eventSeriesId (uuid, obrigatório)');
    expect(reference).toContain('Campos: nenhum; envie data={}.');
  });
});

describe('buildDirective', () => {
  const directive = buildDirective(ASSISTANT_TOOLS);

  it('starts with the role and ends with the tools reference', () => {
    expect(directive.startsWith('# Papel e objetivo')).toBe(true);
    expect(directive.indexOf('# Exemplos')).toBeLessThan(
      directive.indexOf('# Ferramentas disponíveis'),
    );
  });

  it('contains the behaviour contract sections exactly once', () => {
    for (const section of [
      '# Fontes de verdade',
      '# Regras de operação',
      '# Ferramentas e erros',
      '# Autonomia e confirmação',
      '# Quando perguntar',
      '# Critérios de conclusão',
      '# Formato da resposta',
    ]) {
      expect(directive.split(section).length - 1).toBe(1);
    }
  });

  it('documents every error code the M2M filter can emit', () => {
    for (const code of [
      'validation_error',
      'not_found',
      'unsupported_operation',
      'conflict',
      'unavailable',
      'internal_error',
    ]) {
      expect(directive).toContain(code);
    }
  });
});

describe('buildToolSchemas', () => {
  const schemas = buildToolSchemas(ASSISTANT_TOOLS);

  it('produces one schema per tool with the operation enum', () => {
    expect(schemas.map((schema) => schema.name)).toEqual(
      ASSISTANT_TOOLS.map((tool) => tool.name),
    );

    const events = schemas.find((schema) => schema.name === 'events');
    const properties = events?.schema.properties as Record<string, unknown>;
    const operation = properties.operation as { enum: string[] };

    expect(operation.enum).toEqual([
      'create_event',
      'find_active_events',
      'delete_event',
    ]);
  });

  it('merges fields shared by several operations', () => {
    const transactions = schemas.find(
      (schema) => schema.name === 'transactions',
    );
    const properties = transactions?.schema.properties as Record<
      string,
      { properties: Record<string, { description: string }> }
    >;
    const amount = properties.data.properties.amount;

    expect(amount.description).toContain('create_transaction: obrigatório');
    expect(amount.description).toContain('update_transaction: opcional');
  });
});

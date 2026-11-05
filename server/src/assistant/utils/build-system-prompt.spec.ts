import { DEFAULT_DIRECTIVE } from '../config/guideline.config';
import { ASSISTANT_TOOLS } from '../tools/main.tools';
import {
  buildTemporalContext,
  GENERIC_TOOL_NAME,
  renderToolsReference,
} from './build-system-prompt';

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
    expect(reference).toContain('Campos: nenhum; envie data="{}".');
  });

  it('tells the model every tool goes through the generic n8n tool', () => {
    expect(reference.startsWith('# Ferramentas disponíveis')).toBe(true);
    expect(reference).toContain(
      `acionadas pela ferramenta ${GENERIC_TOOL_NAME}`,
    );
    expect(reference).toContain('"tool"');
    expect(reference).toContain('"operation"');
    expect(reference).toContain('"data"');
  });
});

describe('DEFAULT_DIRECTIVE', () => {
  const directive = DEFAULT_DIRECTIVE;

  it('starts with the role and leaves the tool reference to the tools endpoint', () => {
    expect(directive.startsWith('# Papel e objetivo')).toBe(true);
    expect(directive).not.toContain('# Ferramentas disponíveis');
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

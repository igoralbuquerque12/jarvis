import { ASSISTANT_TOOLS } from '../tools/main.tools';
import {
  buildDirective,
  buildTemporalContext,
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

  it('documents every operation of every module', () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(reference).toContain(`## Módulo ${tool.module}`);
      for (const endpoint of tool.endpoints) {
        for (const operation of endpoint.operations) {
          expect(reference).toContain(`### ${operation.name}`);
        }
      }
    }
  });

  it('explains the RPC exposure for finance and the per-operation tools for events', () => {
    expect(reference).toContain('Ferramenta única: "finance"');
    expect(reference).toContain('Uma ferramenta por operação');
    expect(reference).toContain('operation="create_transaction"');
  });
});

describe('buildDirective', () => {
  it('starts with the role section and ends with the tools reference', () => {
    const directive = buildDirective(ASSISTANT_TOOLS);

    expect(directive.startsWith('# Papel e objetivo')).toBe(true);
    expect(directive).toContain('# Ferramentas disponíveis');
    expect(directive.indexOf('# Exemplos')).toBeLessThan(
      directive.indexOf('# Ferramentas disponíveis'),
    );
  });
});

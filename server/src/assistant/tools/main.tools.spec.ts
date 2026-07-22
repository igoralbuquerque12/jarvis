import { ASSISTANT_TOOLS } from './main.tools';

describe('ASSISTANT_TOOLS', () => {
  it('publishes the events contracts without the guideline endpoint', () => {
    const eventsTool = ASSISTANT_TOOLS.find((tool) => tool.module === 'events');

    expect(eventsTool?.endpoints.map((endpoint) => endpoint.name)).toEqual([
      'create_event',
      'delete_event',
      'list_active_events',
    ]);
    expect(
      eventsTool?.endpoints.some((endpoint) =>
        endpoint.path.endsWith('guideline'),
      ),
    ).toBe(false);
  });
});

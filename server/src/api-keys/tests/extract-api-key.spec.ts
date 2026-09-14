import { extractApiKey } from '../utils/extract-api-key';

describe('extractApiKey', () => {
  it('reads a bearer token from the Authorization header', () => {
    expect(extractApiKey({ authorization: 'Bearer jrv_abc' })).toBe('jrv_abc');
    expect(extractApiKey({ authorization: 'bearer   jrv_abc ' })).toBe(
      'jrv_abc',
    );
  });

  it('reads the x-api-key header', () => {
    expect(extractApiKey({ 'x-api-key': ' jrv_abc ' })).toBe('jrv_abc');
  });

  it('prefers the bearer token when both are present', () => {
    expect(
      extractApiKey({
        authorization: 'Bearer jrv_one',
        'x-api-key': 'jrv_two',
      }),
    ).toBe('jrv_one');
  });

  it('ignores non-bearer Authorization values', () => {
    expect(extractApiKey({ authorization: 'Basic abc' })).toBeNull();
  });

  it('returns null when nothing usable is sent', () => {
    expect(extractApiKey({})).toBeNull();
    expect(extractApiKey({ authorization: 'Bearer ' })).toBeNull();
    expect(extractApiKey({ 'x-api-key': '   ' })).toBeNull();
  });
});

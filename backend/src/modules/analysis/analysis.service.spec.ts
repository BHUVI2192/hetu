import { normalizeEvent, redactMetadata } from './analysis.service';

describe('analysis normalization safety', () => {
  it('redacts secrets and private reasoning recursively', () => {
    expect(redactMetadata({ apiKey: 'secret', password: 'pw', reasoning: 'private thoughts', safe: { bearerToken: 'nope', value: 'kept' } })).toEqual({ safe: { value: 'kept' } });
  });

  it('maps framework-shaped span fields into the normalized event contract', () => {
    const event = normalizeEvent({ span_id: 'span-1', parent_span_id: 'root', operation: 'tool_call', status: 'failed', agent: 'Researcher', error: { code: 'BAD_ARGUMENT' }, input: { query: 'Q4' } }, 0);
    expect(event).toMatchObject({ spanId: 'span-1', parentSpanId: 'root', type: 'TOOL_CALL', status: 'error', agent: 'Researcher' });
    expect(event.errorMetadata).toEqual({ message: { code: 'BAD_ARGUMENT' } });
  });
});

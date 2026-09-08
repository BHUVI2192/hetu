import { isSafeReplayMode, validateForkModificationKeys } from './phase2.service';
import { redactMetadata } from '../analysis/analysis.service';

describe('Phase 2 safety policies', () => {
  it('allows only non-live replay modes by default', () => {
    expect(isSafeReplayMode('SANDBOX')).toBe(true);
    expect(isSafeReplayMode('MOCK_TOOLS')).toBe(true);
    expect(isSafeReplayMode('LIVE')).toBe(false);
    expect(isSafeReplayMode('unknown')).toBe(false);
  });

  it('rejects unsafe or arbitrary fork configuration keys', () => {
    expect(validateForkModificationKeys({ model: { name: 'safe-model' }, validation: { enabled: true } })).toBe(true);
    expect(validateForkModificationKeys({ command: 'rm -rf /' })).toBe(false);
  });

  it('redacts nested credentials before snapshot persistence', () => {
    const result = redactMetadata({ context: { tool: { credentials: { apiKey: 'SECRET', password: 'PW' }, query: 'kept' } }, reasoning: 'private' });
    expect(result).toEqual({ context: { tool: { query: 'kept' } } });
  });
});

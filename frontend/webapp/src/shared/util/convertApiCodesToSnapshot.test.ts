import { describe, expect, it } from 'vitest';
import { convertApiCodesToSnapshot } from './convertApiCodesToSnapshot';

describe('convertApiCodesToSnapshot', () => {
  it('maps inclusion criteria and per-trace justifications', () => {
    const snapshot = convertApiCodesToSnapshot(
      [
        {
          label: 'Usability',
          description: 'Users struggle with the interface',
          inclusionCriteria: 'A trace fits when the user cannot find a feature',
          traceIds: ['trace-1'],
          traceJustifications: [
            {
              traceId: 'trace-1',
              quote: 'could not find the button',
              justification: 'The user struggled to locate a feature',
            },
          ],
        },
      ],
      'A',
      'now',
      { 'trace-1': 'User could not find the button' }
    );

    const [code] = snapshot.codes;
    expect(code.inclusionCriteria).toBe('A trace fits when the user cannot find a feature');
    expect(code.justifications).toEqual([
      {
        traceId: 'trace-1',
        quote: 'could not find the button',
        justification: 'The user struggled to locate a feature',
      },
    ]);
  });

  it('defaults to no criteria and no justifications for codes generated before they existed', () => {
    const snapshot = convertApiCodesToSnapshot(
      [{ label: 'Usability', description: 'Users struggle', traceIds: ['trace-1'] }],
      'A',
      'now',
      {}
    );

    const [code] = snapshot.codes;
    expect(code.inclusionCriteria).toBeNull();
    expect(code.justifications).toEqual([]);
  });
});

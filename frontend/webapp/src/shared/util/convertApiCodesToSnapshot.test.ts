import { describe, expect, it } from 'vitest';
import { convertApiCodesToSnapshot } from './convertApiCodesToSnapshot';

describe('convertApiCodesToSnapshot', () => {
  it('maps the rationale and open code justifications', () => {
    const snapshot = convertApiCodesToSnapshot(
      [
        {
          label: 'Usability',
          description: 'Users struggle with the interface',
          rationale: 'Several open codes report users unable to find features',
          traceIds: ['trace-1'],
          openCodeJustifications: [
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
    expect(code.rationale).toBe('Several open codes report users unable to find features');
    expect(code.justifications).toEqual([
      {
        traceId: 'trace-1',
        quote: 'could not find the button',
        justification: 'The user struggled to locate a feature',
      },
    ]);
  });

  it('defaults to no rationale and no justifications for codes generated before they existed', () => {
    const snapshot = convertApiCodesToSnapshot(
      [{ label: 'Usability', description: 'Users struggle', traceIds: ['trace-1'] }],
      'A',
      'now',
      {}
    );

    const [code] = snapshot.codes;
    expect(code.rationale).toBeNull();
    expect(code.justifications).toEqual([]);
  });
});

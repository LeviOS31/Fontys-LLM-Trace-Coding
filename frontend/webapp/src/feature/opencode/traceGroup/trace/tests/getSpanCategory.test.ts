import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { createSpan, stringAttribute } from './traceFixtures';
import { getSpanCategory } from '../getSpanCategory';

describe('getSpanCategory', () => {
  it.each([
    ['GenAI span', 'Internal', [stringAttribute('gen_ai.system', 'openai')], 'GenAI', 'purple'],
    ['database span', 'Client', [stringAttribute('db.system', 'postgresql')], 'Database', 'blue'],
    ['HTTP span', 'Server', [stringAttribute('http.method', 'GET')], 'HTTP', 'orange'],
  ] as const)(
    'classifies a %s from its attributes',
    (_label, spanKind, attributes, label, color) => {
      expect(
        getSpanCategory(
          createSpan('span-1', 'operation', { spanKind, attributes: [...attributes] })
        )
      ).toMatchObject({
        label,
        color,
      });
    }
  );

  it.each([
    ['Unspecified', 'gray'],
    ['Internal', 'green'],
    ['Server', 'blue'],
    ['Client', 'crimson'],
    ['Producer', 'orange'],
    ['Consumer', 'purple'],
  ] as const)('uses span kind %s as the fallback category', (spanKind, color) => {
    expect(getSpanCategory(createSpan('span-1', 'operation', { spanKind }))).toMatchObject({
      label: spanKind,
      color,
    });
  });

  it('prioritizes GenAI attributes when a span has multiple known categories', () => {
    expect(
      getSpanCategory(
        createSpan('span-1', 'operation', {
          attributes: [
            stringAttribute('db.system', 'postgresql'),
            stringAttribute('gen_ai.system', 'openai'),
          ],
        })
      ).label
    ).toBe('GenAI');
  });
});

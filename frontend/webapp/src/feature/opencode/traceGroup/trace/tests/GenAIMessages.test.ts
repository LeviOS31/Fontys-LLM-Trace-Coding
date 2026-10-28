import { describe, expect, it } from 'vitest';
import {
  extractRawSpanIO,
  extractSpanMessages,
  parseGenAiMessages,
  parseSystemInstructions,
} from '../GenAIMessages';

describe('GenAI message parsing', () => {
  it('parses message content and joins text parts while ignoring non-text parts', () => {
    expect(
      parseGenAiMessages(
        JSON.stringify([
          {
            role: 'user',
            parts: [
              { type: 'text', content: 'First' },
              { type: 'image' },
              { type: 'text', content: 'second' },
            ],
          },
          { role: 'assistant', content: 'Answer' },
          { role: 'tool', content: 'Ignored role' },
        ])
      )
    ).toEqual([
      { role: 'user', content: 'First\nsecond' },
      { role: 'assistant', content: 'Answer' },
    ]);
  });

  it('returns no messages for missing, invalid, or non-array JSON', () => {
    expect(parseGenAiMessages(undefined)).toEqual([]);
    expect(parseGenAiMessages('{')).toEqual([]);
    expect(parseGenAiMessages('{"role":"user","content":"not an array"}')).toEqual([]);
  });

  it('parses system instruction text parts as one system message', () => {
    expect(
      parseSystemInstructions(
        JSON.stringify([
          { type: 'text', content: 'Be precise.' },
          { type: 'image', content: 'ignored' },
          { type: 'text', content: 'Cite sources.' },
        ])
      )
    ).toEqual([{ role: 'system', content: 'Be precise.\nCite sources.' }]);
  });

  it('prefers OpenTelemetry messages and identifies whether input was recorded', () => {
    expect(
      extractSpanMessages([
        {
          key: 'gen_ai.input.messages',
          value: JSON.stringify([{ role: 'user', content: 'Question' }]),
        },
        {
          key: 'gen_ai.output.messages',
          value: JSON.stringify([{ role: 'assistant', content: 'Answer' }]),
        },
        { key: 'gen_ai.prompt.0.role', value: 'user' },
        { key: 'gen_ai.prompt.0.content', value: 'Legacy question' },
      ])
    ).toEqual({
      source: 'otel-genai',
      hasInput: true,
      messages: [
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Answer' },
      ],
    });

    expect(
      extractSpanMessages([
        {
          key: 'gen_ai.output.messages',
          value: JSON.stringify([{ role: 'assistant', content: 'Answer' }]),
        },
      ])
    ).toEqual({
      source: 'otel-genai',
      hasInput: false,
      messages: [{ role: 'assistant', content: 'Answer' }],
    });
  });

  it('supports legacy indexed attributes and raw span input/output', () => {
    const attributes = [
      { key: 'gen_ai.prompt.0.role', value: 'user' },
      { key: 'gen_ai.prompt.0.content', value: 'Question' },
      { key: 'gen_ai.completion.0.role', value: 'assistant' },
      { key: 'gen_ai.completion.0.content', value: 'Answer' },
      { key: 'traceloop.entity.input', value: '{"prompt":"Question"}' },
    ];

    expect(extractSpanMessages(attributes)).toEqual({
      source: 'legacy-indexed',
      hasInput: true,
      messages: [
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Answer' },
      ],
    });
    expect(extractRawSpanIO(attributes)).toEqual({ input: '{"prompt":"Question"}' });
    expect(extractSpanMessages([])).toBeNull();
  });
});

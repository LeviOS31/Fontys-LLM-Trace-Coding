export type GenAiRole = 'user' | 'assistant' | 'system';

/** Shape of a span attribute as used by the frontend (value already flattened to a string). */
export type SpanAttribute = { key: string; value: string };

export type ParsedGenAiMessage = {
  role: GenAiRole;
  content: string;
};

export type MessageSource = 'otel-genai' | 'legacy-indexed';

export type ExtractedMessages = {
  source: MessageSource;
  messages: ParsedGenAiMessage[];
  /**
   * True when the span recorded its input messages. Without them (e.g. a nested LLM span
   * that only records its output) the position of a message in the conversation is unknown.
   */
  hasInput: boolean;
};

type RawPart = { type?: string; content?: unknown };
type RawMessage = { role?: string; parts?: RawPart[]; content?: unknown };

const ROLES = new Set<string>(['user', 'assistant', 'system']);

function isRole(role: unknown): role is GenAiRole {
  return typeof role === 'string' && ROLES.has(role);
}

function readAttribute(attributes: SpanAttribute[], key: string): string | undefined {
  return attributes.find((attribute) => attribute.key === key)?.value;
}

function parseJsonArray(raw: string | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function joinTextParts(parts: RawPart[] | undefined): string {
  return (parts ?? [])
    .filter((part) => part?.type === 'text' && typeof part.content === 'string')
    .map((part) => part.content as string)
    .join('\n');
}

/**
 * Parses `gen_ai.input.messages` / `gen_ai.output.messages` (OpenTelemetry GenAI
 * conventions): a JSON string containing [{ role, parts: [{ type: 'text', content }] }].
 * Non-text parts (tool calls etc.) are ignored. A plain string `content` is accepted too.
 */
export function parseGenAiMessages(raw: string | undefined): ParsedGenAiMessage[] {
  return (parseJsonArray(raw) as RawMessage[]).flatMap((message) => {
    const role = message?.role;
    if (!isRole(role)) return [];
    const text =
      typeof message.content === 'string' ? message.content : joinTextParts(message.parts);
    return text ? [{ role, content: text }] : [];
  });
}

/**
 * Parses `gen_ai.system_instructions`: a JSON array of { type: 'text', content } parts,
 * returned as a single system message.
 */
export function parseSystemInstructions(raw: string | undefined): ParsedGenAiMessage[] {
  const text = joinTextParts(parseJsonArray(raw) as RawPart[]);
  return text ? [{ role: 'system', content: text }] : [];
}

/**
 * Older OpenLLMetry (Traceloop) layout: gen_ai.prompt.N.role / .content and
 * gen_ai.completion.0.role / .content. Messages with an unknown role are skipped.
 */
function extractLegacyIndexed(attributes: SpanAttribute[]): ParsedGenAiMessage[] {
  const messages: ParsedGenAiMessage[] = [];

  for (let i = 0; ; i++) {
    const role = readAttribute(attributes, `gen_ai.prompt.${i}.role`);
    const content = readAttribute(attributes, `gen_ai.prompt.${i}.content`);
    if (role === undefined || content === undefined) break;
    if (isRole(role)) messages.push({ role, content });
  }

  const completionRole = readAttribute(attributes, 'gen_ai.completion.0.role');
  const completionContent = readAttribute(attributes, 'gen_ai.completion.0.content');
  if (isRole(completionRole) && completionContent !== undefined) {
    messages.push({ role: completionRole, content: completionContent });
  }

  return messages;
}

/**
 * Extracts the conversation of one span. The OpenTelemetry GenAI convention is tried
 * first (system instructions, input messages, output messages), then the legacy
 * indexed layout. Returns null when the span carries no recognisable messages.
 */
export function extractSpanMessages(attributes: SpanAttribute[]): ExtractedMessages | null {
  const input = parseGenAiMessages(readAttribute(attributes, 'gen_ai.input.messages'));
  const otel = [
    ...parseSystemInstructions(readAttribute(attributes, 'gen_ai.system_instructions')),
    ...input,
    ...parseGenAiMessages(readAttribute(attributes, 'gen_ai.output.messages')),
  ];
  if (otel.length > 0) return { source: 'otel-genai', messages: otel, hasInput: input.length > 0 };

  const legacy = extractLegacyIndexed(attributes);
  if (legacy.length > 0) {
    const hasPrompt = readAttribute(attributes, 'gen_ai.prompt.0.role') !== undefined;
    return { source: 'legacy-indexed', messages: legacy, hasInput: hasPrompt };
  }

  return null;
}

/**
 * Raw span input/output as recorded by Traceloop-style instrumentation. Meant for a span
 * detail view, not for the chat: spans such as embedding calls carry large payloads here.
 */
export function extractRawSpanIO(attributes: SpanAttribute[]): { input?: string; output?: string } {
  const input = readAttribute(attributes, 'traceloop.entity.input');
  const output = readAttribute(attributes, 'traceloop.entity.output');
  return {
    ...(input ? { input } : {}),
    ...(output ? { output } : {}),
  };
}

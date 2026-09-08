import { t } from "elysia";

export namespace TracesModel {
  export const TracesParams = t.Object({
    traceListId: t.String(),
  });

  export type TracesParams = typeof TracesParams.static;

  export const Feedback = t.Enum({
    positive: "positive",
    negative: "negative",
  });
  export type Feedback = typeof Feedback.static;

  export const Trace = t.Recursive((This) =>
    t.Object({
      id: t.String(),
      name: t.Nullable(t.String()),
      input: t.String(),
      output: t.String(),
      openCode: t.Nullable(t.String()),
      feedback: t.Nullable(Feedback),
      isFlagged: t.Boolean(),
      system: t.Nullable(t.String()),
      context: t.Nullable(t.String()),
      traces: t.Array(This),
    }),
  );
  export type Trace = typeof Trace.static;

  export const TraceResponse = Trace;
  export type TraceResponse = typeof TraceResponse.static;

  export const TracesResponse = t.Array(
    t.Object({
      id: t.String(),
      name: t.Nullable(t.String()),
      feedback: t.Nullable(Feedback),
      isFlagged: t.Boolean(),
      hasOpenCode: t.Boolean(),
      input_preview: t.String(),
    }),
  );
  export type TracesResponse = typeof TracesResponse.static;

  export const PostTraceBody = t.Object({
    feedback: t.Nullable(Feedback),
    openCode: t.Optional(t.String()),
    isFlagged: t.Boolean(),
  });
  export type PostTraceBody = typeof PostTraceBody.static;

  export const PostSuggestionBody = t.Object({
    currentTrace: t.String(),
    nextTrace: t.Optional(t.String()),
  });
  export type PostSuggestionbody = typeof PostSuggestionBody.static;

  export const PostSuggestionResponse = t.Object({
    feedback: t.Enum({
      positive: "positive",
      negateive: "negative",
    }),
    openCode: t.String(),
  });
  export type PostSuggestionResponse = typeof PostSuggestionResponse.static;
}

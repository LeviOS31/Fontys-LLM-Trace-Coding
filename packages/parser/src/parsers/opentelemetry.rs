use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use crate::{
    helpers::parse_json,
    parsers::base::{ParsedTrace, Parser},
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trace {
    resource_spans: Vec<ResourceSpan>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSpan {
    resource: Resource,
    scope_spans: Vec<ScopeSpan>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Resource {
    attributes: Vec<Attribute>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Attribute {
    key: String,
    value: AttributeValue,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AttributeValue {
    string_value: Option<String>,
    bool_value: Option<bool>,
    int_value: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScopeSpan {
    scope: Scope,
    spans: Vec<Span>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Scope {
    name: Option<String>,
    version: Option<String>,
    attributes: Option<Vec<Attribute>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    trace_id: String,
    span_id: String,
    parent_span_id: Option<String>,
    name: String,
    start_time_unix_nano: String,
    end_time_unix_nano: String,
    kind: u8,
    attributes: Vec<Attribute>,
}

#[derive(Default)]
struct PromptEntry {
    content: Option<String>,
    user: Option<String>,
    role: Option<String>,
}

pub struct OpenTelemetryParser;

impl Parser for OpenTelemetryParser {
    type ProbeResult = bool;

    fn parse(input: &str) -> Result<Vec<ParsedTrace>, String> {
        let traces: Vec<Trace> = parse_json::<Trace>(input)?;
        let mut records = OpenTelemetryParser::transform(traces);
        OpenTelemetryParser::post_process_traces(&mut records);

        Ok(records)
    }

    fn probe(text: &str) -> Option<Self::ProbeResult> {
        const REQUIRED_KEYS: &[&str] = &[
            "\"resourceSpans\"",
            "\"traceId\"",
            "\"spanId\"",
            "\"name\"",
            "\"startTimeUnixNano\"",
            "\"endTimeUnixNano\"",
        ];

        let found = REQUIRED_KEYS.iter().filter(|&&k| text.contains(k)).count();

        Some(found >= 3)
    }
}

impl OpenTelemetryParser {
    pub fn transform(traces: Vec<Trace>) -> Vec<ParsedTrace> {
        let mut span_map: HashMap<String, ParsedTrace> = HashMap::new();
        let mut adjacency_list: HashMap<String, Vec<String>> = HashMap::new();
        let mut root_ids: Vec<String> = Vec::new();
        let mut final_output = Vec::new();
        let key_re =
            Regex::new(r"^(gen_ai\.(prompt|completion))\.(\d+)\.(\w+)$").expect("Invalid regex");

        for trace in traces {
            for resource_span in trace.resource_spans {
                for scope_span in resource_span.scope_spans {
                    for span in scope_span.spans {
                        let span_id = span.span_id.clone();
                        let parent_id = span.parent_span_id.clone();

                        let mut prompt_entries: HashMap<usize, PromptEntry> = HashMap::new();
                        let mut completion_entries: HashMap<usize, String> = HashMap::new();
                        let mut context_lines: Vec<String> = Vec::new();

                        let mut input_val = String::new();
                        let mut output_val = String::new();
                        let mut system_val: Option<String> = None;

                        for attr in &span.attributes {
                            let key = attr.key.as_str();

                            if let Some(caps) = key_re.captures(key) {
                                let prefix = caps.get(1).unwrap().as_str();
                                let idx: usize = caps.get(3).unwrap().as_str().parse().unwrap();
                                let suffix = caps.get(4).unwrap().as_str();

                                if let Some(v) =
                                    OpenTelemetryParser::extract_string_from_attr(&attr.value)
                                {
                                    match prefix {
                                        "gen_ai.prompt" => {
                                            let entry = prompt_entries.entry(idx).or_default();
                                            match suffix {
                                                "content" => entry.content = Some(v),
                                                "user" => entry.user = Some(v),
                                                "role" => entry.role = Some(v),
                                                _ => context_lines.push(format!("{}: {}", key, v)),
                                            }
                                        }
                                        "gen_ai.completion" if suffix == "content" => {
                                            completion_entries.insert(idx, v);
                                        }
                                        _ => {}
                                    }
                                }
                            } else {
                                match key {
                                    "traceloop.entity.input" => {
                                        if let Some(v) =
                                            OpenTelemetryParser::extract_string_from_attr(
                                                &attr.value,
                                            )
                                        {
                                            input_val = v;
                                        }
                                    }
                                    "traceloop.entity.output" => {
                                        if let Some(v) =
                                            OpenTelemetryParser::extract_string_from_attr(
                                                &attr.value,
                                            )
                                        {
                                            output_val = v;
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }

                        let latest_prompt_idx = prompt_entries.keys().max().cloned().unwrap_or(0);
                        let latest_completion_idx =
                            completion_entries.keys().max().cloned().unwrap_or(0);

                        if let Some(entry) = prompt_entries.get(&latest_prompt_idx) {
                            if let Some(content) = &entry.content {
                                input_val = content.clone();
                            }
                            if let Some(user) = &entry.user {
                                context_lines.push(format!(
                                    "gen_ai.prompt.{}.user: {}",
                                    latest_prompt_idx, user
                                ));
                            }
                        }

                        if let Some(content) = completion_entries.get(&latest_completion_idx) {
                            output_val = content.clone();
                        }

                        let mut all_indices: Vec<usize> = prompt_entries.keys().cloned().collect();
                        for &idx in completion_entries.keys() {
                            if !all_indices.contains(&idx) {
                                all_indices.push(idx);
                            }
                        }
                        all_indices.sort_unstable();

                        let mut context_lines: Vec<String> = Vec::new();

                        for idx in all_indices {
                            if let Some(entry) = prompt_entries.get(&idx) {
                                if let Some(role) = &entry.role {
                                    if role == "system" {
                                        if let Some(content) = &entry.content {
                                            system_val = Some(content.clone());
                                        }
                                        continue;
                                    }
                                }
                                match &entry.content {
                                    Some(content) if idx != latest_prompt_idx => {
                                        context_lines.push(format!("User: {}", content));
                                    }
                                    _ => (),
                                }
                            }

                            match completion_entries.get(&idx) {
                                Some(content) if idx != latest_completion_idx => {
                                    context_lines.push(format!("Assistant: {}", content));
                                }
                                _ => (),
                            }
                        }

                        let context = match !context_lines.is_empty() {
                            true => Some(context_lines.join("\n\n")),
                            false => None,
                        };

                        let parsed_node = ParsedTrace {
                            name: Some(span.name.clone()),
                            system: system_val,
                            input: input_val,
                            output: output_val,
                            open_code: None,
                            context,
                            children: Vec::new(),
                        };

                        span_map.insert(span_id.clone(), parsed_node);

                        if let Some(ref p_id) = parent_id {
                            adjacency_list
                                .entry(p_id.clone())
                                .or_default()
                                .push(span_id.clone());
                        } else {
                            root_ids.push(span_id);
                        }
                    }
                }
            }
        }

        fn assemble(
            id: &String,
            nodes: &mut HashMap<String, ParsedTrace>,
            adj: &HashMap<String, Vec<String>>,
        ) -> ParsedTrace {
            let mut node = nodes.remove(id).expect("Node must exist");
            if let Some(children) = adj.get(id) {
                for child_id in children {
                    let child_node = assemble(child_id, nodes, adj);
                    node.children.push(child_node);
                }
            }
            node
        }

        let mut all_children_ids = std::collections::HashSet::new();
        for children in adjacency_list.values() {
            for child in children {
                all_children_ids.insert(child.clone());
            }
        }

        for root_id in OpenTelemetryParser::true_mask_roots(&span_map, &adjacency_list) {
            final_output.push(assemble(&root_id, &mut span_map, &adjacency_list));
        }

        final_output
    }

    fn true_mask_roots(
        nodes: &HashMap<String, ParsedTrace>,
        adj: &HashMap<String, Vec<String>>,
    ) -> Vec<String> {
        let mut children_set = std::collections::HashSet::new();
        for children in adj.values() {
            for c in children {
                children_set.insert(c.clone());
            }
        }
        nodes
            .keys()
            .filter(|id| !children_set.contains(*id))
            .cloned()
            .collect()
    }

    fn extract_string_from_attr(value: &AttributeValue) -> Option<String> {
        value
            .string_value
            .clone()
            .or_else(|| value.bool_value.map(|v| v.to_string()))
            .or_else(|| value.int_value.clone())
    }

    fn is_boilerplate(s: &str) -> bool {
        let trimmed = s.trim();

        if trimmed.is_empty() || trimmed == "null" {
            return true;
        }

        let normalized = trimmed.replace('\'', "\"");

        if let Ok(v) = serde_json::from_str::<Value>(&normalized) {
            match v {
                Value::Array(_) => return true,
                Value::Object(_) => return true,
                _ => {}
            }
        }

        false
    }

    fn find_meaningful_input(node: &ParsedTrace) -> Option<String> {
        if !OpenTelemetryParser::is_boilerplate(&node.input) {
            return Some(node.input.clone());
        }

        for child in &node.children {
            if let Some(found) = OpenTelemetryParser::find_meaningful_input(child) {
                return Some(found);
            }
        }

        None
    }

    fn find_deepest_leaf(node: &mut ParsedTrace) -> &mut ParsedTrace {
        if node.children.is_empty() {
            node
        } else {
            let last_idx = node.children.len() - 1;
            OpenTelemetryParser::find_deepest_leaf(&mut node.children[last_idx])
        }
    }

    pub fn post_process_traces(traces: &mut [ParsedTrace]) {
        for root in traces.iter_mut() {
            let meaningful_text = OpenTelemetryParser::find_meaningful_input(root);
            if let Some(text) = meaningful_text {
                root.input = text;
            }

            let deepest_leaf = OpenTelemetryParser::find_deepest_leaf(root);
            root.output = deepest_leaf.output.clone();
        }
    }
}

#[cfg(test)]
mod tests {

    mod parse {
        use crate::parsers::base::Parser;

        use super::super::OpenTelemetryParser;

        fn simple_trace_json() -> &'static str {
            r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span1",
                                        "parentSpanId": null,
                                        "name": "test_span",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "traceloop.entity.input",  "value": { "stringValue": "Hello world" } },
                                            { "key": "traceloop.entity.output", "value": { "stringValue": "Bye world" } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#
        }

        fn nested_trace_json() -> &'static str {
            r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span1",
                                        "parentSpanId": null,
                                        "name": "root",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "gen_ai.prompt.0.role",      "value": { "stringValue": "system" } },
                                            { "key": "gen_ai.prompt.0.content",  "value": { "stringValue": "You are a helpful assistant." } },

                                            { "key": "gen_ai.prompt.1.content",   "value": { "stringValue": "Hello" } },
                                            { "key": "gen_ai.prompt.1.user",      "value": { "stringValue": "user1" } },
                                            { "key": "gen_ai.prompt.1.role",      "value": { "stringValue": "user" } },

                                            { "key": "gen_ai.completion.1.content", "value": { "stringValue": "Hi" } },

                                            { "key": "gen_ai.prompt.2.content",   "value": { "stringValue": "How are you?" } },
                                            { "key": "gen_ai.completion.2.content","value": { "stringValue": "I am fine." } },

                                            { "key": "traceloop.entity.input",    "value": { "stringValue": "Hello world" } },
                                            { "key": "traceloop.entity.output",  "value": { "stringValue": "Bye world" } }
                                        ]
                                    },
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span2",
                                        "parentSpanId": "span1",
                                        "name": "child",
                                        "startTimeUnixNano": "3",
                                        "endTimeUnixNano": "4",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "gen_ai.prompt.3.content",   "value": { "stringValue": "How are you?" } },
                                            { "key": "gen_ai.completion.3.content","value": { "stringValue": "I am fine." } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#
        }

        fn boilerplate_root_json() -> &'static str {
            r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span1",
                                        "parentSpanId": null,
                                        "name": "root",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "gen_ai.prompt.0.content",   "value": { "stringValue": "Hello" } },
                                            { "key": "gen_ai.completion.0.content", "value": { "stringValue": "Hi" } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span2",
                                        "parentSpanId": "span1",
                                        "name": "child",
                                        "startTimeUnixNano": "3",
                                        "endTimeUnixNano": "4",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "gen_ai.prompt.1.content",   "value": { "stringValue": "How are you?" } },
                                            { "key": "gen_ai.completion.1.content","value": { "stringValue": "I am fine." } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#
        }

        fn no_span_json() -> &'static str {
            r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": []
                    }
                ]
            }]"#
        }

        #[test]
        fn parse_simple_trace() {
            let json = simple_trace_json();
            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok(), "parse() returned an error: {:?}", result);
            let traces = result.unwrap();

            assert_eq!(traces.len(), 1, "expected one root trace");
            let root = &traces[0];
            assert_eq!(root.name.as_deref(), Some("test_span"));
            assert_eq!(root.input, "Hello world");
            assert_eq!(root.output, "Bye world");
            assert_eq!(root.system, None);
            assert_eq!(root.context, None);
            assert!(root.children.is_empty(), "root should have no children");
        }

        #[test]
        fn parse_nested_trace() {
            let json = nested_trace_json();
            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok(), "parse() returned an error: {:?}", result);
            let traces = result.unwrap();

            assert_eq!(traces.len(), 1, "expected one root trace");
            let root = &traces[0];

            assert_eq!(root.name.as_deref(), Some("root"));
            assert_eq!(root.input, "How are you?");
            assert_eq!(root.output, "I am fine.");
            assert_eq!(root.system.as_deref(), Some("You are a helpful assistant."));
            let expected_context = "User: Hello\n\nAssistant: Hi";
            assert_eq!(root.context.as_deref().unwrap(), expected_context);

            assert_eq!(root.children.len(), 1, "root should have one child");
            let child = &root.children[0];
            assert_eq!(child.name.as_deref(), Some("child"));
            assert_eq!(child.input, "How are you?");
            assert_eq!(child.output, "I am fine.");
            assert_eq!(child.system, None);
            assert_eq!(child.context, None);
            assert!(child.children.is_empty(), "child should have no children");
        }

        #[test]
        fn parse_boilerplate_root_replaced() {
            let json = boilerplate_root_json();
            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok(), "parse() returned an error: {:?}", result);

            let traces = result.unwrap();
            let root = &traces[0];

            assert_eq!(root.input, "Hello");
            assert_eq!(root.output, "I am fine.");
        }

        #[test]
        fn parse_no_spans() {
            let json = no_span_json();
            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok(), "parse() returned an error: {:?}", result);
            let traces = result.unwrap();
            assert!(
                traces.is_empty(),
                "expected no traces when there are no spans"
            );
        }

        #[test]
        fn parse_missing_traceid_or_spanid() {
            let json = r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "parentSpanId": null,
                                        "name": "bad_span",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#;
            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_err(), "expected error due to missing spanId");
        }

        #[test]
        fn parse_empty_input() {
            let result = OpenTelemetryParser::parse("");
            assert!(result.is_ok(), "empty string should produce an empty array");
        }

        #[test]
        fn parse_malformed_json() {
            let result = OpenTelemetryParser::parse("{");
            assert!(
                result.is_ok(),
                "malformed JSON should produce an empty array"
            );
            assert_eq!(result.unwrap().len(), 0);
        }

        #[test]
        fn parse_missing_resource_spans() {
            let json = r#"[{"foo": 123}]"#;
            let result = OpenTelemetryParser::parse(json);
            assert!(
                result.is_err(),
                "JSON without resourceSpans should return an error"
            );
        }

        #[test]
        fn parse_without_gen_ai_attributes() {
            let json = r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span1",
                                        "parentSpanId": null,
                                        "name": "root",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": [
                                            { "key": "traceloop.entity.input",  "value": { "stringValue": "Input only" } },
                                            { "key": "traceloop.entity.output", "value": { "stringValue": "Output only" } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#;

            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok());
            let trace = &result.unwrap()[0];
            assert_eq!(trace.input, "Input only");
            assert_eq!(trace.output, "Output only");
            assert_eq!(trace.context, None);
            assert_eq!(trace.system, None);
        }

        #[test]
        fn parse_child_without_attributes() {
            let json = r#"[{
                "resourceSpans": [
                    {
                        "resource": { "attributes": [] },
                        "scopeSpans": [
                            {
                                "scope": { "name": null },
                                "spans": [
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span1",
                                        "name": "root",
                                        "startTimeUnixNano": "1",
                                        "endTimeUnixNano": "2",
                                        "kind": 0,
                                        "attributes": []
                                    },
                                    {
                                        "traceId": "trace1",
                                        "spanId": "span2",
                                        "parentSpanId": "span1",
                                        "name": "child",
                                        "startTimeUnixNano": "3",
                                        "endTimeUnixNano": "4",
                                        "kind": 0,
                                        "attributes": []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]"#;

            let result = OpenTelemetryParser::parse(json);
            assert!(result.is_ok());
            let root = &result.unwrap()[0];
            assert_eq!(root.children.len(), 1);
            let child = &root.children[0];
            assert_eq!(child.name.as_deref(), Some("child"));
            assert_eq!(child.context, None);
        }
    }

    mod probe {
        use crate::parsers::base::Parser;

        use super::super::OpenTelemetryParser;

        #[test]
        fn probe_true_exactly_three() {
            let json = r#"{"resourceSpans":[],"traceId":"a","spanId":"b"}"#;
            assert_eq!(OpenTelemetryParser::probe(json), Some(true));
        }

        #[test]
        fn probe_true_more_than_three() {
            let json = r#"{"resourceSpans":[],"traceId":"a","spanId":"b","name":"root","startTimeUnixNano":"1","endTimeUnixNano":"2"}"#;
            assert_eq!(OpenTelemetryParser::probe(json), Some(true));
        }

        #[test]
        fn probe_false_two_keys() {
            let json = r#"{"traceId":"a","spanId":"b"}"#;
            assert_eq!(OpenTelemetryParser::probe(json), Some(false));
        }

        #[test]
        fn probe_false_zero_keys() {
            let json = r#"{}"#;
            assert_eq!(OpenTelemetryParser::probe(json), Some(false));
        }

        #[test]
        fn probe_does_not_match_partial_key() {
            let json = r#"{"traceId": "a"}"#;
            assert_eq!(OpenTelemetryParser::probe(json), Some(false));
        }
    }
}

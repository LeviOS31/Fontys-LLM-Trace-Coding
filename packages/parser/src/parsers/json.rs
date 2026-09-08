use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    helpers::parse_json,
    parsers::base::{JsonStructure, ParsedTrace, Parser},
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Record {
    name: Option<String>,
    system: Option<String>,
    context: Option<String>,
    input: String,
    output: String,
    open_code: Option<String>,
}

pub struct JsonParser;

impl Parser for JsonParser {
    type ProbeResult = (JsonStructure, Value, bool);

    fn parse(input: &str) -> Result<Vec<ParsedTrace>, String> {
        let records: Vec<Record> = parse_json::<Record>(input)?;
        let mut traces: Vec<ParsedTrace> = Vec::new();

        for record in records {
            traces.push(ParsedTrace {
                name: record.name,
                system: record.system,
                input: record.input,
                output: record.output,
                context: record.context,
                open_code: record.open_code,
                children: Vec::new(),
            });
        }

        Ok(traces)
    }

    fn probe(text: &str) -> Option<Self::ProbeResult> {
        let i = text.find(|c: char| !c.is_whitespace())?;
        let bytes = text.as_bytes();

        match bytes.get(i)? {
            b'{' => Self::parse_delimited(text, i, '{', '}'),
            b'[' => Self::parse_delimited(text, i, '[', ']'),
            b'"' => Self::parse_string(text, i),
            _ => Self::parse_primitive(text, i),
        }
    }
}

impl JsonParser {
    fn scan_string(bytes: &[u8], start: usize) -> Option<usize> {
        let mut j = start + 1;
        while j < bytes.len() {
            match bytes[j] {
                b'\\' => {
                    j += 2;
                }
                b'"' => return Some(j),
                _ => j += 1,
            }
        }
        None
    }

    fn scan_balanced(bytes: &[u8], start: usize, open: u8, close: u8) -> Option<usize> {
        let mut depth: i32 = 0;
        let mut in_string = false;
        let mut escape = false;
        let mut j = start;

        while j < bytes.len() {
            let b = bytes[j];
            if in_string {
                if escape {
                    escape = false;
                    j += 1;
                    continue;
                }
                if b == b'\\' {
                    if j + 1 < bytes.len() && bytes[j + 1] == b'u' {
                        j += 6;
                        continue;
                    }
                    escape = true;
                    j += 1;
                    continue;
                }
                if b == b'"' {
                    in_string = false;
                    j += 1;
                    continue;
                }
                j += 1;
                continue;
            } else {
                if b == b'"' {
                    in_string = true;
                    j += 1;
                    continue;
                }
                if b == open {
                    depth += 1;
                    j += 1;
                    continue;
                }
                if b == close {
                    depth -= 1;
                    j += 1;
                    if depth == 0 {
                        return Some(j - 1);
                    }
                    continue;
                }
                j += 1;
            }
        }
        None
    }

    fn scan_primitive(text: &str, start: usize) -> Option<usize> {
        let slice = &text[start..];
        if slice.starts_with("true") {
            return Some(start + 4 - 1);
        }
        if slice.starts_with("false") {
            return Some(start + 5 - 1);
        }
        if slice.starts_with("null") {
            return Some(start + 4 - 1);
        }

        let mut j = start;
        let bytes = text.as_bytes();
        if j < bytes.len() && (bytes[j] == b'-' || (bytes[j] >= b'0' && bytes[j] <= b'9')) {
            if bytes[j] == b'-' {
                j += 1;
            }

            while j < bytes.len() && (bytes[j] >= b'0' && bytes[j] <= b'9') {
                j += 1;
            }

            if j < bytes.len() && bytes[j] == b'.' {
                j += 1;
                while j < bytes.len() && (bytes[j] >= b'0' && bytes[j] <= b'9') {
                    j += 1;
                }
            }

            if j < bytes.len() && (bytes[j] == b'e' || bytes[j] == b'E') {
                j += 1;
                if j < bytes.len() && (bytes[j] == b'+' || bytes[j] == b'-') {
                    j += 1;
                }
                while j < bytes.len() && (bytes[j] >= b'0' && bytes[j] <= b'9') {
                    j += 1;
                }
            }
            return Some(j - 1);
        }
        None
    }

    fn kind(v: &Value) -> JsonStructure {
        if v.is_array() {
            JsonStructure::Array
        } else if v.is_object() {
            JsonStructure::Object
        } else {
            JsonStructure::Primitive
        }
    }

    fn parse_delimited(
        text: &str,
        i: usize,
        open: char,
        close: char,
    ) -> Option<(JsonStructure, Value, bool)> {
        let bytes = text.as_bytes();
        let open_byte = match open {
            '{' => b'{',
            '[' => b'[',
            _ => unreachable!(),
        };
        let close_byte = match close {
            '}' => b'}',
            ']' => b']',
            _ => unreachable!(),
        };

        let end = Self::scan_balanced(bytes, i, open_byte, close_byte);

        let (raw, incomplete) = if let Some(end_idx) = end {
            let end_idx = end_idx.min(text.len().saturating_sub(1));
            (text[i..=end_idx].to_string(), false)
        } else {
            (Self::repair_json(&text[i..]), true)
        };

        let v = serde_json::from_str(&raw).ok()?;
        Some((Self::kind(&v), Self::truncate_arrays(v), incomplete))
    }

    fn parse_string(text: &str, i: usize) -> Option<(JsonStructure, Value, bool)> {
        let end = Self::scan_string(text.as_bytes(), i)?;
        let v = serde_json::from_str(&text[i..=end]).ok()?;
        Some((Self::kind(&v), v, false))
    }

    fn parse_primitive(text: &str, i: usize) -> Option<(JsonStructure, Value, bool)> {
        let end = Self::scan_primitive(text, i)?;
        let v = serde_json::from_str(&text[i..=end]).ok()?;
        Some((Self::kind(&v), v, false))
    }

    fn truncate_arrays(v: Value) -> Value {
        match v {
            Value::Array(arr) if arr.len() > 1 => {
                Value::Array(vec![arr.into_iter().next().unwrap_or(Value::Null)])
            }
            other => other,
        }
    }

    fn repair_json(text: &str) -> String {
        let mut s = text.trim_end().to_string();

        while s.ends_with(',') || s.ends_with('"') {
            s.pop();
        }

        let mut stack = Vec::new();
        let mut in_str = false;
        let mut esc = false;

        for b in s.as_bytes() {
            if in_str {
                if esc {
                    esc = false;
                    continue;
                }
                if *b == b'\\' {
                    esc = true;
                    continue;
                }
                if *b == b'"' {
                    in_str = false;
                    continue;
                }
            } else {
                if *b == b'"' {
                    in_str = true;
                    continue;
                }
                if *b == b'{' {
                    stack.push('{');
                }
                if *b == b'[' {
                    stack.push('[');
                }
                if *b == b'}' || *b == b']' {
                    stack.pop();
                }
            }
        }

        let mut closers = String::new();
        if !s.matches('"').count().is_multiple_of(2) {
            closers.push('"');
        }
        while let Some(c) = stack.pop() {
            closers.push(if c == '{' { '}' } else { ']' });
        }

        s.push_str(&closers);
        s
    }
}

#[cfg(test)]
mod tests {
    mod parse {
        use crate::parsers::base::Parser;

        use super::super::JsonParser;

        #[test]
        fn parse_valid_json() {
            let json_data = r#"
            [
                {
                    "context": "Test1",
                    "input": "input1",
                    "output": "output1",
                    "openCode": "code1"
                },
                {
                    "context": "Test2",
                    "input": "input2",
                    "output": "output2",
                    "openCode": "code2"
                }
            ]"#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 2);

            assert_eq!(result[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(result[0].input, "input1");
            assert_eq!(result[0].output, "output1");
            assert_eq!(result[0].open_code.as_deref().unwrap(), "code1");
            assert!(result[0].children.is_empty());

            assert_eq!(result[1].context.as_deref().unwrap(), "Test2");
            assert_eq!(result[1].input, "input2");
            assert_eq!(result[1].output, "output2");
            assert_eq!(result[1].open_code.as_deref().unwrap(), "code2");
            assert!(result[1].children.is_empty());
        }

        #[test]
        fn parse_valid_jsonl() {
            let json_data = r#"
                {"context": "Test1","input": "input1","output": "output1","openCode": "code1"}
                {"context": "Test2","input": "input2","output": "output2","openCode": "code2"}
            "#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 2);

            assert_eq!(result[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(result[0].input, "input1");
            assert_eq!(result[0].output, "output1");
            assert_eq!(result[0].open_code.as_deref().unwrap(), "code1");
            assert!(result[0].children.is_empty());

            assert_eq!(result[1].context.as_deref().unwrap(), "Test2");
            assert_eq!(result[1].input, "input2");
            assert_eq!(result[1].output, "output2");
            assert_eq!(result[1].open_code.as_deref().unwrap(), "code2");
            assert!(result[1].children.is_empty());
        }

        #[test]
        fn parse_empty_json() {
            let json_data = "";

            let result = JsonParser::parse(json_data).unwrap();
            assert!(result.is_empty());
        }

        #[test]
        fn parse_empty_json_array() {
            let json_data = "[]";

            let result = JsonParser::parse(json_data).unwrap();
            assert!(result.is_empty());
        }

        #[test]
        fn parse_json_with_missing_fields() {
            let json_data = r#"
            [
                {
                    "context": "Test1",
                    "input": "input1"
                },
                {
                    "context": "Test2",
                    "input": "input2",
                    "output": "output2",
                    "openCode": "code2"
                }
            ]"#;

            let result = JsonParser::parse(json_data);
            assert!(result.is_err());
        }

        #[test]
        fn parse_malformed_json() {
            let json_data = r#"
            [
                {
                    "context": "Test1",
                    "input": "input1",
                    "output": "output1",
                    "openCode": "code1"
                }
                {
                    "context": "Test2",
                    "input": "input2",
                    "output": "output2",
                    "openCode": "code2"
                }
            ]"#;

            let result = JsonParser::parse(json_data);
            assert!(result.is_err());
        }

        #[test]
        fn parse_json_with_extra_fields() {
            let json_data = r#"
            [
                {
                    "context": "Test1",
                    "input": "input1",
                    "output": "output1",
                    "openCode": "code1",
                    "extra_field": "ignored"
                }
            ]"#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 1);
            assert_eq!(result[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(result[0].input, "input1");
            assert_eq!(result[0].output, "output1");
            assert_eq!(result[0].open_code.as_deref().unwrap(), "code1");
            assert!(result[0].children.is_empty());
        }

        #[test]
        fn parse_json_with_null_values() {
            let json_data = r#"
            [
                {
                    "context": null,
                    "input": "input1",
                    "output": "output1",
                    "openCode": "code1"
                }
            ]"#;

            let result = JsonParser::parse(json_data);
            assert!(result.is_ok());
        }

        #[test]
        fn parse_json_with_empty_strings() {
            let json_data = r#"
            [
                {
                    "context": "",
                    "input": "",
                    "output": "",
                    "openCode": ""
                }
            ]"#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 1);
            assert_eq!(result[0].context.as_deref().unwrap(), "");
            assert_eq!(result[0].input, "");
            assert_eq!(result[0].output, "");
            assert_eq!(result[0].open_code.as_deref().unwrap(), "");
            assert!(result[0].children.is_empty());
        }

        #[test]
        fn parse_json_with_special_characters() {
            let json_data = r#"
            [
                {
                    "context": "Test\nwith\nnewlines",
                    "input": "input with \"quotes\"",
                    "output": "output with \t tabs",
                    "openCode": "code with \\ backslash"
                }
            ]"#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 1);
            assert_eq!(
                result[0].context.as_deref().unwrap(),
                "Test\nwith\nnewlines"
            );
            assert_eq!(result[0].input, "input with \"quotes\"");
            assert_eq!(result[0].output, "output with \t tabs");
            assert_eq!(
                result[0].open_code.as_deref().unwrap(),
                "code with \\ backslash"
            );
        }

        #[test]
        fn parse_json_with_unicode() {
            let json_data = r#"
            [
                {
                    "context": "Test with unicode: 你好",
                    "input": "input with emoji: 😀",
                    "output": "output with accent: café",
                    "openCode": "code with symbol: ©"
                }
            ]"#;

            let result = JsonParser::parse(json_data).unwrap();
            assert_eq!(result.len(), 1);
            assert_eq!(
                result[0].context.as_deref().unwrap(),
                "Test with unicode: 你好"
            );
            assert_eq!(result[0].input, "input with emoji: 😀");
            assert_eq!(result[0].output, "output with accent: café");
            assert_eq!(
                result[0].open_code.as_deref().unwrap(),
                "code with symbol: ©"
            );
        }
    }

    mod probe {
        use crate::parsers::base::{JsonStructure, Parser};
        use serde_json::{json, Value};

        use super::super::JsonParser;

        fn assert_some_probe(txt: &str, expected_kind: JsonStructure, expected_value: Value) {
            let res = JsonParser::probe(txt).expect("expected Some");
            assert_eq!(res.0, expected_kind);
            assert_eq!(res.1, expected_value);
        }

        #[test]
        fn probe_whitespace_only() {
            assert!(JsonParser::probe("   \n\t   ").is_none());
        }

        #[test]
        fn probe_simple_object() {
            assert_some_probe(
                r#"{"a":1, "b":"text"}"#,
                JsonStructure::Object,
                json!({"a":1, "b":"text"}),
            );
        }

        #[test]
        fn probe_empty_object() {
            assert_some_probe(r#"{}"#, JsonStructure::Object, json!({}));
        }

        #[test]
        fn probe_nested_object() {
            assert_some_probe(
                r#"{"a": {"b": [1,2]}}"#,
                JsonStructure::Object,
                json!({"a": {"b": [1,2]}}),
            );
        }

        #[test]
        fn probe_simple_array() {
            assert_some_probe(r#"[1, 2, 3]"#, JsonStructure::Array, json!([1]));
        }

        #[test]
        fn probe_empty_array() {
            assert_some_probe(r#"[]"#, JsonStructure::Array, json!([]));
        }

        #[test]
        fn probe_single_element_array() {
            assert_some_probe(r#"[null]"#, JsonStructure::Array, json!([null]));
        }

        #[test]
        fn probe_array_of_objects() {
            assert_some_probe(
                r#"[{"a":1},{"b":2}]"#,
                JsonStructure::Array,
                json!([{"a":1}]),
            );
        }

        #[test]
        fn probe_array_of_arrays() {
            assert_some_probe(r#"[[1,2],[3,4]]"#, JsonStructure::Array, json!([[1, 2]]));
        }

        #[test]
        fn probe_integer() {
            assert_some_probe("42", JsonStructure::Primitive, json!(42));
        }

        #[test]
        fn probe_negative_integer() {
            assert_some_probe("-7", JsonStructure::Primitive, json!(-7));
        }

        #[test]
        fn probe_bool_true() {
            assert_some_probe("true", JsonStructure::Primitive, json!(true));
        }

        #[test]
        fn probe_bool_false() {
            assert_some_probe("false", JsonStructure::Primitive, json!(false));
        }

        #[test]
        fn probe_null() {
            assert_some_probe("null", JsonStructure::Primitive, json!(null));
        }

        #[test]
        fn probe_string() {
            assert_some_probe(
                r#""hello world""#,
                JsonStructure::Primitive,
                json!("hello world"),
            );
        }

        #[test]
        fn probe_string_with_escape() {
            assert_some_probe(
                r#""hello \"world\"""#,
                JsonStructure::Primitive,
                json!("hello \"world\""),
            );
        }

        #[test]
        fn probe_object_with_leading_ws() {
            assert_some_probe(r#"   {"x":10}"#, JsonStructure::Object, json!({"x":10}));
        }

        #[test]
        fn probe_array_with_leading_ws() {
            assert_some_probe(r#"   [1,2,3]"#, JsonStructure::Array, json!([1]));
        }

        #[test]
        fn probe_array_with_escape_characters() {
            assert_some_probe(r#"   ["\\1"]"#, JsonStructure::Array, json!(["\\1"]));
        }

        #[test]
        fn probe_primitive_with_leading_ws() {
            assert_some_probe(r#"   12345"#, JsonStructure::Primitive, json!(12345));
        }

        #[test]
        fn probe_primitive_with_trailing_text() {
            assert_some_probe(r#"42   garbage"#, JsonStructure::Primitive, json!(42));
        }

        #[test]
        fn probe_object_with_trailing_text() {
            assert_some_probe(r#"{"a":1}   more"#, JsonStructure::Object, json!({"a":1}));
        }

        #[test]
        fn probe_incomplete_object() {
            assert!(JsonParser::probe(r#"{"a": "#).is_none());
        }

        #[test]
        fn probe_incomplete_array() {
            assert_some_probe(r#"[true, "#, JsonStructure::Array, json!([true]));
            assert_some_probe(r#"[false, "#, JsonStructure::Array, json!([false]));
        }

        #[test]
        fn probe_missing_quotes() {
            assert!(JsonParser::probe(r#"{"a":1}"#).is_some());
            assert!(JsonParser::probe(r#"{a:1}"#).is_none());
        }

        #[test]
        fn probe_escaped_quotes_in_string() {
            assert_some_probe(
                r#"{"msg":"He said, \"Hello!\"" }"#,
                JsonStructure::Object,
                json!({"msg":"He said, \"Hello!\""}),
            );
        }

        #[test]
        fn probe_json_with_whitespace_inside() {
            assert_some_probe(
                r#" { "a" : 1 , "b" : [2,3] } "#,
                JsonStructure::Object,
                json!({"a":1,"b":[2,3]}),
            );
        }

        #[test]
        fn probe_incomplete_json_array_value() {
            assert_some_probe(r#"[{"a": "b"#, JsonStructure::Array, json!([{"a":"b"}]));
        }

        #[test]
        fn probe_incomplete_json_object_value() {
            assert_some_probe(r#"{"a": "b"#, JsonStructure::Object, json!({"a":"b"}));
        }
    }
}

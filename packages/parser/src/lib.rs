mod helpers;
mod parsers;

use serde_json::Value;
use wasm_bindgen::{prelude::*, JsValue};

use crate::helpers::is_likely_text;
use crate::parsers::base::{JsonStructure, Kind, Parser, ProbeResult};

#[wasm_bindgen]
pub enum FileType {
    CSV,
    JSON,
    OpenTelemetry,
}

#[wasm_bindgen]
pub fn parse(file_type: FileType, string: &str) -> Result<JsValue, JsValue> {
    let result = match file_type {
        FileType::CSV => parsers::csv::CsvParser::parse(string),
        FileType::JSON => parsers::json::JsonParser::parse(string),
        FileType::OpenTelemetry => parsers::opentelemetry::OpenTelemetryParser::parse(string),
    };

    serde_wasm_bindgen::to_value(&result?).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn probe(text: &str) -> Result<JsValue, JsValue> {
    if !is_likely_text(text.as_bytes(), 30.0) {
        return serde_wasm_bindgen::to_value(&ProbeResult { kind: Kind::Binary })
            .map_err(|e| JsValue::from_str(&e.to_string()));
    }

    let json_result: Option<ProbeResult> = if let Some((structure, value, incomplete_parse)) =
        parsers::json::JsonParser::probe(text)
    {
        let opentelemetry =
            parsers::opentelemetry::OpenTelemetryParser::probe(text).unwrap_or_default();
        let kind = match structure {
            JsonStructure::Array => {
                let arr = match value {
                    Value::Array(a) => {
                        let first = a.into_iter().next();
                        match first {
                            Some(v) => vec![v],
                            None => vec![],
                        }
                    }
                    other => vec![other],
                };
                Kind::Json {
                    sample_objects: arr,
                    json_structure: JsonStructure::Array,
                    incomplete_parse,
                    opentelemetry,
                }
            }
            JsonStructure::Object => Kind::Json {
                sample_objects: vec![value],
                json_structure: JsonStructure::Object,
                incomplete_parse,
                opentelemetry,
            },
            JsonStructure::Primitive => Kind::Json {
                sample_objects: vec![value],
                json_structure: JsonStructure::Primitive,
                incomplete_parse,
                opentelemetry,
            },
        };
        Some(ProbeResult { kind })
    } else {
        None
    };

    let csv_result: Option<ProbeResult> = if let Some((delim, cols, has_header, headers, rows)) =
        parsers::csv::CsvParser::probe(text)
    {
        let mut sample_rows = rows;
        if has_header && !sample_rows.is_empty() {
            sample_rows.remove(0);
        }
        if sample_rows.len() > 5 {
            sample_rows.truncate(5);
        }
        Some(ProbeResult {
            kind: Kind::Csv {
                delimiter: delim,
                columns: cols,
                has_header,
                headers,
                sample_rows,
            },
        })
    } else {
        None
    };

    let final_result = json_result.or(csv_result);

    serde_wasm_bindgen::to_value(&final_result.unwrap())
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

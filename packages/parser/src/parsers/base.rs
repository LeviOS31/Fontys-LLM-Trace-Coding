use serde::{Deserialize, Serialize};
use serde_json::Value;

pub trait Parser {
    type ProbeResult;

    fn parse(input: &str) -> Result<Vec<ParsedTrace>, String>;
    fn probe(text: &str) -> Option<Self::ProbeResult>;
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ParsedTrace {
    pub name: Option<String>,
    pub system: Option<String>,
    pub input: String,
    pub output: String,
    pub open_code: Option<String>,
    pub context: Option<String>,
    pub children: Vec<ParsedTrace>,
}

#[derive(Serialize, Debug)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Kind {
    Binary,
    #[serde(rename_all = "camelCase")]
    Json {
        #[serde(rename = "sample")]
        sample_objects: Vec<Value>,
        json_structure: JsonStructure,
        incomplete_parse: bool,
        opentelemetry: bool,
    },
    #[serde(rename_all = "camelCase")]
    Csv {
        delimiter: char,
        columns: usize,
        has_header: bool,
        headers: Vec<String>,
        #[serde(rename = "sample")]
        sample_rows: Vec<Vec<String>>,
    },
}

#[derive(Serialize, PartialEq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum JsonStructure {
    Object,
    Array,
    Primitive,
}

#[derive(Serialize, Debug)]
pub struct ProbeResult {
    #[serde(flatten)]
    pub kind: Kind,
}

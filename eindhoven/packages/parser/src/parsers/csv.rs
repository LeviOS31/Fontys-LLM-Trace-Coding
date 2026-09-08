use csv::ReaderBuilder;
use serde::{Deserialize, Serialize};

use crate::parsers::base::{ParsedTrace, Parser};

#[derive(Debug, Deserialize, Serialize)]
struct Record {
    name: Option<String>,
    system: Option<String>,
    context: Option<String>,
    input: String,
    output: String,
    open_code: Option<String>,
}

pub struct CsvParser;

impl Parser for CsvParser {
    type ProbeResult = (char, usize, bool, Vec<String>, Vec<Vec<String>>);

    fn parse(input: &str) -> Result<Vec<ParsedTrace>, String> {
        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .trim(csv::Trim::All)
            .from_reader(input.as_bytes());

        let headers = reader.headers().map_err(|e| e.to_string())?;
        let expected_headers = ["input", "output", "context", "open_code"];
        for expected in expected_headers.iter() {
            if !headers.iter().any(|h| &h == expected) {
                return Err(format!("Missing required header: {}", expected));
            }
        }

        let mut records: Vec<ParsedTrace> = Vec::new();

        for result in reader.deserialize() {
            let record: Record = result.map_err(|e| e.to_string())?;
            if record.input.is_empty() || record.output.is_empty() {
                return Err("Invalid record: input or output field is empty".into());
            }
            records.push(ParsedTrace {
                name: record.name,
                system: record.system,
                input: record.input,
                output: record.output,
                context: record.context,
                open_code: record.open_code,
                children: Vec::new(),
            });
        }

        Ok(records)
    }

    fn probe(text: &str) -> Option<Self::ProbeResult> {
        let repaired = CsvParser::repair_csv(text);
        let min_rows = 2;
        let delimiters = [b',', b'\t', b';', b'|'];
        let mut best: Option<(u8, usize, Vec<Vec<String>>)> = None;

        for &delim in &delimiters {
            let mut rdr = ReaderBuilder::new()
                .delimiter(delim)
                .flexible(true) // allow rows with fewer fields
                .has_headers(false)
                .from_reader(repaired.as_bytes());

            let mut rows = Vec::new();
            for result in rdr.records().take(std::cmp::max(5, min_rows)) {
                let rec = result.unwrap();
                rows.push(rec.iter().map(|s| s.to_string()).collect::<Vec<_>>());
            }

            let col_count = rows[0].len();

            if col_count <= 1 {
                continue;
            }

            match &best {
                None => best = Some((delim, col_count, rows)),
                Some((_d, c, _)) if col_count > *c => best = Some((delim, col_count, rows)),
                _ => {}
            }
        }

        let (delim, col_count, rows) = best?;
        let header_tokens: Vec<&str> = rows[0].iter().map(|t| t.trim()).collect();
        let header_likely = header_tokens
            .iter()
            .any(|t| t.is_empty() || t.parse::<f64>().is_err());

        Some((
            char::from(delim),
            col_count,
            header_likely,
            rows[0].clone(),
            rows,
        ))
    }
}

impl CsvParser {
    fn repair_csv(text: &str) -> String {
        let mut out = String::with_capacity(text.len() + 8);
        let mut it = text.chars().peekable();
        let mut in_quotes = false;

        while let Some(c) = it.next() {
            out.push(c);

            if c != '"' {
                continue;
            }

            if in_quotes {
                if it.peek() == Some(&'"') {
                    out.push('"');
                    it.next();
                    continue;
                }
                in_quotes = false;
            } else {
                in_quotes = true;
            }
        }

        if in_quotes {
            out.push('"');
        }

        out
    }
}

#[cfg(test)]
mod tests {
    mod parse {
        use crate::parsers::base::Parser;

        use super::super::CsvParser;

        #[test]
        fn parse_valid_csv() {
            let csv_data = "context,input,output,open_code\nTest1,input1,output1,code1\nTest2,input2,output2,code2";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 2);
            assert_eq!(records[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(records[0].input, "input1");
            assert_eq!(records[0].output, "output1");
            assert_eq!(records[0].open_code.as_deref().unwrap(), "code1");
            assert!(records[0].children.is_empty());

            assert_eq!(records[1].context.as_deref().unwrap(), "Test2");
            assert_eq!(records[1].input, "input2");
            assert_eq!(records[1].output, "output2");
            assert_eq!(records[1].open_code.as_deref().unwrap(), "code2");
            assert!(records[1].children.is_empty());
        }

        #[test]
        fn parse_empty_csv() {
            let csv_data = "context,input,output,open_code";

            let records = CsvParser::parse(csv_data).unwrap();

            assert!(records.is_empty());
        }

        #[test]
        fn parse_csv_with_missing_fields() {
            let csv_data =
                "context,input,output,open_code\nTest1,input1,output1,\nTest2,input2,output2,code2";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 2);
            assert!(records[0].open_code.is_none());
            assert_eq!(records[1].open_code.as_deref().unwrap(), "code2");
        }

        #[test]
        fn parse_invalid_csv() {
            let csv_data = "invalid,csv,data,without,headers";

            let result = CsvParser::parse(csv_data);
            assert!(result.is_err());
        }

        #[test]
        fn parse_csv_with_extra_fields() {
            let csv_data = "context,input,output,open_code,extra_field\nTest1,input1,output1,code1,extra1\nTest2,input2,output2,code2,extra2";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 2);
            assert_eq!(records[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(records[0].input, "input1");
            assert_eq!(records[0].output, "output1");
            assert_eq!(records[0].open_code.as_deref().unwrap(), "code1");
            assert!(records[0].children.is_empty());
        }

        #[test]
        fn parse_csv_with_special_characters() {
            let csv_data = "context,input,output,open_code\nTest,in\"put,out\"put,code\nTest2,input2,output2,code2";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 2);
            assert_eq!(records[0].input, "in\"put");
            assert_eq!(records[0].output, "out\"put");
        }

        #[test]
        fn parse_csv_with_empty_lines() {
            let csv_data = "context,input,output,open_code\nTest1,input1,output1,code1\n\nTest2,input2,output2,code2";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 2);
        }

        #[test]
        fn parse_csv_with_whitespace() {
            let csv_data =
                " context , input , output , open_code \n Test1 , input1 , output1 , code1 ";

            let records = CsvParser::parse(csv_data).unwrap();

            assert_eq!(records.len(), 1);
            assert_eq!(records[0].context.as_deref().unwrap(), "Test1");
            assert_eq!(records[0].input, "input1");
            assert_eq!(records[0].output, "output1");
            assert_eq!(records[0].open_code.as_deref().unwrap(), "code1");
        }
    }

    mod probe {
        use crate::parsers::base::Parser;

        use super::super::CsvParser;

        #[test]
        fn probe_inconsistent_columns() {
            let txt = "a,b\n1,2,3\n";
            assert!(CsvParser::probe(txt).is_some());
        }

        #[test]
        fn probe_insufficient_rows() {
            let txt = "a,b,c\n";
            assert!(CsvParser::probe(txt).is_some());
        }

        #[test]
        fn probe_tab_delimiter() {
            let txt = "a\tb\tc\n1\t2\t3\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.0, '\t');
            assert_eq!(res.1, 3);
        }

        #[test]
        fn probe_quoted_field_consistent_columns() {
            let txt = "\"a,b\",c\n\"d,e\",f\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.0, ',');
            assert_eq!(res.1, 2);
            assert_eq!(res.4.len(), 2);
            assert_eq!(res.4[0], vec!["a,b", "c"]);
        }

        #[test]
        fn probe_crlf_line_endings() {
            let txt = "x,y,z\r\n1,2,3\r\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.0, ',');
            assert_eq!(res.4[0], vec!["x", "y", "z"]);
        }

        #[test]
        fn probe_header_with_empty_token() {
            let txt = "a,,c\n1,2,3\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert!(res.2);
        }

        #[test]
        fn probe_header_mixed_tokens() {
            let txt = "1,2,b\n4,5,6\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert!(res.2);
        }

        #[test]
        fn probe_limits_to_five_rows() {
            let txt = "a,b,c\n1,2,3\n4,5,6\n7,8,9\n10,11,12\n13,14,15\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.4.len(), 5);
            assert_eq!(res.4[0], vec!["a", "b", "c"]);
            assert_eq!(res.4[4], vec!["10", "11", "12"]);
        }

        #[test]
        fn probe_tie_breaks_any_candidate() {
            let txt = "a|b|c\n1|2|3\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.3, vec!["a", "b", "c"]);
            assert!(res.0 == ',' || res.0 == '|');
        }

        #[test]
        fn probe_escaped_double_quotes() {
            let txt = "\"a\",\"b\",c\n1,2,3\n";
            let res = CsvParser::probe(txt).expect("expected a probe result");
            assert_eq!(res.4[0][0], r#"a"#);
            assert_eq!(res.4[0][1], r#"b"#);
        }
    }
}

pub(crate) fn is_likely_text(buf: &[u8], non_printable_pct: f64) -> bool {
    if buf.is_empty() {
        return true;
    }

    if buf.starts_with(&[0xEF, 0xBB, 0xBF])   // UTF‑8 BOM
        || buf.starts_with(&[0xFF, 0xFE])     // UTF‑16 LE
        || buf.starts_with(&[0xFE, 0xFF])     // UTF‑16 BE
        || buf.starts_with(&[0xFF, 0xFE, 0x00, 0x00]) // UTF‑32 LE
        || buf.starts_with(&[0x00, 0x00, 0xFE, 0xFF]) // UTF‑32 BE
    {
        return true;
    }

    if buf.contains(&0) {
        return false;
    }

    let non_printable = buf
        .iter()
        .filter(|&&b| !(b == b'\t' || b == b'\r' || b == b'\n' || (0x20..=0x7E).contains(&b)))
        .count();
    let pct = (non_printable as f64) / (buf.len() as f64) * 100.0;
    pct <= non_printable_pct
}

pub(crate) fn parse_json<T>(input: &str) -> Result<Vec<T>, String>
where
    T: for<'a> serde::de::Deserialize<'a>,
{
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Ok(vec![]);
    }

    match trimmed.chars().next() {
        Some('[') => serde_json::from_str(trimmed).map_err(|e| e.to_string()),
        Some('{') => Ok(trimmed
            .lines()
            .map(str::trim)
            .filter(|l| !l.is_empty())
            .filter_map(|l| serde_json::from_str(l).ok())
            .collect()),
        _ => Err("Input must start with '[' or '{'".to_string()),
    }
}

#[cfg(test)]
mod tests {
    mod is_likely_text {
        use super::super::is_likely_text;

        #[test]
        fn nul_byte_kills_it() {
            let data = b"Hello\x00World";
            assert!(!is_likely_text(data, 30.0));
        }

        #[test]
        fn nul_in_middle_of_binary_is_binary() {
            let png_with_nul = &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01];
            assert!(!is_likely_text(png_with_nul, 30.0));
        }

        #[test]
        fn high_printable_ratio_passes() {
            let data = b"Hello world! 1234567890";
            assert!(is_likely_text(data, 30.0));
        }

        #[test]
        fn borderline_non_printable_ratio_fails() {
            let data = b"abcd\x01\x02\x03\x04\x05\x06";
            assert!(!is_likely_text(data, 30.0));
        }

        #[test]
        fn lower_threshold_allows_non_printable() {
            let data = b"\x80\x81\x82\x83";
            assert!(!is_likely_text(data, 30.0));
            assert!(is_likely_text(data, 100.0));
        }

        #[test]
        fn custom_thresholds_work() {
            let data = b"abcd\x01\x02\x03\x04\x05\x06";
            assert!(!is_likely_text(data, 30.0));
            assert!(is_likely_text(data, 70.0));
        }

        #[test]
        fn utf16le_bom_is_text() {
            let bom = &[0xFF, 0xFE, b'H', 0x00, b'i', 0x00];
            assert!(is_likely_text(bom, 30.0));
        }

        #[test]
        fn utf32be_bom_is_text() {
            let bom = &[0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x48]; // 'H'
            assert!(is_likely_text(bom, 30.0));
        }
    }

    mod parse_json {
        use super::super::parse_json;
        use serde::Deserialize;

        #[derive(Debug, Deserialize, PartialEq)]
        struct User {
            id: u32,
            name: String,
        }

        #[test]
        fn empty_string_succeeds() {
            let input = "";
            let result: Result<Vec<i32>, String> = parse_json(input);
            assert_eq!(result.unwrap(), Vec::<i32>::new());

            let input_whitespace = "   \n\t  ";
            let result_ws: Result<Vec<i32>, String> = parse_json(input_whitespace);
            assert_eq!(result_ws.unwrap(), Vec::<i32>::new());
        }

        #[test]
        fn array_primitives_succeed() {
            let input = "[1, 2, 3]";
            let result: Result<Vec<i32>, String> = parse_json(input);
            assert_eq!(result.unwrap(), vec![1, 2, 3]);
        }

        #[test]
        fn array_objects_succeed() {
            let input = r#"[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]"#;
            let result: Result<Vec<User>, String> = parse_json(input);
            let expected = vec![
                User {
                    id: 1,
                    name: "Alice".to_string(),
                },
                User {
                    id: 2,
                    name: "Bob".to_string(),
                },
            ];
            assert_eq!(result.unwrap(), expected);
        }

        #[test]
        fn invalid_array_syntax_fails() {
            let input = "[1, 2, ";
            let result: Result<Vec<i32>, String> = parse_json(input);
            assert!(result.is_err());
        }

        #[test]
        fn json_lines_succeed() {
            let input = r#"{"id": 1, "name": "Alice"}
                      {"id": 2, "name": "Bob"}"#;
            let result: Result<Vec<User>, String> = parse_json(input);
            let expected = vec![
                User {
                    id: 1,
                    name: "Alice".to_string(),
                },
                User {
                    id: 2,
                    name: "Bob".to_string(),
                },
            ];
            assert_eq!(result.unwrap(), expected);
        }

        #[test]
        fn ignores_whitespace_and_empty_lines() {
            let input = r#"
            {"id": 1, "name": "Alice"}
            
            {"id": 2, "name": "Bob"}
            
        "#;
            let result: Result<Vec<User>, String> = parse_json(input);
            let expected = vec![
                User {
                    id: 1,
                    name: "Alice".to_string(),
                },
                User {
                    id: 2,
                    name: "Bob".to_string(),
                },
            ];
            assert_eq!(result.unwrap(), expected);
        }

        #[test]
        fn ignores_invalid_lines() {
            let input = r#"{"id": 1, "name": "Alice"}
                      this is not json
                      {"id": 2, "name": "Bob"}"#;
            let result: Result<Vec<User>, String> = parse_json(input);
            let expected = vec![
                User {
                    id: 1,
                    name: "Alice".to_string(),
                },
                User {
                    id: 2,
                    name: "Bob".to_string(),
                },
            ];
            assert_eq!(result.unwrap(), expected);
        }

        #[test]
        fn invalid_starts_fail() {
            let inputs = vec!["true", "123", "\"hello\"", "null", "random text"];

            for input in inputs {
                let result: Result<Vec<i32>, String> = parse_json(input);
                assert!(result.is_err());
                assert_eq!(result.unwrap_err(), "Input must start with '[' or '{'");
            }
        }

        #[test]
        fn type_mismatch_fails() {
            let input = "[1, 2, 3]";
            let result: Result<Vec<User>, String> = parse_json(input);
            assert!(result.is_err());
        }
    }
}

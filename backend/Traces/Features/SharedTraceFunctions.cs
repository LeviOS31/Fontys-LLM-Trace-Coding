using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Traces.Features
{
    public partial class SharedTraceFunctions
    {
        public static string BuildTranscript(Data.Models.Trace trace)
        {
            var spans = trace
                .TraceScopes
                .SelectMany(s => s.TraceScopeSpans)
                .OrderBy(span => span.StartTimeUnixNano)
                .ToList();

            var messages = new List<(string Role, string Content)>();

            foreach (var span in spans)
            {
                var promptRoles = new Dictionary<int, string>();
                var promptContents = new Dictionary<int, string>();
                var completionRoles = new Dictionary<int, string>();
                var completionContents = new Dictionary<int, string>();

                foreach (var attr in span.SpanAttributes)
                {
                    var match = GenAiAttributeRegex().Match(attr.Key);

                    if (!match.Success)
                    {
                        continue;
                    }

                    var kind = match.Groups["kind"].Value;
                    var index = int.Parse(match.Groups["index"].Value);
                    var field = match.Groups["field"].Value;
                    var value = attr.Value ?? "";

                    var rolesDict = kind == "prompt"
                        ? promptRoles
                        : completionRoles;

                    var contentsDict = kind == "prompt"
                        ? promptContents
                        : completionContents;

                    if (field == "role")
                    {
                        rolesDict[index] = value;
                    }
                    else if (field == "content")
                    {
                        contentsDict[index] = value;
                    }
                }

                foreach (var index in promptContents.Keys.OrderBy(i => i))
                {
                    var role = promptRoles.GetValueOrDefault(index, "unknown");
                    var content = promptContents[index];

                    if (messages.Count == 0 || messages[^1] != (role, content))
                    {
                        messages.Add((role, content));
                    }
                }

                foreach (var index in completionContents.Keys.OrderBy(i => i))
                {
                    var role = completionRoles.GetValueOrDefault(index, "assistant");
                    var content = completionContents[index];

                    if (messages.Count == 0 || messages[^1] != (role, content))
                    {
                        messages.Add((role, content));
                    }
                }
            }

            var sb = new StringBuilder();

            foreach (var (role, content) in messages)
            {
                sb.AppendLine($"{role.ToUpperInvariant()}: {content}");
                sb.AppendLine();
            }

            return sb.ToString().Trim();
        }

        [GeneratedRegex(
            @"^gen_ai\.(?<kind>prompt|completion)\.(?<index>\d+)\.(?<field>role|content)$"
        )]
        private static partial Regex GenAiAttributeRegex();
    }
}

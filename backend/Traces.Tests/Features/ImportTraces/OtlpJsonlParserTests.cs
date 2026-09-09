using System.Text;
using Microsoft.AspNetCore.Http;
using Traces.Features.ImportTraces;
using Traces.Features.ImportTraces.Parsers;

namespace Traces.Tests.Features.ImportTraces;

public class OtlpJsonlParserTests
{
    [Fact]
    public async Task Parse_TopLevelArray_MergesSpansByTraceId()
    {
        const string json = """
            [
              {"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]},"scopeSpans":[{"scope":{"name":"test"},"spans":[{"traceId":"00112233445566778899aabbccddeeff","spanId":"0011223344556677","name":"first","startTimeUnixNano":"1","endTimeUnixNano":"2"}]}]}]},
              {"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]},"scopeSpans":[{"scope":{"name":"test"},"spans":[{"traceId":"00112233445566778899aabbccddeeff","spanId":"8899aabbccddeeff","name":"second","startTimeUnixNano":"3","endTimeUnixNano":"4"}]}]}]}
            ]
            """;

        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var file = new FormFile(stream, 0, stream.Length, "file", "otel.json");
        var request = new ImportTracesRequest
        {
            ProjectId = Guid.NewGuid(),
            ProjectVersionId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "test",
            File = file,
        };

        var result = await OtlpJsonlParser.Parse(request, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var trace = Assert.Single(result.Value);
        Assert.Equal(2, trace.ResourceSpans.Sum(resource => resource.ScopeSpans.Sum(scope => scope.Spans.Count)));
        Assert.Single(trace.ResourceSpans.Single().Resource.Attributes);
    }
}
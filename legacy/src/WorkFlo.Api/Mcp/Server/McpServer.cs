using System.Text.Json;
using WorkFlo.Api.Mcp.Infrastructure;
using WorkFlo.Api.Mcp.Models;
using WorkFlo.Api.Mcp.Tools;

namespace WorkFlo.Api.Mcp.Server;

public class McpServer
{
    private readonly McpMessageRouter _router;
    private readonly TextReader _input;
    private readonly TextWriter _output;
    private readonly McpToolRegistry _toolRegistry;

    public McpServer(TextReader input, TextWriter output)
    {
        _router = new McpMessageRouter();
        _input = input;
        _output = output;
        _toolRegistry = new McpToolRegistry();
        RegisterDefaultHandlers();
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var line = await _input.ReadLineAsync(cancellationToken).ConfigureAwait(false);
            if (line == null)
                break;

            var response = await _router.RouteMessage(line).ConfigureAwait(false);
            if (response != null)
            {
                var responseJson = JsonSerializer.Serialize(response);
                await _output.WriteLineAsync(responseJson).ConfigureAwait(false);
                await _output.FlushAsync(cancellationToken).ConfigureAwait(false);
            }
        }
    }

    public void RegisterHandler(string method, Func<McpRequest, Task<McpResponse>> handler)
    {
        _router.RegisterHandler(method, handler);
    }

    private void RegisterDefaultHandlers()
    {
        _router.RegisterHandler("initialize", HandleInitialize);
        _router.RegisterHandler("tools/list", async request => _toolRegistry.ListTools(request));
        _router.RegisterHandler("tools/call", async request => await _toolRegistry.CallTool(request).ConfigureAwait(false));
    }

    private static Task<McpResponse> HandleInitialize(McpRequest request)
    {
        var result = new
        {
            protocolVersion = "2025-06-18",
            capabilities = new
            {
                tools = new { }
            }
        };

        return Task.FromResult(new McpResponse
        {
            Id = request.Id,
            Result = result
        });
    }
}
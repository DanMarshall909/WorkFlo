using System.Text.Json;
using WorkFlo.Api.Mcp.Models;

namespace WorkFlo.Api.Mcp.Infrastructure;

public class McpMessageRouter
{
    private readonly Dictionary<string, Func<McpRequest, Task<McpResponse>>> _handlers = new();

    public void RegisterHandler(string method, Func<McpRequest, Task<McpResponse>> handler)
    {
        _handlers[method] = handler;
    }

    public async Task<McpResponse?> RouteMessage(string jsonMessage)
    {
        try
        {
            var request = JsonSerializer.Deserialize<McpRequest>(jsonMessage);
            if (request == null || !request.IsValid())
            {
                return CreateErrorResponse(null, -32600, "Invalid Request");
            }

            if (!_handlers.TryGetValue(request.Method, out var handler))
            {
                if (request.IsNotification)
                    return null; // Notifications don't need responses
                
                return CreateErrorResponse(request.Id, -32601, "Method not found");
            }

            return await handler(request).ConfigureAwait(false);
        }
        catch (JsonException)
        {
            return CreateErrorResponse(null, -32700, "Parse error");
        }
        catch (Exception ex)
        {
            return CreateErrorResponse(null, -32603, $"Internal error: {ex.Message}");
        }
    }

    private static McpResponse CreateErrorResponse(object? id, int code, string message)
    {
        return new McpResponse
        {
            Id = id,
            Error = new { code, message }
        };
    }
}
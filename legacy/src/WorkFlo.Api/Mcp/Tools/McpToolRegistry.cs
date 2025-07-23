using System.Text.Json;
using WorkFlo.Api.Mcp.Models;

namespace WorkFlo.Api.Mcp.Tools;

public class McpToolRegistry
{
    private readonly Dictionary<string, McpTool> _tools = new();

    public McpToolRegistry()
    {
        RegisterDefaultTools();
    }

    public McpResponse ListTools(McpRequest request)
    {
        var tools = _tools.Values.Select(t => new
        {
            name = t.Name,
            description = t.Description,
            inputSchema = t.InputSchema
        }).ToArray();

        return new McpResponse
        {
            Id = request.Id,
            Result = new { tools }
        };
    }

    public async Task<McpResponse> CallTool(McpRequest request)
    {
        try
        {
            if (request.Params == null)
            {
                return CreateErrorResponse(request.Id, -32602, "Missing tool parameters");
            }

            var paramsJson = JsonSerializer.Serialize(request.Params);
            var toolCall = JsonSerializer.Deserialize<ToolCallRequest>(paramsJson);
            
            if (toolCall?.Name == null)
            {
                return CreateErrorResponse(request.Id, -32602, "Missing tool name");
            }

            if (!_tools.TryGetValue(toolCall.Name, out var tool))
            {
                return CreateErrorResponse(request.Id, -32601, $"Tool '{toolCall.Name}' not found");
            }

            var result = await tool.ExecuteAsync(toolCall.Arguments).ConfigureAwait(false);
            
            return new McpResponse
            {
                Id = request.Id,
                Result = new
                {
                    content = new[]
                    {
                        new { type = "text", text = result }
                    }
                }
            };
        }
        catch (Exception ex)
        {
            return CreateErrorResponse(request.Id, -32603, $"Tool execution error: {ex.Message}");
        }
    }

    private void RegisterDefaultTools()
    {
        var commitValidationTool = new McpTool
        {
            Name = "commit_validation",
            Description = "Validates commit messages against conventional commit format",
            InputSchema = new
            {
                type = "object",
                properties = new
                {
                    message = new
                    {
                        type = "string",
                        description = "The commit message to validate"
                    }
                },
                required = new[] { "message" }
            },
            Handler = async arguments =>
            {
                var argsJson = JsonSerializer.Serialize(arguments);
                var args = JsonSerializer.Deserialize<CommitValidationArgs>(argsJson);
                
                if (args?.Message == null)
                    return "Error: Missing commit message";

                var validator = new CommitValidationTool();
                var result = validator.ValidateCommitMessage(args.Message);
                
                return $"Valid: {result.IsValid}\nMessage: {result.ValidationMessage}";
            }
        };

        _tools[commitValidationTool.Name] = commitValidationTool;
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

public class McpTool
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public object? InputSchema { get; set; }
    public Func<object?, Task<string>>? Handler { get; set; }

    public async Task<string> ExecuteAsync(object? arguments)
    {
        if (Handler == null)
            return "Tool handler not implemented";

        return await Handler(arguments).ConfigureAwait(false);
    }
}

public class ToolCallRequest
{
    public string? Name { get; set; }
    public object? Arguments { get; set; }
}

public class CommitValidationArgs
{
    public string? Message { get; set; }
}
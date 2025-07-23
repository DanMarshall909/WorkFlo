using System.Text;
using System.Text.Json;
using WorkFlo.Api.Mcp.Server;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Server;

public class McpServerTests
{
    [Fact]
    public async Task ai_agent_can_initialize_mcp_server()
    {
        // Given: An AI agent wants to initialize an MCP server
        var inputBuilder = new StringBuilder();
        inputBuilder.AppendLine("""{"jsonrpc": "2.0", "id": 1, "method": "initialize"}""");
        
        var input = new StringReader(inputBuilder.ToString());
        var output = new StringWriter();
        var server = new McpServer(input, output);
        
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
        
        // When: The server processes the initialization request
        await server.StartAsync(cts.Token);
        
        // Then: The server should respond with initialization confirmation
        var responseText = output.ToString().Trim();
        Assert.NotEmpty(responseText);
        
        var response = JsonSerializer.Deserialize<JsonDocument>(responseText);
        var root = response!.RootElement;
        
        Assert.Equal("2.0", root.GetProperty("jsonrpc").GetString());
        Assert.True(root.TryGetProperty("result", out var result));
        Assert.Equal("2025-06-18", result.GetProperty("protocolVersion").GetString());
        Assert.True(result.TryGetProperty("capabilities", out var capabilities));
        Assert.True(capabilities.TryGetProperty("tools", out _));
    }
}
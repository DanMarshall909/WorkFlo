using System.Text.Json;
using WorkFlo.Api.Mcp.Models;
using WorkFlo.Api.Mcp.Tools;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Tools;

public class McpToolRegistryTests
{
    [Fact]
    public void ai_agent_can_discover_available_tools()
    {
        // Given: An AI agent wants to discover available MCP tools
        var registry = new McpToolRegistry();
        var request = new McpRequest
        {
            Id = 1,
            Method = "tools/list"
        };

        // When: The registry lists available tools
        var response = registry.ListTools(request);

        // Then: The response should contain the commit validation tool
        Assert.NotNull(response);
        Assert.Equal(1, response.Id);
        Assert.NotNull(response.Result);
        
        var resultJson = JsonSerializer.Serialize(response.Result);
        var result = JsonSerializer.Deserialize<JsonDocument>(resultJson);
        var tools = result!.RootElement.GetProperty("tools");
        
        Assert.True(tools.GetArrayLength() > 0);
        
        var firstTool = tools[0];
        Assert.Equal("commit_validation", firstTool.GetProperty("name").GetString());
        Assert.Contains("commit", firstTool.GetProperty("description").GetString());
        Assert.True(firstTool.TryGetProperty("inputSchema", out var schema));
        Assert.Equal("object", schema.GetProperty("type").GetString());
    }
}
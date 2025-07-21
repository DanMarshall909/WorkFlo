using WorkFlo.Api.Mcp.Models;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Models;

public class McpRequestTests
{
    [Fact]
    public void ai_agent_can_create_valid_mcp_request()
    {
        // Given: An AI agent wants to validate a commit
        var request = new McpRequest
        {
            Id = 1,
            Method = "tools/call", 
            Params = new { name = "validate_commit", arguments = new { commitMessage = "feat: add feature" } }
        };

        // When: The request is validated
        var isValid = request.IsValid();

        // Then: The request should be valid for MCP communication
        Assert.True(isValid);
        Assert.Equal("2.0", request.JsonRpc);
        Assert.Equal(1, request.Id);
        Assert.Equal("tools/call", request.Method);
        Assert.False(request.IsNotification);
    }
}
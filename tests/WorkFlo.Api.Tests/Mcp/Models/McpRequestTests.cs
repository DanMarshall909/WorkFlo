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

    [Fact]
    public void ai_agent_can_send_notification_without_response()
    {
        // Given: An AI agent wants to send a notification (no response expected)
        var notification = new McpRequest
        {
            Id = null,
            Method = "initialized"
        };

        // When: The notification is validated
        var isValid = notification.IsValid();

        // Then: The notification should be valid and marked as notification
        Assert.True(isValid);
        Assert.Equal("2.0", notification.JsonRpc);
        Assert.Null(notification.Id);
        Assert.Equal("initialized", notification.Method);
        Assert.True(notification.IsNotification);
    }

    [Fact]
    public void malformed_mcp_request_fails_validation()
    {
        // Given: A malformed MCP request with empty method
        var invalidRequest = new McpRequest
        {
            Id = 1,
            Method = "",  // Invalid: empty method
            JsonRpc = "2.0"
        };

        // When: The request is validated
        var isValid = invalidRequest.IsValid();

        // Then: The request should be invalid
        Assert.False(isValid);
    }
}
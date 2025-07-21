using WorkFlo.Api.Mcp.Models;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Models;

public class McpResponseTests
{
    [Fact]
    public void mcp_server_can_send_successful_response()
    {
        // Given: An MCP server wants to respond to a commit validation request
        var response = new McpResponse
        {
            Id = 1,
            Result = new { 
                content = new[] 
                { 
                    new { 
                        type = "text", 
                        text = "✅ Commit validation passed\n\nValidation Results:\n- Conventional commit format: ✅ Valid" 
                    } 
                },
                isError = false
            }
        };

        // When: The response is validated
        var isValid = response.IsValid();

        // Then: The response should be valid JSON-RPC 2.0
        Assert.True(isValid);
        Assert.Equal("2.0", response.JsonRpc);
        Assert.Equal(1, response.Id);
        Assert.NotNull(response.Result);
        Assert.Null(response.Error);
        Assert.False(response.IsError);
    }
}
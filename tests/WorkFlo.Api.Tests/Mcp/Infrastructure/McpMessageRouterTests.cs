using System.Text.Json;
using WorkFlo.Api.Mcp.Infrastructure;
using WorkFlo.Api.Mcp.Models;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Infrastructure;

public class McpMessageRouterTests
{
    [Fact]
    public async Task ai_agent_can_route_valid_json_rpc_requests()
    {
        // Given: An AI agent sends a valid JSON-RPC request
        var router = new McpMessageRouter();
        var handlerCalled = false;
        router.RegisterHandler("test_method", async request =>
        {
            handlerCalled = true;
            return new McpResponse { Id = request.Id, Result = "success" };
        });

        var jsonRequest = """{"jsonrpc": "2.0", "id": 1, "method": "test_method"}""";

        // When: The router processes the request
        var response = await router.RouteMessage(jsonRequest);

        // Then: The appropriate handler should be called and return a valid response
        Assert.True(handlerCalled);
        Assert.NotNull(response);
        Assert.NotNull(response.Id);
        Assert.Equal("success", response.Result);
        Assert.Null(response.Error);
    }
}
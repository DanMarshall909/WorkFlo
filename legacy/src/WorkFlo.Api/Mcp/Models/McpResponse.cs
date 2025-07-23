using System.Text.Json.Serialization;

namespace WorkFlo.Api.Mcp.Models;

public class McpResponse
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "2.0";

    [JsonPropertyName("id")]
    public object? Id { get; set; }

    [JsonPropertyName("result")]
    public object? Result { get; set; }

    [JsonPropertyName("error")]
    public object? Error { get; set; }

    public bool IsError => Error != null;

    public bool IsValid()
    {
        // JSON-RPC 2.0 requires version to be "2.0"
        if (JsonRpc != "2.0")
            return false;

        // ID is required for responses (can be null for notifications)
        // Either result or error must be set, but not both
        if (Result != null && Error != null)
            return false;

        if (Result == null && Error == null)
            return false;

        return true;
    }
}
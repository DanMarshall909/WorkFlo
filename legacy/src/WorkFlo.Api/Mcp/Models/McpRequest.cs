using System.Text.Json.Serialization;

namespace WorkFlo.Api.Mcp.Models;

public class McpRequest
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "2.0";

    [JsonPropertyName("id")]
    public object? Id { get; set; }

    [JsonPropertyName("method")]
    public string Method { get; set; } = string.Empty;

    [JsonPropertyName("params")]
    public object? Params { get; set; }

    public bool IsNotification => Id == null;

    public bool IsValid()
    {
        return JsonRpc == "2.0" && !string.IsNullOrWhiteSpace(Method);
    }
}
namespace WorkFlo.Api.Endpoints.Version;

internal sealed class VersionResponse
{
    public string ApiName { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Version { get; init; } = string.Empty;
    public string InformationalVersion { get; init; } = string.Empty;
    public DateTime BuildDate { get; init; }
    public string GitCommit { get; init; } = string.Empty;
    public string Environment { get; init; } = string.Empty;
}

namespace WorkFlo.Api.Services;

internal sealed class VersionInfo
{
    public string Version { get; init; } = string.Empty;
    public string InformationalVersion { get; init; } = string.Empty;
    public DateTime BuildDate { get; init; }
    public string GitCommit { get; init; } = string.Empty;
    public string Environment { get; init; } = string.Empty;
}

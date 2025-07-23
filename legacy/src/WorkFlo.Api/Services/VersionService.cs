using System.Globalization;
using System.Reflection;

namespace WorkFlo.Api.Services;

internal sealed class VersionService : IVersionService
{
    private readonly VersionInfo _versionInfo;

    public VersionService()
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Get version information from assembly attributes
        string version = assembly.GetName().Version?.ToString() ?? "0.0.0";
        string informationalVersion =
            assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? version;
        DateTime buildDate = GetBuildDate(assembly);
        string gitCommit = ExtractGitCommit(informationalVersion);

        _versionInfo = new()
        {
            Version = version,
            InformationalVersion = informationalVersion,
            BuildDate = buildDate,
            GitCommit = gitCommit,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        };
    }

    public VersionInfo GetVersionInfo()
    {
        return _versionInfo;
    }

    private static DateTime GetBuildDate(Assembly assembly)
    {
        // Try to get build date from assembly metadata
        AssemblyMetadataAttribute? buildDateAttribute = assembly.GetCustomAttribute<AssemblyMetadataAttribute>();
        if (string.Equals(buildDateAttribute?.Key, "BuildDate", StringComparison.Ordinal) &&
            DateTime.TryParse(buildDateAttribute?.Value, CultureInfo.InvariantCulture, out DateTime buildDate))
        {
            return buildDate;
        }

        // Fallback to file creation time
        string location = assembly.Location;
        return !string.IsNullOrEmpty(location) && File.Exists(location)
            ? File.GetCreationTimeUtc(location)
            : DateTime.UtcNow;
    }

    private static string ExtractGitCommit(string informationalVersion)
    {
        // Extract git commit from informational version (format: "1.0.0+abc123")
        int plusIndex = informationalVersion.IndexOf('+', StringComparison.Ordinal);
        return plusIndex >= 0 ? informationalVersion.Substring(plusIndex + 1) : string.Empty;
    }
}

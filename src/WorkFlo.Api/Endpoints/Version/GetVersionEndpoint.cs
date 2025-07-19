using WorkFlo.Api.Services;
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Version;

internal sealed class GetVersionEndpoint : EndpointWithoutRequest<VersionResponse>
{
    private readonly IVersionService _versionService;

    public GetVersionEndpoint(IVersionService versionService)
    {
        _versionService = versionService;
    }

    public override void Configure()
    {
        Get("/api/version");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Get API version information";
            s.Description = "Returns version, build date, git commit, and environment information";
        });
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        VersionInfo versionInfo = _versionService.GetVersionInfo();

        var response = new VersionResponse
        {
            Version = versionInfo.Version,
            InformationalVersion = versionInfo.InformationalVersion,
            BuildDate = versionInfo.BuildDate,
            GitCommit = versionInfo.GitCommit,
            Environment = versionInfo.Environment,
            ApiName = "WorkFlo API",
            Message = "Privacy-first ADHD task management API"
        };

        return SendOkAsync(response, ct);
    }
}

using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public interface IConfigurationService : IDisposable
{
    Task<Result<WorkFloConfiguration>> LoadConfigAsync();
    Task<Result<ValidationSettings>> GetValidationRulesAsync();
    Task<Result<TddSettings>> GetTddSettingsAsync();
    Task<Result<ApiSettings>> GetApiSettingsAsync();
}

public class WorkFloConfiguration
{
    public ApiSettings Api { get; set; } = new();
    public ValidationSettings Validation { get; set; } = new();
    public TddSettings Tdd { get; set; } = new();
}

public class ApiSettings
{
    public int Port { get; set; } = 5000;
    public bool EnableHttps { get; set; } = false;
}

public class ValidationSettings
{
    public bool EnableTdd { get; set; } = true;
    public bool EnableCommitMsg { get; set; } = true;
    public bool EnablePrePush { get; set; } = true;
}

public class TddSettings
{
    public bool EnforceTransitions { get; set; } = true;
    public bool AllowSkipPhases { get; set; } = false;
    public bool RequireTestFirst { get; set; } = true;
}

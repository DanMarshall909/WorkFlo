using System.Text.Json;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly string _configPath;
    private readonly SemaphoreSlim _configSemaphore = new(1, 1);
    private WorkFloConfiguration? _cachedConfig;
    private DateTime _lastConfigCheck = DateTime.MinValue;
    private readonly TimeSpan _cacheTimeout = TimeSpan.FromMinutes(5);

    public ConfigurationService(string configPath = ".workflo/config.json")
    {
        _configPath = configPath;
    }

    public async Task<Result<WorkFloConfiguration>> LoadConfigAsync()
    {
        if (_cachedConfig != null)
        {
            return Success(_cachedConfig);
        }

        try
        {
            if (!File.Exists(_configPath))
            {
                _cachedConfig = GetDefaultConfiguration();
                return Success(_cachedConfig);
            }

            string json = await File.ReadAllTextAsync(_configPath).ConfigureAwait(false);
            WorkFloConfiguration? config = JsonSerializer.Deserialize<WorkFloConfiguration>(json, GetJsonOptions());

            _cachedConfig = MergeWithDefaults(config ?? new WorkFloConfiguration());
            return Success(_cachedConfig);
        }
        catch (JsonException ex)
        {
            return Failure<WorkFloConfiguration>($"Invalid JSON in configuration file: {ex.Message}");
        }
        catch (Exception ex)
        {
            return Failure<WorkFloConfiguration>($"Failed to load configuration: {ex.Message}");
        }
    }

    public async Task<Result<ValidationSettings>> GetValidationRulesAsync()
    {
        Result<WorkFloConfiguration> configResult = await LoadConfigAsync().ConfigureAwait(false);
        if (configResult.IsFailure())
        {
            return Failure<ValidationSettings>(configResult.Error!);
        }

        return Success(configResult.Value!.Validation);
    }

    public async Task<Result<TddSettings>> GetTddSettingsAsync()
    {
        Result<WorkFloConfiguration> configResult = await LoadConfigAsync().ConfigureAwait(false);
        if (configResult.IsFailure())
        {
            return Failure<TddSettings>(configResult.Error!);
        }

        return Success(configResult.Value!.Tdd);
    }

    public async Task<Result<ApiSettings>> GetApiSettingsAsync()
    {
        Result<WorkFloConfiguration> configResult = await LoadConfigAsync().ConfigureAwait(false);
        if (configResult.IsFailure())
        {
            return Failure<ApiSettings>(configResult.Error!);
        }

        return Success(configResult.Value!.Api);
    }

    private static WorkFloConfiguration GetDefaultConfiguration()
    {
        return new WorkFloConfiguration
        {
            Api = new ApiSettings(),
            Validation = new ValidationSettings(),
            Tdd = new TddSettings()
        };
    }

    private static WorkFloConfiguration MergeWithDefaults(WorkFloConfiguration config)
    {
        WorkFloConfiguration defaults = GetDefaultConfiguration();

        config.Api ??= defaults.Api;
        config.Validation ??= defaults.Validation;
        config.Tdd ??= defaults.Tdd;

        return config;
    }

    private bool IsConfigStale()
    {
        return DateTime.UtcNow - _lastConfigCheck > _cacheTimeout;
    }

    private static JsonSerializerOptions GetJsonOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true
        };
    }

    public void Dispose()
    {
        _configSemaphore?.Dispose();
    }
}

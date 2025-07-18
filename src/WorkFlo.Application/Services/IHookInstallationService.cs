using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public interface IHookInstallationService
{
    Task<Result> InstallHooksAsync(bool force = false);
    Task<Result<bool>> AreHooksInstalledAsync();
}
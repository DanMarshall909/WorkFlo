namespace WorkFlo.Infrastructure.Data.Models.Identity;

public interface IMappableToDomain<TDomain> where TDomain : class
{
    TDomain ToDomain();
}

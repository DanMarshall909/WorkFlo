using System.Reflection;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Analyzer that enforces CQRS nested pattern conventions and provides metadata about commands/queries.
/// Can be used in unit tests or startup validation to ensure architectural compliance.
/// </summary>
public static class CQRSPatternAnalyzer
{
    /// <summary>
    /// Validates all commands and queries in an assembly follow the nested response pattern
    /// </summary>
    public static ValidationResult ValidateAssembly(Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(assembly);

        var issues = new List<string>();
        int commandsValidated = 0;
        int queriesValidated = 0;

        Type[] types = assembly.GetTypes();

        foreach (Type type in types)
        {
            if (IsCommand(type))
            {
                commandsValidated++;
                List<string> commandIssues = ValidateCommandStructure(type);
                issues.AddRange(commandIssues);
            }
            else if (IsQuery(type))
            {
                queriesValidated++;
                List<string> queryIssues = ValidateQueryStructure(type);
                issues.AddRange(queryIssues);
            }
        }

        return new()
        {
            IsValid = issues.Count == 0,
            Issues = issues,
            CommandsValidated = commandsValidated,
            QueriesValidated = queriesValidated
        };
    }

    /// <summary>
    /// Gets metadata about all CQRS operations in an assembly
    /// </summary>
    public static CQRSMetadata GetMetadata(Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(assembly);

        var commands = new List<CommandMetadata>();
        var queries = new List<QueryMetadata>();

        Type[] types = assembly.GetTypes();

        foreach (Type type in types)
        {
            if (IsCommand(type))
            {
                commands.Add(ExtractCommandMetadata(type));
            }
            else if (IsQuery(type))
            {
                queries.Add(ExtractQueryMetadata(type));
            }
        }

        return new() { Commands = commands, Queries = queries, TotalOperations = commands.Count + queries.Count };
    }

    private static bool IsCommand(Type type)
    {
        return type.Name.StartsWith('C') &&
               type.GetInterfaces().Any(i => i.IsGenericType &&
                                             (i.GetGenericTypeDefinition().Name
                                                  .Contains("IRequest", StringComparison.Ordinal) ||
                                              i.GetGenericTypeDefinition().Name
                                                  .Contains("ICommand", StringComparison.Ordinal)));
    }

    private static bool IsQuery(Type type)
    {
        return type.Name.StartsWith('Q') &&
               type.GetInterfaces().Any(i => i.IsGenericType &&
                                             (i.GetGenericTypeDefinition().Name
                                                  .Contains("IRequest", StringComparison.Ordinal) ||
                                              i.GetGenericTypeDefinition().Name
                                                  .Contains("IQuery", StringComparison.Ordinal)));
    }

    private static List<string> ValidateCommandStructure(Type commandType)
    {
        var issues = new List<string>();

        // Check for Response nested type
        var responseTypes = commandType.GetNestedTypes()
            .Where(t => string.Equals(t.Name, "Response", StringComparison.Ordinal)).ToList();

        if (responseTypes.Count == 0)
        {
            issues.Add($"Command {commandType.Name} should have a nested 'Response' record");
        }
        else if (responseTypes.Count > 1)
        {
            issues.Add($"Command {commandType.Name} has multiple 'Response' types - should have exactly one");
        }
        else
        {
            Type responseType = responseTypes[0];
            if (!responseType.IsClass)
            {
                issues.Add($"Response type in {commandType.Name} should be a record or class");
            }
        }

        return issues;
    }

    private static List<string> ValidateQueryStructure(Type queryType)
    {
        var issues = new List<string>();

        // Similar validation for queries
        var responseTypes = queryType.GetNestedTypes()
            .Where(t => string.Equals(t.Name, "Response", StringComparison.Ordinal)).ToList();

        if (responseTypes.Count == 0)
        {
            issues.Add($"Query {queryType.Name} should have a nested 'Response' record");
        }

        return issues;
    }

    private static CommandMetadata ExtractCommandMetadata(Type commandType)
    {
        Type? responseType = Array.Find(commandType.GetNestedTypes(),
            t => string.Equals(t.Name, "Response", StringComparison.Ordinal));

        return new()
        {
            Name = commandType.Name,
            FullName = commandType.FullName ?? commandType.Name,
            ResponseType = responseType?.Name ?? "Unknown",
            Properties = commandType.GetProperties().Select(p => new PropertyMetadata
            {
                Name = p.Name,
                Type = p.PropertyType.Name,
                IsRequired =
                    p.GetCustomAttribute<System.ComponentModel.DataAnnotations.RequiredAttribute>() != null
            }).ToList()
        };
    }

    private static QueryMetadata ExtractQueryMetadata(Type queryType)
    {
        Type? responseType = Array.Find(queryType.GetNestedTypes(),
            t => string.Equals(t.Name, "Response", StringComparison.Ordinal));

        return new()
        {
            Name = queryType.Name,
            FullName = queryType.FullName ?? queryType.Name,
            ResponseType = responseType?.Name ?? "Unknown",
            Properties = queryType.GetProperties().Select(p => new PropertyMetadata
            {
                Name = p.Name,
                Type = p.PropertyType.Name,
                IsRequired =
                    p.GetCustomAttribute<System.ComponentModel.DataAnnotations.RequiredAttribute>() != null
            }).ToList()
        };
    }

    public record ValidationResult
    {
        public bool IsValid { get; init; }
        public List<string> Issues { get; init; } = [];
        public int CommandsValidated { get; init; }
        public int QueriesValidated { get; init; }
    }

    public record CQRSMetadata
    {
        public List<CommandMetadata> Commands { get; init; } = [];
        public List<QueryMetadata> Queries { get; init; } = [];
        public int TotalOperations { get; init; }
    }

    public record CommandMetadata
    {
        public string Name { get; init; } = string.Empty;
        public string FullName { get; init; } = string.Empty;
        public string ResponseType { get; init; } = string.Empty;
        public List<PropertyMetadata> Properties { get; init; } = [];
    }

    public record QueryMetadata
    {
        public string Name { get; init; } = string.Empty;
        public string FullName { get; init; } = string.Empty;
        public string ResponseType { get; init; } = string.Empty;
        public List<PropertyMetadata> Properties { get; init; } = [];
    }

    public record PropertyMetadata
    {
        public string Name { get; init; } = string.Empty;
        public string Type { get; init; } = string.Empty;
        public bool IsRequired { get; init; }
    }
}

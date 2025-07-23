using System.Reflection;
using System.Text.Json;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Extension methods that take advantage of the nested response pattern structure
/// </summary>
public static class CommandResponseExtensions
{
    /// <summary>
    /// Automatically maps command properties to response properties with matching names.
    /// Takes advantage of the fact that command and response are in the same type.
    /// </summary>
    public static TResponse MapToResponse<TCommand, TResponse>(this TCommand command,
        Action<TResponse>? configure = null)
        where TCommand : class
        where TResponse : class, new()
    {
        var response = new TResponse();

        // Get properties from both command and response
        PropertyInfo[] commandProperties = typeof(TCommand).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        PropertyInfo[] responseProperties =
            typeof(TResponse).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        // Map matching properties
        foreach (PropertyInfo? responseProp in responseProperties.Where(p => p.CanWrite))
        {
            PropertyInfo? commandProp = Array.Find(commandProperties, p =>
                string.Equals(p.Name, responseProp.Name, StringComparison.Ordinal) &&
                p.PropertyType == responseProp.PropertyType);

            if (commandProp != null)
            {
                object? value = commandProp.GetValue(command);
                responseProp.SetValue(response, value);
            }
        }

        // Allow additional configuration
        configure?.Invoke(response);

        return response;
    }

    /// <summary>
    /// Serializes command and response together for structured logging.
    /// Useful for audit trails and debugging.
    /// </summary>
    public static string ToStructuredLog<TCommand, TResponse>(this TCommand command, TResponse? response = null)
        where TCommand : class
        where TResponse : class
    {
        var logData = new
        {
            Command = new { Type = typeof(TCommand).Name, Data = command },
            Response = response != null ? new { Type = typeof(TResponse).Name, Data = response } : null,
            Timestamp = DateTime.UtcNow
        };

        return JsonSerializer.Serialize(logData,
            new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }

    /// <summary>
    /// Validates that a response type is properly nested within the command type.
    /// Enforces the architectural pattern at runtime.
    /// </summary>
    public static bool IsValidNestedResponse<TCommand, TResponse>()
        where TCommand : class
        where TResponse : class
    {
        Type commandType = typeof(TCommand);
        Type responseType = typeof(TResponse);

        // Check if response is nested within command
        return responseType.DeclaringType == commandType;
    }

    /// <summary>
    /// Gets all nested types within a command that could be responses.
    /// Useful for reflection-based frameworks.
    /// </summary>
    public static IEnumerable<Type> GetNestedResponseTypes<TCommand>()
        where TCommand : class
    {
        return typeof(TCommand)
            .GetNestedTypes(BindingFlags.Public)
            .Where(t => t.IsClass && (string.Equals(t.Name, "Response", StringComparison.Ordinal) ||
                                      t.Name.EndsWith("Response", StringComparison.Ordinal)));
    }

    /// <summary>
    /// Creates a factory method for creating responses with common fields pre-populated.
    /// Takes advantage of the nested pattern for better IntelliSense.
    /// </summary>
    public static Func<TResponse> CreateResponseFactory<TCommand, TResponse>(TCommand command)
        where TCommand : class
        where TResponse : class, new()
    {
        return () => command.MapToResponse<TCommand, TResponse>();
    }
}

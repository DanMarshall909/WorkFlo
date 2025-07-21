# WorkFlo MCP Integration with Claude

This guide shows how to integrate the WorkFlo MCP server with Claude Desktop for AI-powered workflow enforcement.

## Overview

WorkFlo implements the Model Context Protocol (MCP) to enable Claude to:
- Validate commit messages against conventional commit standards
- Enforce workflow policies through direct tool interaction
- Provide real-time development assistance with project context

## Prerequisites

- **Claude Desktop** installed and running
- **.NET 9.0** runtime installed
- **WorkFlo project** built successfully (`dotnet build`)

## Integration Steps

### 1. Create MCP Server Executable

First, create a standalone executable for the MCP server:

```bash
# Build the MCP server
dotnet build src/WorkFlo.Api/WorkFlo.Api.csproj -c Release

# Create MCP server entry point (see below)
```

### 2. Configure Claude Desktop

Add WorkFlo MCP server to Claude Desktop configuration:

**Location**: `%APPDATA%/Claude/claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "workflo": {
      "command": "dotnet",
      "args": [
        "run",
        "--project",
        "C:/path/to/WorkFlo/src/WorkFlo.Api/WorkFlo.Api.csproj",
        "--",
        "mcp"
      ],
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

**Replace `C:/path/to/WorkFlo`** with your actual WorkFlo project path.

### 3. Add MCP Entry Point to WorkFlo API

The MCP server needs a command-line entry point. Add this to your API project:

```csharp
// In Program.cs or separate MCP entry point
public static class McpProgram 
{
    public static async Task RunMcpServer()
    {
        var server = new McpServer(Console.In, Console.Out);
        await server.StartAsync(CancellationToken.None);
    }
}
```

### 4. Restart Claude Desktop

Close and restart Claude Desktop to load the new MCP configuration.

## Available Tools

Once integrated, Claude will have access to these WorkFlo tools:

### `commit_validation`
Validates commit messages against conventional commit format.

**Parameters:**
- `message` (string): The commit message to validate

**Example Claude usage:**
```
"Can you validate this commit message: 'fix: resolve authentication bug'"
```

**Response:**
```
Valid: true
Message: ✅ Valid conventional commit format
```

### Future Tools (Extensible)
- Code style validation
- Branch naming enforcement  
- File size limits
- Custom workflow rules

## Testing the Integration

### 1. Verify Connection
Start a new chat with Claude and ask:
```
"Do you have access to WorkFlo tools?"
```

Claude should respond indicating it has access to commit validation tools.

### 2. Test Commit Validation
Ask Claude:
```
"Please validate this commit message: 'feat: add user authentication'"
```

### 3. Test Invalid Commit
Ask Claude:
```
"Please validate this commit message: 'added new feature'"
```

Claude should identify this as invalid and suggest the correct format.

## Troubleshooting

### MCP Server Not Connecting

1. **Check Configuration Path**:
   - Ensure the path to WorkFlo.Api.csproj is absolute and correct
   - Use forward slashes (/) even on Windows in JSON

2. **Verify .NET Installation**:
   ```bash
   dotnet --version  # Should show 9.0.x
   ```

3. **Test MCP Server Manually**:
   ```bash
   cd /path/to/WorkFlo
   dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj -- mcp
   ```
   
   Then type: `{"jsonrpc": "2.0", "id": 1, "method": "initialize"}`

### Claude Not Recognizing Tools

1. **Check Claude Desktop Logs**:
   - Windows: `%APPDATA%/Claude/logs/`
   - macOS: `~/Library/Logs/Claude/`

2. **Restart Claude Desktop** completely (exit from system tray)

3. **Verify JSON Configuration** is valid (use JSON validator)

### Permission Issues

Ensure Claude Desktop has permission to execute dotnet and access the WorkFlo directory.

## Advanced Configuration

### Custom Environment Variables

Add project-specific environment variables:

```json
{
  "mcpServers": {
    "workflo": {
      "command": "dotnet",
      "args": ["run", "--project", "/path/to/WorkFlo/src/WorkFlo.Api/WorkFlo.Api.csproj", "--", "mcp"],
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "WORKFLO_LOG_LEVEL": "Information",
        "WORKFLO_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

### Multiple Projects

You can configure multiple WorkFlo instances for different projects:

```json
{
  "mcpServers": {
    "workflo-project1": {
      "command": "dotnet",
      "args": ["run", "--project", "/path/to/project1/WorkFlo/src/WorkFlo.Api/WorkFlo.Api.csproj", "--", "mcp"]
    },
    "workflo-project2": {
      "command": "dotnet",
      "args": ["run", "--project", "/path/to/project2/WorkFlo/src/WorkFlo.Api/WorkFlo.Api.csproj", "--", "mcp"]
    }
  }
}
```

## Usage Examples

### Commit Message Validation
```
User: "I want to commit my changes. Can you check if 'fix authentication bug' is a good commit message?"

Claude: "I'll validate that commit message for you."
[Uses commit_validation tool]
"That commit message is invalid. It should follow conventional commit format. Here's the corrected version: 'fix: resolve authentication bug'"
```

### Workflow Guidance
```
User: "What's the correct format for a feature commit?"

Claude: "Let me validate some examples to show you the correct format."
[Uses commit_validation tool with examples]
"The correct format is 'feat: description'. For example: 'feat: add user login page'"
```

## Next Steps

1. **Test the Integration** with sample commit messages
2. **Customize Tools** by extending the McpToolRegistry
3. **Add Project Context** by implementing project-specific validation rules
4. **Monitor Usage** through logs and feedback

This integration enables Claude to actively participate in your development workflow, providing real-time validation and guidance while maintaining the quality standards defined in WorkFlo.
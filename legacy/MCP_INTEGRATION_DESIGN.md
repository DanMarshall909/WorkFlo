# WorkFlo MCP Integration Design

## Overview
This document outlines the design for integrating Model Context Protocol (MCP) into WorkFlo to enable AI agent interactions for commit validation, workflow pattern queries, and improvement suggestions.

## MCP Server Architecture

### 1. Core MCP Components

#### MCP Server (`src/WorkFlo.Api/Mcp/`)
- **McpServer.cs** - Main MCP server implementation using JSON-RPC 2.0
- **McpTransport.cs** - Transport layer (STDIO and HTTP support)
- **McpCapabilities.cs** - Server capability registration and discovery

#### JSON-RPC Message Handling
- **McpJsonRpcHandler.cs** - Core JSON-RPC 2.0 message processing
- **McpRequestRouter.cs** - Route requests to appropriate handlers
- **McpResponseBuilder.cs** - Build standardized JSON-RPC responses

### 2. MCP Capabilities Implementation

#### Tools (AI can execute functions)
```csharp
// src/WorkFlo.Api/Mcp/Tools/
- ICommitValidationTool.cs
- IWorkflowPatternTool.cs
- IImprovementSuggestionTool.cs
- CommitValidationTool.cs
- WorkflowPatternTool.cs
- ImprovementSuggestionTool.cs
```

#### Resources (Contextual data access)
```csharp
// src/WorkFlo.Api/Mcp/Resources/
- IWorkflowDataResource.cs
- ICommitHistoryResource.cs
- WorkflowDataResource.cs
- CommitHistoryResource.cs
```

#### Prompts (Templated AI workflows)
```csharp
// src/WorkFlo.Api/Mcp/Prompts/
- IWorkflowPromptProvider.cs
- WorkflowPromptProvider.cs
```

## 3. JSON-RPC Endpoints Specification

### Initialization and Discovery

#### `initialize` - Server Initialization
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "roots": [{ "uri": "file:///path/to/repo" }]
    },
    "clientInfo": {
      "name": "claude-code",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "serverInfo": {
      "name": "workflo-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

#### `tools/list` - Discover Available Tools
**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "validate_commit",
        "description": "Validate a git commit against WorkFlo rules",
        "inputSchema": {
          "type": "object",
          "properties": {
            "commitMessage": { "type": "string" },
            "branch": { "type": "string" },
            "changedFiles": { 
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["commitMessage"]
        }
      },
      {
        "name": "query_workflow_patterns",
        "description": "Query workflow patterns and statistics",
        "inputSchema": {
          "type": "object",
          "properties": {
            "timeRange": { "type": "string", "enum": ["day", "week", "month"] },
            "pattern": { "type": "string" }
          }
        }
      },
      {
        "name": "suggest_improvements",
        "description": "Get improvement suggestions for workflow",
        "inputSchema": {
          "type": "object",
          "properties": {
            "context": { "type": "string" },
            "area": { "type": "string", "enum": ["commits", "hooks", "rules"] }
          }
        }
      }
    ]
  }
}
```

### Tool Execution

#### `tools/call` - Execute Tool
**Request Example - Commit Validation:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "validate_commit",
    "arguments": {
      "commitMessage": "feat: add new MCP integration",
      "branch": "feature/mcp-integration",
      "changedFiles": ["src/WorkFlo.Api/Mcp/McpServer.cs"]
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Commit validation passed\\n\\nValidation Results:\\n- Conventional commit format: ✅ Valid\\n- Branch naming: ✅ Valid (feature/ prefix)\\n- File count: ✅ 1 file (within limit)\\n\\nRecommendations:\\n- Consider adding tests for new MCP functionality"
      }
    ],
    "isError": false
  }
}
```

### Resource Access

#### `resources/list` - Discover Available Resources
**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resources": [
      {
        "uri": "workflo://workflow-data",
        "name": "Workflow Statistics",
        "description": "Access to workflow statistics and patterns",
        "mimeType": "application/json"
      },
      {
        "uri": "workflo://commit-history",
        "name": "Commit History",
        "description": "Repository commit history and analysis",
        "mimeType": "application/json"
      }
    ]
  }
}
```

#### `resources/read` - Read Resource
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "resources/read",
  "params": {
    "uri": "workflo://workflow-data?timeRange=week"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "contents": [
      {
        "uri": "workflo://workflow-data?timeRange=week",
        "mimeType": "application/json",
        "text": "{\"totalCommits\": 45, \"failedValidations\": 3, \"mostCommonIssues\": [\"file count exceeded\", \"branch naming\"]}"
      }
    ]
  }
}
```

### Prompts

#### `prompts/list` - Discover Available Prompts
**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "prompts": [
      {
        "name": "analyze_commit_patterns",
        "description": "Analyze commit patterns for improvement opportunities",
        "arguments": [
          {
            "name": "timeframe",
            "description": "Analysis timeframe",
            "required": false
          }
        ]
      },
      {
        "name": "suggest_workflow_improvements",
        "description": "Generate workflow improvement suggestions",
        "arguments": [
          {
            "name": "focus_area",
            "description": "Specific area to focus improvements on",
            "required": false
          }
        ]
      }
    ]
  }
}
```

## 4. Integration with Existing WorkFlo Components

### Validation Service Integration
```csharp
// Leverage existing validation services
- ICommitValidationService (already exists)
- Domain rules: BranchRule, ConventionalCommitRule, FileCountRule
- Validation endpoints: CommitMsgValidationEndpoint, etc.
```

### Domain Event Integration
```csharp
// Publish MCP events for analytics
- McpToolExecutedEvent
- McpResourceAccessedEvent
- McpValidationPerformedEvent
```

### Security and Authentication
```csharp
// MCP Security Layer
- McpAuthenticationMiddleware
- McpAuthorizationHandler
- Rate limiting for MCP requests
- API key validation for remote clients
```

## 5. Transport Layer Support

### STDIO Transport (Local AI Agents)
- Process communication via stdin/stdout
- Ideal for local development tools like Claude Code

### HTTP Transport (Remote AI Agents)
- REST-like endpoint: `/api/mcp/`
- WebSocket support for real-time communication
- OAuth 2.1 authentication for remote access

## 6. Implementation Phases

### Phase 1: Core Infrastructure
1. ✅ Design MCP integration architecture
2. ⏳ Implement JSON-RPC 2.0 message handling
3. ⏳ Create basic MCP server with STDIO transport
4. ⏳ Add tool discovery and execution framework

### Phase 2: Commit Validation Tool
1. ⏳ Implement commit validation tool
2. ⏳ Integrate with existing validation services
3. ⏳ Add comprehensive error handling
4. ⏳ Create tests for commit validation MCP tool

### Phase 3: Workflow Analytics
1. ⏳ Implement workflow pattern query tool
2. ⏳ Create workflow data resource provider
3. ⏳ Add commit history resource access
4. ⏳ Build analytics and reporting capabilities

### Phase 4: AI Suggestions
1. ⏳ Implement improvement suggestion tool
2. ⏳ Create workflow analysis prompts
3. ⏳ Add machine learning suggestions
4. ⏳ Build feedback loop for suggestion quality

### Phase 5: Production Features
1. ⏳ Add HTTP transport layer
2. ⏳ Implement authentication and authorization
3. ⏳ Add rate limiting and security features
4. ⏳ Create comprehensive documentation

## 7. File Structure

```
src/WorkFlo.Api/
├── Mcp/
│   ├── Configuration/
│   │   ├── McpServiceExtensions.cs
│   │   └── McpOptions.cs
│   ├── Core/
│   │   ├── McpServer.cs
│   │   ├── McpJsonRpcHandler.cs
│   │   ├── McpRequestRouter.cs
│   │   ├── McpResponseBuilder.cs
│   │   └── McpCapabilities.cs
│   ├── Transport/
│   │   ├── ITransport.cs
│   │   ├── StdioTransport.cs
│   │   └── HttpTransport.cs
│   ├── Tools/
│   │   ├── ICommitValidationTool.cs
│   │   ├── CommitValidationTool.cs
│   │   ├── IWorkflowPatternTool.cs
│   │   ├── WorkflowPatternTool.cs
│   │   ├── IImprovementSuggestionTool.cs
│   │   └── ImprovementSuggestionTool.cs
│   ├── Resources/
│   │   ├── IWorkflowDataResource.cs
│   │   ├── WorkflowDataResource.cs
│   │   ├── ICommitHistoryResource.cs
│   │   └── CommitHistoryResource.cs
│   ├── Prompts/
│   │   ├── IWorkflowPromptProvider.cs
│   │   └── WorkflowPromptProvider.cs
│   ├── Security/
│   │   ├── McpAuthenticationMiddleware.cs
│   │   └── McpAuthorizationHandler.cs
│   └── Models/
│       ├── McpRequest.cs
│       ├── McpResponse.cs
│       ├── McpError.cs
│       ├── ToolDefinition.cs
│       ├── ResourceDefinition.cs
│       └── PromptDefinition.cs
```

## 8. Testing Strategy

### Unit Tests
- JSON-RPC message handling
- Tool execution logic
- Resource access permissions
- Prompt generation

### Integration Tests
- End-to-end MCP communication
- Validation service integration
- Transport layer functionality
- Authentication flows

### AI Agent Tests
- Claude Code integration testing
- Real-world commit validation scenarios
- Performance under load
- Error handling and recovery

## 9. Documentation and Examples

### AI Agent Usage Examples
```bash
# Claude Code using MCP to validate commits
workflo mcp validate-commit "feat: add new feature" --branch="feature/new-feature"

# Query workflow patterns
workflo mcp query-patterns --time-range=week --pattern="failed-validations"

# Get improvement suggestions
workflo mcp suggest-improvements --area=commits --context="high-failure-rate"
```

### Integration with Claude Code
- Add MCP server configuration to Claude Code
- Enable WorkFlo validation in AI-assisted development
- Provide real-time feedback during commit creation

## 10. Success Metrics

### Technical Metrics
- MCP response time < 100ms for validation
- 99.9% uptime for MCP server
- Zero security vulnerabilities in MCP layer

### User Experience Metrics
- AI agents successfully validate 95%+ of commits
- Improvement suggestions lead to measurable workflow gains
- Developer adoption rate of MCP-enabled tools

### Business Impact
- Reduced failed commits by 80%
- Improved code quality scores
- Faster development velocity with AI assistance
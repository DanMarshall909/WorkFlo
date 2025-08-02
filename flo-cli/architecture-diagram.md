# WorkFlo Auto-CLI Architecture Class Diagram

```mermaid
classDiagram
    %% Core Interfaces
    class AutoCommandHandler {
        <<interface>>
        +canHandle(options: AutoCommandOptions) boolean
        +execute(issueNumber: number, options: AutoCommandOptions) Promise~CommandResult~
    }

    class CommandResult {
        <<interface>>
        +success: boolean
        +message: string
        +data?: any
        +error?: string
        +details?: string[]
    }

    class AutoCommandOptions {
        <<interface>>
        +status?: boolean
        +parseOnly?: boolean
        +initSession?: boolean
        +redPhase?: boolean
        +initState?: boolean
        +executePhases?: boolean
        +executeRed?: boolean
        +sequential?: boolean
        +checkSequential?: boolean
        +orchestrator?: boolean
        +delegateOrchestrator?: boolean
        +compatibility?: boolean
        +tddIntegration?: boolean
        +json?: boolean
    }

    %% Command Router
    class CommandRouter {
        -handlers: AutoCommandHandler[]
        +route(issueNumber: number, options: AutoCommandOptions) Promise~CommandResult~
        -findHandler(options: AutoCommandOptions) AutoCommandHandler
    }

    %% Concrete Command Handlers
    class StatusCommandHandler {
        +canHandle(options: AutoCommandOptions) boolean
        +execute(issueNumber: number, options: AutoCommandOptions) Promise~CommandResult~
        -checkWorkflowState() Promise~AutoWorkflowState~
        -formatStatusOutput(state: AutoWorkflowState) CommandResult
    }

    class ParseOnlyCommandHandler {
        +canHandle(options: AutoCommandOptions) boolean
        +execute(issueNumber: number, options: AutoCommandOptions) Promise~CommandResult~
        -fetchGitHubIssue(issueNumber: string) Object
        -parseAcceptanceCriteria(body: string) string[]
        -formatParseOutput(criteria: string[], issueNumber: number) CommandResult
    }

    class InitSessionCommandHandler {
        +canHandle(options: AutoCommandOptions) boolean
        +execute(issueNumber: number, options: AutoCommandOptions) Promise~CommandResult~
        -executeTddScript(issueNumber: number) void
        -formatInitOutput(issueNumber: number) CommandResult
    }

    %% State Management
    class AutoWorkflowStateService {
        -stateManager: StateManager
        +getCurrentState() Promise~AutoWorkflowState~
        +initializeState(issue: number, totalACs: number) Promise~void~
        +updateState(updates: Partial~AutoWorkflowState~) Promise~void~
        +clearState() Promise~void~
    }

    class FileSystemStateManager {
        -stateFile: string
        +save(state: AutoWorkflowState) Promise~void~
        +load() Promise~AutoWorkflowState~
        +exists() Promise~boolean~
        +clear() Promise~void~
        -validateState(state: any) boolean
        -handleCorruption() Promise~void~
    }

    class StateManager {
        <<interface>>
        +save(state: AutoWorkflowState) Promise~void~
        +load() Promise~AutoWorkflowState~
        +exists() Promise~boolean~
        +clear() Promise~void~
    }

    class AutoWorkflowState {
        <<interface>>
        +issue: number
        +totalACs: number
        +currentAC: number
        +currentPhase: string
        +status: string
        +createdAt: string
        +updatedAt: string
    }

    %% CLI Entry Point
    class CLI {
        +main(args: string[]) void
        -setupCommands() void
        -handleAutoCommand(issue: string, options: AutoCommandOptions) Promise~void~
        -validateIssueNumber(issue: string) number
        -outputResult(result: CommandResult, options: AutoCommandOptions) void
    }

    %% Utility Functions
    class OutputFormatter {
        <<utility>>
        +outputResult(data: CommandResult, options: AutoCommandOptions) void
        +formatHumanReadable(data: CommandResult) string
        +formatJSON(data: CommandResult) string
    }

    class GitHubClient {
        <<utility>>
        +fetchIssue(issueNumber: string, fields: string) Object
        +updateIssue(issueNumber: number, body: string) Promise~Object~
        -executeCommand(command: string) string
        -handleAPIErrors(error: Error) void
    }

    class AcceptanceCriteriaParser {
        <<utility>>
        +parseAcceptanceCriteria(issueBody: string) string[]
        -extractCriteriaLines(body: string) string[]
        -validateCriteriaFormat(line: string) boolean
    }

    %% Test Support Classes
    class TestHelper {
        <<test>>
        +cleanupTestState() void
        +mockGitHubCLI(issueNumber: number, responseData: any) void
        +executeCLI(command: string, expectError: boolean) string
    }

    class MockGitHubClient {
        <<test>>
        +fetchIssue(issueNumber: string) Object
        +setResponse(issueNumber: string, response: Object) void
    }

    %% Relationships
    AutoCommandHandler <|.. StatusCommandHandler : implements
    AutoCommandHandler <|.. ParseOnlyCommandHandler : implements
    AutoCommandHandler <|.. InitSessionCommandHandler : implements
    
    CommandRouter o-- AutoCommandHandler : contains
    CommandRouter ..> CommandResult : creates
    CommandRouter ..> AutoCommandOptions : uses

    StatusCommandHandler ..> AutoWorkflowStateService : uses
    StatusCommandHandler ..> CommandResult : creates

    ParseOnlyCommandHandler ..> GitHubClient : uses
    ParseOnlyCommandHandler ..> AcceptanceCriteriaParser : uses
    ParseOnlyCommandHandler ..> CommandResult : creates

    InitSessionCommandHandler ..> CommandResult : creates

    AutoWorkflowStateService o-- StateManager : uses
    StateManager <|.. FileSystemStateManager : implements
    FileSystemStateManager ..> AutoWorkflowState : persists

    CLI ..> CommandRouter : uses
    CLI ..> OutputFormatter : uses
    CLI ..> AutoCommandOptions : creates

    OutputFormatter ..> CommandResult : formats

    %% Composition relationships
    CLI *-- CommandRouter : owns
    CommandRouter *-- StatusCommandHandler : owns
    CommandRouter *-- ParseOnlyCommandHandler : owns
    CommandRouter *-- InitSessionCommandHandler : owns
    AutoWorkflowStateService *-- FileSystemStateManager : owns

    %% Data flow annotations
    class DataFlow {
        <<note>>
        User Input → CLI → CommandRouter → Handler → External Services → CommandResult → OutputFormatter → Console
    }

    %% Error handling chain
    class ErrorHandling {
        <<note>>
        Corrupted State → FileSystemStateManager.handleCorruption() → AutoWorkflowStateService.clearState()
        Network Errors → GitHubClient.handleAPIErrors() → CommandResult.error
        Invalid Commands → CommandRouter → CommandResult.error
    }
```

## Key Architecture Patterns

### 1. **Command Pattern**
- `AutoCommandHandler` interface defines command contract
- Concrete handlers (`StatusCommandHandler`, etc.) implement specific logic
- `CommandRouter` acts as invoker, dispatching to appropriate handler

### 2. **Strategy Pattern**
- `StateManager` interface allows different storage strategies
- `FileSystemStateManager` implements file-based persistence
- Easy to add database or cloud storage implementations

### 3. **Chain of Responsibility**
- `CommandRouter` iterates through handlers until one can handle the request
- Handlers use `canHandle()` to determine if they should process the command

### 4. **Template Method**
- Common command execution flow defined in `AutoCommandHandler`
- Concrete handlers implement specific steps while following the template

### 5. **Dependency Injection**
- Handlers receive dependencies (state service, GitHub client) rather than creating them
- Enables easy testing and configuration

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant CommandRouter
    participant Handler
    participant StateService
    participant GitHubClient
    participant OutputFormatter

    User->>CLI: flo-cli auto 250 --status --json
    CLI->>CLI: validateIssueNumber(250)
    CLI->>CommandRouter: route(250, {status: true, json: true})
    CommandRouter->>StatusCommandHandler: canHandle({status: true})
    StatusCommandHandler->>CommandRouter: true
    CommandRouter->>StatusCommandHandler: execute(250, options)
    StatusCommandHandler->>StateService: getCurrentState()
    StateService->>StateService: load from filesystem
    StateService->>StatusCommandHandler: AutoWorkflowState | null
    StatusCommandHandler->>CommandRouter: CommandResult
    CommandRouter->>CLI: CommandResult
    CLI->>OutputFormatter: outputResult(result, {json: true})
    OutputFormatter->>User: JSON formatted output
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Command Execution] --> B{Handler Found?}
    B -->|No| C[Return Error Result]
    B -->|Yes| D[Execute Handler]
    D --> E{External Call Success?}
    E -->|No| F[Catch Exception]
    F --> G[Create Error Result]
    E -->|Yes| H[Create Success Result]
    G --> I[Output Error]
    H --> J[Output Success]
    I --> K[Exit with Code 1]
    J --> L[Exit with Code 0]

    %% State corruption handling
    D --> M{State File Corrupt?}
    M -->|Yes| N[Log Warning]
    N --> O[Clear Corrupted State]
    O --> P[Return No Active State]
    M -->|No| H
```

This architecture provides:

🏗️ **Scalability**: Easy to add new commands without modifying existing code
🔧 **Maintainability**: Clear separation of concerns and single responsibility
🧪 **Testability**: Each component can be unit tested independently  
🛡️ **Reliability**: Comprehensive error handling and state corruption recovery
📊 **Flexibility**: Dual output modes (human/JSON) for different use cases
🚀 **Extensibility**: Plugin-like architecture for future enhancements
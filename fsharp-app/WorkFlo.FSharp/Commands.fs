/// F# Learning Module 3: Pattern Matching vs If/Switch Statements
/// 
/// TypeScript had: if (command === 'start') ... else if (command === 'red') ...
/// F# uses pattern matching - the compiler ensures we handle ALL cases!
module WorkFlo.Commands

open WorkFlo.Types
open WorkFlo.Core

/// Lesson 12: Command as a Discriminated Union
/// TypeScript: string literals that could be mistyped
/// F# DU: Compile-time safety - impossible to have invalid commands!
type Command = 
    | Start of issue: string
    | Red
    | Green  
    | Refactor
    | Cover
    | Next
    | Status
    | Help

/// Lesson 13: Pattern matching for command dispatching  
/// TypeScript switch/if chains vs F# exhaustive pattern matching
/// The compiler FORCES you to handle every case - no bugs from forgotten commands!
let executeCommand (cmd: Command) (context: Context) : Result<string, string> =
    match cmd with
    | Start issue -> 
        // Function composition: validate >> create >> save >> format
        validateIssueNumber issue
        |> Result.bind (fun validIssue ->
            let newState = { Issue = string validIssue; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
            saveState context.StateFile newState
            |> Result.map (fun _ -> $"🚀 Started TDD workflow for issue {validIssue}\n📋 Current: Criteria 1/3 - START phase"))
    
    | Red -> 
        // Lesson 30: State-based command execution with function composition
        loadState context.StateFile
        |> Result.bind (function
            | Some state when state.Phase = WorkFlo.Types.Start ->
                let updatedState = { state with Phase = WorkFlo.Types.Red }
                saveState context.StateFile updatedState
                |> Result.map (fun _ -> $"🔴 RED Phase - Write failing test for issue {state.Issue}\n📋 Criteria {state.Criteria}/{state.Total}")
            | Some state -> Error $"Cannot transition to RED from {state.Phase} phase"
            | None -> Error "No active TDD session. Use 'start <issue>' first.")
        
    | Green -> 
        loadState context.StateFile
        |> Result.bind (function
            | Some state when state.Phase = WorkFlo.Types.Red ->
                let updatedState = { state with Phase = WorkFlo.Types.Green }
                saveState context.StateFile updatedState
                |> Result.map (fun _ -> $"🟢 GREEN Phase - Minimal implementation for issue {state.Issue}\n📋 Criteria {state.Criteria}/{state.Total}")
            | Some state -> Error $"Cannot transition to GREEN from {state.Phase} phase"
            | None -> Error "No active TDD session. Use 'start <issue>' first.")
        
    | Refactor -> 
        loadState context.StateFile
        |> Result.bind (function
            | Some state when state.Phase = WorkFlo.Types.Green ->
                let updatedState = { state with Phase = WorkFlo.Types.Refactor }
                saveState context.StateFile updatedState
                |> Result.map (fun _ -> $"🔵 REFACTOR Phase - Improve code quality for issue {state.Issue}\n📋 Criteria {state.Criteria}/{state.Total}")
            | Some state -> Error $"Cannot transition to REFACTOR from {state.Phase} phase"
            | None -> Error "No active TDD session. Use 'start <issue>' first.")
        
    | Cover -> 
        loadState context.StateFile
        |> Result.bind (function
            | Some state when state.Phase = WorkFlo.Types.Refactor ->
                let updatedState = { state with Phase = WorkFlo.Types.Cover }
                saveState context.StateFile updatedState
                |> Result.map (fun _ -> $"🟣 COVER Phase - Comprehensive test coverage for issue {state.Issue}\n📋 Criteria {state.Criteria}/{state.Total}")
            | Some state -> Error $"Cannot transition to COVER from {state.Phase} phase"
            | None -> Error "No active TDD session. Use 'start <issue>' first.")
        
    | Next -> 
        loadState context.StateFile
        |> Result.bind (function
            | Some state when state.Phase = WorkFlo.Types.Cover ->
                let nextState = nextCriteria state
                if nextState.Criteria <= nextState.Total then
                    saveState context.StateFile nextState
                    |> Result.map (fun _ -> $"✅ Criteria {state.Criteria} completed!\n🆕 Moving to criteria {nextState.Criteria}/{nextState.Total} - START phase")
                else
                    Ok $"🎉 All criteria completed for issue {state.Issue}! TDD cycle finished."
            | Some state -> Error $"Cannot advance criteria from {state.Phase} phase. Complete COVER phase first."
            | None -> Error "No active TDD session. Use 'start <issue>' first.")
        
    | Status -> 
        loadState context.StateFile
        |> Result.map (function
            | Some state -> 
                $"📊 TDD Session Status\n🎯 Issue: {state.Issue}\n📋 Criteria: {state.Criteria}/{state.Total}\n🔄 Phase: {state.Phase}\n\n💡 Use 'help' for available commands"
            | None -> "📊 No active TDD session\n🚀 Use 'start <issue>' to begin")
        
    | Help -> 
        Ok """WorkFlo TDD Commands Help

🚀 start <issue>  - Start TDD workflow for an issue
🔴 red           - Write failing test (RED phase)  
🟢 green         - Minimal implementation (GREEN phase)
🔵 refactor      - Improve code quality (REFACTOR phase)
🟣 cover         - Comprehensive coverage (COVER phase)
➡️  next          - Move to next acceptance criteria
📊 status        - Show current TDD session status
❓ help          - Show this help message

📖 F# Learning: Each command demonstrates functional programming concepts!
   - Immutable state transitions
   - Result-based error handling  
   - Pattern matching for all cases
   - Function composition pipelines"""
    // Compiler Error if we miss any case! Try commenting out Help and see what happens.

/// Lesson 14: Parsing strings to Commands with pattern matching
/// TypeScript: lots of if/else or switch statements
/// F# active patterns or simple matching - much cleaner!
let parseCommand (commandStr: string) (args: string[]) : Result<Command, string> =
    match commandStr.ToLower() with
    | "start" when args.Length > 0 -> Ok (Start args.[0])
    | "start" -> Error "Usage: start <issue_number>"
    | "red" -> Ok Red
    | "green" -> Ok Green  
    | "refactor" -> Ok Refactor
    | "cover" -> Ok Cover
    | "next" -> Ok Next
    | "status" -> Ok Status
    | "help" -> Ok Help
    | unknown -> Error $"Unknown command: {unknown}"

/// Lesson 15: Combining parsing and execution with the pipe operator
/// TypeScript: nested function calls or variable assignments
/// F# pipe: data flows left-to-right, easy to read!
let processCommand (commandStr: string) (args: string[]) (context: Context) : Result<string, string> =
    parseCommand commandStr args       // Parse the command
    |> Result.bind (fun cmd ->         // If parsing succeeded, execute it
        executeCommand cmd context)    // Chain the operations together

/// TRY THIS IN F# INTERACTIVE:
/// 
/// let ctx = { ConfigFile = ".config"; StateFile = ".state"; ScoreFile = ".scores"; Debug = false; Verbose = false }
/// 
/// processCommand "start" [|"123"|] ctx    // Returns: Ok "Starting TDD workflow for issue 123"
/// processCommand "red" [||] ctx           // Returns: Ok "🔴 RED Phase - Write failing test"  
/// processCommand "invalid" [||] ctx       // Returns: Error "Unknown command: invalid"
/// processCommand "start" [||] ctx         // Returns: Error "Usage: start <issue_number>"
/// 
/// Notice: The pipe operator |> makes the data flow clear!
/// parseCommand result "flows into" the bind function
/// No nested parentheses or temporary variables needed!
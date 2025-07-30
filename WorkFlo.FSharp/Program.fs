/// WorkFlo F# Application Entry Point
/// 
/// This module provides the main entry point for the WorkFlo TDD workflow system
module WorkFlo.Program

open WorkFlo.Domain
open WorkFlo.CoreServices
open WorkFlo.Railway
open WorkFlo.Railway.Operators
open WorkFlo.Railway.Builders

/// Application configuration
let createAppConfig () : AppConfig = {
    ConfigFile = ".workflo-config"
    StateFile = ".tdd-state" 
    ScoreFile = ".tdd-scores"
    Debug = System.Environment.GetEnvironmentVariable("TDD_DEBUG") = "1"
    Verbose = System.Environment.GetEnvironmentVariable("TDD_VERBOSE") = "1"
}

/// Parse command line arguments
let parseArgs (args: string[]) : Result<WorkFloCommand, WorkFloError> =
    match args with
    | [||] -> Ok Help
    | [| cmd |] -> CommandService.parseCommand cmd [||]
    | args -> CommandService.parseCommand args.[0] args.[1..]

/// Main application logic
let runApp (args: string[]) : Result<string, WorkFloError> =
    let config = createAppConfig ()
    
    result {
        let! command = parseArgs args
        let! currentState = StatePersistence.loadStateOrDefault config.StateFile
        let! (newState, message) = WorkflowService.executeCommand config currentState command
        return message
    }

/// Format error message for display
let formatError (error: WorkFloError) : string =
    match error with
    | ValidationError (field, message) -> $"Validation Error in {field}: {message}"
    | FileError (operation, path, message) -> $"File Error ({operation}) on {path}: {message}"
    | StateTransitionError (fromState, toState, reason) -> $"Invalid transition from {fromState} to {toState}: {reason}"
    | ParseError (content, message) -> $"Parse Error: {message}"
    | BusinessRuleViolation (rule, context) -> $"Business Rule Violation ({rule}): {context}"

/// Main entry point
[<EntryPoint>]
let main (args: string[]) : int =
    match runApp args with
    | Ok message -> 
        printfn "%s" message
        0
    | Error error -> 
        eprintfn "%s" (formatError error)
        1
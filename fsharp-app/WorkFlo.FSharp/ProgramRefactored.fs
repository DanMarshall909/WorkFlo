/// Main Program Module - Clean Architecture Entry Point
/// 
/// This module implements the application entry point using
/// functional composition and dependency injection patterns
namespace WorkFlo

open WorkFlo.Domain
open WorkFlo.Railway
open WorkFlo.Railway.Operators
open WorkFlo.CoreServices

/// Application startup and configuration
module Application =
    /// Create default application configuration
    let createDefaultConfig () : AppConfig = {
        ConfigFile = ".workflo"
        StateFile = ".workflo.state"
        ScoreFile = ".workflo.scores"
        Debug = false
        Verbose = false
    }
    
    /// Parse command line arguments into application config
    let parseConfigFromArgs (args: string array) : Result<AppConfig, WorkFloError> =
        let defaultConfig = createDefaultConfig ()
        
        // Simple argument parsing - can be enhanced with a proper CLI library
        let rec parseArgs config argList =
            match argList with
            | [] -> Ok config
            | "--debug" :: rest -> 
                parseArgs { config with Debug = true } rest
            | "--verbose" :: rest ->
                parseArgs { config with Verbose = true } rest
            | "--state-file" :: path :: rest ->
                parseArgs { config with StateFile = path } rest
            | "--config-file" :: path :: rest ->
                parseArgs { config with ConfigFile = path } rest
            | unknownArg :: _ ->
                Error (ValidationError("Arguments", $"Unknown argument: {unknownArg}"))
        
        parseArgs defaultConfig (Array.toList args)

/// Command Line Interface module
module CLI =
    /// Parse command and arguments from command line
    let parseCommandLine (args: string array) : Result<WorkFloCommand * AppConfig, WorkFloError> =
        if Array.isEmpty args then
            Error (ValidationError("Arguments", "No command provided. Use 'help' for usage information."))
        else
            let command = args.[0]
            let commandArgs = args.[1..]
            
            result {
                let! cmd = CommandService.parseCommand command commandArgs
                let! config = Application.parseConfigFromArgs commandArgs
                return (cmd, config)
            }
    
    /// Format error messages for user display
    let formatError (error: WorkFloError) : string =
        match error with
        | ValidationError (field, message) ->
            $"Validation Error in {field}: {message}"
        | FileError (operation, path, message) ->
            $"File Error during {operation} of '{path}': {message}"
        | StateTransitionError (from, to', reason) ->
            $"State Transition Error from {from} to {to'}: {reason}"
        | ParseError (content, message) ->
            $"Parse Error: {message}"
        | BusinessRuleViolation (rule, context) ->
            $"Business Rule Violation ({rule}): {context}"
    
    /// Display success message
    let displaySuccess (message: string) (config: AppConfig) =
        if config.Verbose then
            printfn "[SUCCESS] %s" message
        else
            printfn "%s" message
    
    /// Display error message  
    let displayError (error: WorkFloError) (config: AppConfig) =
        let errorMsg = formatError error
        if config.Debug then
            eprintfn "[ERROR] %s" errorMsg
            eprintfn "[DEBUG] Full error details: %A" error
        else
            eprintfn "Error: %s" errorMsg

/// Main application orchestration
module App =
    /// Run a single command
    let runCommand (config: AppConfig) (command: WorkFloCommand) : Result<string, WorkFloError> =
        result {
            let! currentState = StatePersistence.loadStateOrDefault config.StateFile
            let! (newState, message) = WorkflowService.executeCommand config currentState command
            
            // Save new state if it changed
            match newState with
            | Some state when state <> currentState ->
                do! StatePersistence.saveState config.StateFile state
            | _ -> ()
            
            return message
        }
    
    /// Main application entry point
    let run (args: string array) : int =
        match CLI.parseCommandLine args with
        | Ok (command, config) ->
            match runCommand config command with
            | Ok message ->
                CLI.displaySuccess message config
                0  // Success exit code
            | Error error ->
                CLI.displayError error config
                1  // Error exit code
        | Error error ->
            let defaultConfig = Application.createDefaultConfig ()
            CLI.displayError error defaultConfig
            1  // Error exit code

/// Legacy compatibility module for existing tests
module Program =
    /// Create context for backward compatibility
    let createContext () = Application.createDefaultConfig ()
    
    /// Parse arguments for backward compatibility
    let parseArgs (args: string array) : Result<WorkFloCommand, WorkFloError> =
        if Array.isEmpty args then
            Error (ValidationError("Arguments", "No arguments provided"))
        else
            CommandService.parseCommand args.[0] args.[1..]
    
    /// Run application for backward compatibility
    let runApp (args: string array) : int = App.run args
    
    /// Main entry point
    let main (args: string array) : int = App.run args
    
    /// Entry point for .NET runtime
    let entryPoint (args: string array) : int = main args

/// F# Entry Point
[<EntryPoint>]
let main args = Program.main args
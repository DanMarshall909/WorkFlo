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
        // Pattern matching extracted the issue value for us!
        Ok $"Starting TDD workflow for issue {issue}"
    
    | Red -> 
        Ok "🔴 RED Phase - Write failing test"
        
    | Green -> 
        Ok "🟢 GREEN Phase - Minimal implementation"
        
    | Refactor -> 
        Ok "🔵 REFACTOR Phase - Improve code quality"
        
    | Cover -> 
        Ok "🟣 COVER Phase - Comprehensive test coverage"
        
    | Next -> 
        Ok "Moving to next acceptance criteria"
        
    | Status -> 
        Ok "📊 TDD Session Status"
        
    | Help -> 
        Ok "WorkFlo TDD Commands Help"
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
/// F# Learning Module 4: Pure Main Function and Error Handling
/// 
/// TypeScript: process.argv parsing with lots of imperative code
/// F# approach: Pure functions, explicit error handling, functional composition
module WorkFlo.Program

open WorkFlo.Types
open WorkFlo.Core  
open WorkFlo.Commands

/// Lesson 16: Pure function for creating context
/// No hidden dependencies, no side effects - just data transformation
let createContext () : Context = {
    ConfigFile = ".workflo-config"
    StateFile = ".tdd-state" 
    ScoreFile = ".tdd-scores"
    Debug = System.Environment.GetEnvironmentVariable("TDD_DEBUG") = "1"
    Verbose = System.Environment.GetEnvironmentVariable("TDD_VERBOSE") = "1"
}

/// Lesson 17: Functional argument parsing
/// TypeScript: process.argv with imperative indexing  
/// F# approach: Pattern matching on arrays - safe and expressive
let parseArgs (args: string[]) : Result<string * string[], string> =
    match args with
    | [||] -> Error "No command provided. Use 'help' for usage information."
    | [| cmd |] -> Ok (cmd, [||])           // Command with no arguments
    | args -> Ok (args.[0], args.[1..])     // Command with arguments (array slice!)

/// Lesson 18: Composing the entire application as a pipeline
/// TypeScript: try/catch blocks, nested if statements
/// F# approach: Chain pure functions using Result.bind
let runApp (args: string[]) : Result<string, string> =
    let context = createContext ()
    
    parseArgs args                                    // Parse command line
    |> Result.bind (fun (cmd, cmdArgs) ->            // If parsing succeeded...
        processCommand cmd cmdArgs context)          // Process the command

/// Lesson 19: Handling Results in the main function
/// The ONLY place we deal with effects (printing, exit codes)
/// Everything else is pure functions returning Results
let main (args: string[]) : int =
    match runApp args with
    | Ok message -> 
        printfn "%s" message    // Success: print the message
        0                       // Return success exit code
    | Error errorMsg -> 
        eprintfn "Error: %s" errorMsg  // Error: print to stderr  
        1                              // Return error exit code

/// Lesson 20: Application entry point
/// F# makes you be explicit about side effects
[<EntryPoint>]
let entryPoint args =
    main args

/// TRY THIS: Compile and run the program!
/// 
/// dotnet run -- help           # Shows help message
/// dotnet run -- start 123      # Starts TDD for issue 123  
/// dotnet run -- red            # Shows red phase message
/// dotnet run -- invalid        # Shows error message
/// dotnet run                    # Shows "No command provided" error
/// 
/// Notice how clean the error handling is!
/// Every error case is handled explicitly
/// No exceptions can crash the program unexpectedly
/// 
/// COMPARE TO TYPESCRIPT:
/// - TypeScript: Lots of try/catch, process.exit calls scattered around
/// - F#: Pure functions that return Results, effects only at the boundary
/// - TypeScript: Mutable variables and object properties  
/// - F#: Immutable data flowing through transformations
/// - TypeScript: Runtime string errors ("red" vs "Red" vs "RED")
/// - F#: Compile-time safety with discriminated unions
/// 
/// This is functional programming! 🎉

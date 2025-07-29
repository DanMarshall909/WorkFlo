/// F# Learning Module 2: Built-in Result Types vs Custom Implementation
/// 
/// TypeScript had: type Result<T, E> = { success: true; data: T } | { success: false; error: E }
/// F# has this BUILT-IN! No need to create our own!
module WorkFlo.Core

open WorkFlo.Types

/// Lesson 7: F# has Result<'T,'TError> built into the language!
/// 'T = success type, 'TError = error type
/// Compare to our TypeScript custom Result implementation - F# gives this for free!

/// Lesson 8: Simple functions that return Results
/// TypeScript: return Ok(data) or Err(error)
/// F# uses: Ok value or Error message
let validateIssue (issue: string) : Result<string, string> =
    if System.String.IsNullOrEmpty(issue) then
        Error "Issue number cannot be empty"
    else  
        Ok issue

/// Lesson 9: Working with Results using pattern matching
/// TypeScript: if (result.success) { ... } else { ... }
/// F# uses pattern matching - much cleaner!
let handleValidation result =
    match result with
    | Ok issue -> printfn "Valid issue: %s" issue
    | Error msg -> printfn "Error: %s" msg

/// Lesson 10: File operations returning Results
/// No exceptions! Everything returns Result for predictable error handling
let loadStateFromFile (filename: string) : Result<TddState option, string> =
    try
        if System.IO.File.Exists(filename) then
            // In real implementation, we'd parse the file content
            Ok (Some { Issue = "123"; Criteria = 1; Phase = Start; Total = 3 })
        else
            Ok None  // File doesn't exist - that's OK, not an error
    with
    | ex -> Error $"Failed to read file: {ex.Message}"

/// Lesson 11: Chaining Results with bind (similar to TypeScript flatMap)
/// Instead of nested if/else, we chain operations smoothly
let validateAndLoad (issue: string) (filename: string) =
    validateIssue issue
    |> Result.bind (fun validIssue -> 
        loadStateFromFile filename
        |> Result.map (fun stateOpt -> (validIssue, stateOpt)))

/// Lesson 25: Function Composition with >> operator
/// TypeScript: nested function calls like validate(parse(normalize(input)))
/// F# composition: let pipeline = normalize >> parse >> validate
let validatePositiveInt : string -> Result<int, string> = 
    fun str -> 
        match System.Int32.TryParse(str) with
        | (true, n) when n > 0 -> Ok n
        | (true, _) -> Error "Number must be positive"  
        | (false, _) -> Error "Not a valid number"

let validateIssueNumber : string -> Result<int, string> =
    validateIssue >> Result.bind validatePositiveInt

/// Lesson 26: File I/O with Result types (no exceptions!)
open System.IO

let readAllText (filename: string) : Result<string, string> =
    try
        if File.Exists(filename) then
            Ok (File.ReadAllText(filename))
        else
            Error $"File not found: {filename}"
    with
    | ex -> Error $"Failed to read file: {ex.Message}"

let writeAllText (filename: string) (content: string) : Result<unit, string> =
    try
        File.WriteAllText(filename, content)
        Ok ()
    with
    | ex -> Error $"Failed to write file: {ex.Message}"

/// Lesson 27: Parsing state from file content
let parseStateContent (content: string) : Result<TddState, string> =
    let lines = content.Split('\n', System.StringSplitOptions.RemoveEmptyEntries)
    let kvPairs = 
        lines 
        |> Array.choose (fun line ->
            match line.Split('=', 2) with
            | [| key; value |] -> Some (key.Trim(), value.Trim())
            | _ -> None)
        |> Map.ofArray

    let tryGet key = Map.tryFind key kvPairs

    match tryGet "ISSUE", tryGet "CRITERIA", tryGet "PHASE", tryGet "TOTAL" with
    | Some issue, Some criteriaStr, Some phaseStr, Some totalStr ->
        match tryParseInt criteriaStr, tryParseInt totalStr with
        | Some criteria, Some total ->
            match phaseStr with
            | "Start" -> Ok { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Start; Total = total }
            | "Red" -> Ok { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Red; Total = total }
            | "Green" -> Ok { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Green; Total = total }
            | "Refactor" -> Ok { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Refactor; Total = total }
            | "Cover" -> Ok { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Cover; Total = total }
            | _ -> Error $"Unknown phase: {phaseStr}"
        | _ -> Error "Invalid criteria or total numbers"
    | _ -> Error "Missing required fields in state file"

/// Lesson 28: Complete state loading pipeline
let loadState (filename: string) : Result<TddState option, string> =
    match readAllText filename with
    | Ok content -> 
        parseStateContent content |> Result.map Some
    | Error msg when msg.Contains("File not found") ->
        Ok None  // No state file is OK
    | Error msg -> 
        Error msg

/// Lesson 29: State persistence
let formatState (state: TddState) : string =
    $"ISSUE={state.Issue}\nCRITERIA={state.Criteria}\nPHASE={state.Phase}\nTOTAL={state.Total}\n"

let saveState (filename: string) (state: TddState) : Result<unit, string> =
    state |> formatState |> writeAllText filename

/// TRY THIS IN F# INTERACTIVE:
/// 
/// validateIssue ""           // Returns: Error "Issue number cannot be empty"
/// validateIssue "123"        // Returns: Ok "123"
/// validateIssueNumber "123"  // Returns: Ok 123  
/// validateIssueNumber "-5"   // Returns: Error "Number must be positive"
/// validateIssueNumber "abc"  // Returns: Error "Not a valid number"
/// 
/// // File operations:
/// let testState = { Issue = "123"; Criteria = 1; Phase = Red; Total = 3 }
/// saveState "test.state" testState    // Saves to file
/// loadState "test.state"              // Loads from file: Ok (Some testState)
/// loadState "missing.state"           // Missing file: Ok None
/// 
/// Notice: 
/// - Function composition with >> creates pipelines
/// - File operations return Results, never throw exceptions
/// - Pattern matching handles all parsing cases safely
/// - Option types distinguish "no file" from "parse error"!
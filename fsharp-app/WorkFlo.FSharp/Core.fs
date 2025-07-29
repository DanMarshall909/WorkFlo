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

/// TRY THIS IN F# INTERACTIVE:
/// 
/// validateIssue ""           // Returns: Error "Issue number cannot be empty"
/// validateIssue "123"        // Returns: Ok "123"
/// 
/// let result = validateIssue "123"
/// match result with
/// | Ok issue -> printfn "Success: %s" issue
/// | Error msg -> printfn "Failed: %s" msg
/// 
/// Notice: No exceptions thrown! All errors are values we can handle safely.
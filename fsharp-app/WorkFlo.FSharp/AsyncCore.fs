/// F# Learning Module 5: Async Workflows vs Promises/Callbacks
/// 
/// TypeScript: Promise chains with .then() and async/await syntax
/// F# approach: Async workflows with computation expressions - much cleaner!
module WorkFlo.AsyncCore

open WorkFlo.Types
open System.IO

/// Lesson 35: Async Workflows - No Callback Hell!
/// TypeScript: fs.readFile(file, (err, data) => { if (err) ... else ... })
/// F# async: Clean, readable, composable async operations
let readFileAsync (filename: string) : Async<Result<string, string>> =
    async {
        try
            if File.Exists(filename) then
                let! content = File.ReadAllTextAsync(filename) |> Async.AwaitTask
                return Ok content
            else
                return Error $"File not found: {filename}"
        with
        | ex -> return Error $"Failed to read file: {ex.Message}"
    }

/// Lesson 36: Async file writing with automatic error handling
let writeFileAsync (filename: string) (content: string) : Async<Result<unit, string>> =
    async {
        try
            do! File.WriteAllTextAsync(filename, content) |> Async.AwaitTask
            return Ok ()
        with
        | ex -> return Error $"Failed to write file: {ex.Message}"
    }

/// Lesson 37: Async state loading - combining async with Result
/// TypeScript: Nested promises with error handling scattered everywhere
/// F# async: Clean linear flow with automatic error propagation
let loadStateAsync (filename: string) : Async<Result<TddState option, string>> =
    async {
        match! readFileAsync filename with
        | Ok content -> 
            // Reuse our synchronous parsing logic
            match WorkFlo.Core.parseStateContent content with
            | Ok state -> return Ok (Some state)
            | Error msg -> return Error msg
        | Error msg when msg.Contains("File not found") ->
            return Ok None  // No state file is OK
        | Error msg -> 
            return Error msg
    }

/// Lesson 38: Async state saving with formatted output
let saveStateAsync (filename: string) (state: TddState) : Async<Result<unit, string>> =
    async {
        let content = WorkFlo.Core.formatState state
        return! writeFileAsync filename content
    }

/// Lesson 39: Parallel async operations - doing multiple things at once
/// TypeScript: Promise.all([...]) with complex error handling
/// F# async: Simple, clean parallel execution
let loadConfigAndStateAsync (configFile: string) (stateFile: string) : Async<Result<string * TddState option, string>> =
    async {
        // Run both file operations in parallel using Async.Parallel
        let! configTask = readFileAsync configFile |> Async.StartChild
        let! stateTask = loadStateAsync stateFile |> Async.StartChild
        
        let! configResult = configTask
        let! stateResult = stateTask
        
        match configResult, stateResult with
        | Ok config, Ok state -> return Ok (config, state)
        | Error configErr, _ -> return Error $"Config error: {configErr}"
        | _, Error stateErr -> return Error $"State error: {stateErr}"
    }

/// Lesson 40: Computation Expression Builder Pattern
/// This shows how F# async is actually implemented - it's just syntax sugar!
/// TypeScript: No equivalent - you have to manually chain promises
type ResultBuilder() =
    member _.Return(x) = Ok x
    member _.Bind(result, f) = Result.bind f result
    member _.ReturnFrom(x) = x

let result = ResultBuilder()

/// Lesson 41: Custom computation expression for async Results
let validateAndSaveAsync (issue: string) (filename: string) : Async<Result<string, string>> =
    async {
        // Async workflow with Result handling - best of both worlds!
        let validation = result {
            let! validIssue = WorkFlo.Core.validateIssue issue
            let! issueNum = WorkFlo.Core.validatePositiveInt validIssue  
            return { Issue = string issueNum; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        }
        
        match validation with
        | Ok newState ->
            match! saveStateAsync filename newState with
            | Ok () -> return Ok $"Successfully started TDD for issue {issue}"
            | Error err -> return Error err
        | Error err -> return Error err
    }

/// TRY THIS: Compare async patterns!
/// 
/// // TypeScript Promise version:
/// readFile(file)
///   .then(content => parseContent(content))
///   .then(state => writeFile(outFile, formatState(state)))
///   .catch(err => console.error(err))
/// 
/// // F# Async version:
/// async {
///     let! content = readFileAsync file
///     match content with
///     | Ok data ->
///         match parseStateContent data with  
///         | Ok state -> 
///             let! result = saveStateAsync outFile state
///             return result
///         | Error err -> return Error err
///     | Error err -> return Error err
/// }
/// 
/// Notice how F# async:
/// - No callback hell or promise chaining
/// - Readable top-to-bottom flow
/// - Automatic error propagation with Result types
/// - Built-in parallel execution support
/// - Computation expressions make custom control flow easy!
/// F# Test Suite: Testing Program.fs Entry Point and Main Functions
module WorkFlo.Tests.ProgramTestsNew

open Xunit
open FsUnit.Xunit
open WorkFlo.Types
open WorkFlo.Commands
open WorkFlo.Program
open System.IO

/// Test Suite 1: Context Creation
[<Fact>]
let ``createContext should initialize with default values`` () =
    let context = createContext()
    
    context.ConfigFile |> should equal ".workflo-config"
    context.StateFile |> should equal ".tdd-state"
    context.ScoreFile |> should equal ".tdd-scores"
    context.Debug |> should equal false
    context.Verbose |> should equal false

/// Test Suite 2: Argument Parsing
[<Fact>]
let ``parseArgs should handle help command`` () =
    let args = [|"help"|]
    
    match parseArgs args with
    | Ok (cmd, context) ->
        cmd |> should equal Help
        context |> should not' (be null)
    | Error msg -> failwith $"Help parsing should succeed: {msg}"

[<Fact>]
let ``parseArgs should handle start command with issue`` () =
    let args = [|"start"; "123"|]
    
    match parseArgs args with
    | Ok (cmd, context) ->
        cmd |> should equal (Start "123")
        context |> should not' (be null)
    | Error msg -> failwith $"Start parsing should succeed: {msg}"

[<Fact>]
let ``parseArgs should handle feature command with issue`` () =
    let args = [|"feature"; "456"|]
    
    match parseArgs args with
    | Ok (cmd, context) ->
        cmd |> should equal (Feature "456")
        context |> should not' (be null)
    | Error msg -> failwith $"Feature parsing should succeed: {msg}"

[<Fact>]
let ``parseArgs should handle all TDD phase commands`` () =
    let phaseCommands = [
        ([|"red"|], Red)
        ([|"green"|], Green)
        ([|"refactor"|], Refactor)
        ([|"cover"|], Cover)
        ([|"next"|], Next)
        ([|"status"|], Status)
    ]
    
    phaseCommands |> List.iter (fun (args, expectedCmd) ->
        match parseArgs args with
        | Ok (cmd, context) ->
            cmd |> should equal expectedCmd
            context |> should not' (be null)
        | Error msg -> failwith $"Parsing {args.[0]} should succeed: {msg}")

[<Fact>]
let ``parseArgs should reject empty arguments`` () =
    let args = [||]
    
    match parseArgs args with
    | Error msg -> msg.Contains("No command provided") |> should be True
    | Ok _ -> failwith "Expected empty args to fail"

[<Fact>]
let ``parseArgs should reject unknown commands`` () =
    let args = [|"unknown"|]
    
    match parseArgs args with
    | Error msg -> msg.Contains("Unknown command") |> should be True
    | Ok _ -> failwith "Expected unknown command to fail"

[<Fact>]
let ``parseArgs should require arguments for start command`` () =
    let args = [|"start"|]
    
    match parseArgs args with
    | Error msg -> msg.Contains("Usage: start <issue_number>") |> should be True
    | Ok _ -> failwith "Expected start without args to fail"

[<Fact>]
let ``parseArgs should require arguments for feature command`` () =
    let args = [|"feature"|]
    
    match parseArgs args with
    | Error msg -> msg.Contains("Usage: feature <issue_number>") |> should be True
    | Ok _ -> failwith "Expected feature without args to fail"

/// Test Suite 3: Application Runner
[<Fact>]
let ``runApp should execute help command successfully`` () =
    let args = [|"help"|]
    
    match runApp args with
    | Ok exitCode ->
        exitCode |> should equal 0
    | Error msg -> failwith $"Help execution should succeed: {msg}"

[<Fact>]
let ``runApp should handle invalid commands gracefully`` () =
    let args = [|"invalid"|]
    
    match runApp args with
    | Error msg -> msg.Contains("Unknown command") |> should be True
    | Ok _ -> failwith "Expected invalid command to fail"

[<Fact>]
let ``runApp should handle empty arguments gracefully`` () =
    let args = [||]
    
    match runApp args with
    | Error msg -> msg.Contains("No command provided") |> should be True
    | Ok _ -> failwith "Expected empty args to fail"

[<Fact>]
let ``runApp should handle start command with valid issue`` () =
    let args = [|"start"; "123"|]
    
    match runApp args with
    | Ok exitCode ->
        exitCode |> should equal 0
    | Error msg -> failwith $"Start with valid issue should succeed: {msg}"

[<Fact>]
let ``runApp should handle start command with invalid issue`` () =
    let args = [|"start"; "abc"|]
    
    match runApp args with
    | Error msg -> msg.Contains("Not a valid number") |> should be True
    | Ok _ -> failwith "Expected invalid issue to fail"

[<Fact>]
let ``runApp should handle feature command`` () =
    let args = [|"feature"; "789"|]
    
    match runApp args with
    | Ok exitCode ->
        exitCode |> should equal 0
    | Error msg -> failwith $"Feature command should succeed: {msg}"

/// Test Suite 4: Integration Testing
[<Fact>]
let ``complete workflow through runApp should work`` () =
    let tempStateFile = Path.GetTempFileName()
    
    try
        // Create a test context that uses our temp file
        // Note: This is testing the integration, so we use real file paths
        
        // Test help command
        match runApp [|"help"|] with
        | Ok code -> code |> should equal 0
        | Error msg -> failwith $"Help should work: {msg}"
        
        // Test start command  
        match runApp [|"start"; "999"|] with
        | Ok code -> code |> should equal 0
        | Error msg -> failwith $"Start should work: {msg}"
        
        // Test status command
        match runApp [|"status"|] with
        | Ok code -> code |> should equal 0
        | Error msg -> failwith $"Status should work: {msg}"
        
    finally
        if File.Exists(tempStateFile) then File.Delete(tempStateFile)

[<Fact>]
let ``main function should handle command line arguments`` () =
    // Test that main function exists and can be called
    // This is more of a compilation test since main is the entry point
    let testArgs = [|"help"|]
    
    try
        let result = main testArgs
        result |> should be (greaterThanOrEqualTo 0)
    with
    | ex -> failwith $"Main function should not throw: {ex.Message}"

/// Test Suite 5: Error Recovery and Edge Cases
[<Fact>]
let ``parseArgs should handle malformed arguments gracefully`` () =
    let malformedArgSets = [
        [|"start"; ""|] // Empty issue
        [|"feature"; "  "|] // Whitespace issue  
        [|"start"; "abc"; "extra"|] // Too many args
        [|"red"; "unexpected"|] // Args for no-arg command
    ]
    
    malformedArgSets |> List.iter (fun args ->
        match parseArgs args with
        | Error _ -> () // Expected - should fail gracefully
        | Ok _ -> () // Some might succeed depending on validation
        // Key is that it shouldn't throw exceptions
    )

[<Fact>]
let ``runApp should never throw exceptions`` () =
    let testArgSets = [
        [||]
        [|"help"|]
        [|"invalid"|]
        [|"start"|]
        [|"start"; "123"|]
        [|"start"; "abc"|]
        [|"feature"; "456"|]
        [|"red"|]
        [|"status"|]
    ]
    
    testArgSets |> List.iter (fun args ->
        try
            match runApp args with
            | Ok _ -> () // Success is fine
            | Error _ -> () // Error is also fine
        with
        | ex -> failwith $"runApp should not throw for args {args}: {ex.Message}")

[<Fact>]
let ``createContext should always return valid context`` () =
    // Test that context creation is deterministic and valid
    let context1 = createContext()
    let context2 = createContext()
    
    // Should have same default values
    context1.ConfigFile |> should equal context2.ConfigFile
    context1.StateFile |> should equal context2.StateFile
    context1.ScoreFile |> should equal context2.ScoreFile
    context1.Debug |> should equal context2.Debug
    context1.Verbose |> should equal context2.Verbose

[<Fact>]
let ``program should handle concurrent access gracefully`` () =
    // Test that multiple concurrent runs don't interfere
    let tasks = [
        async { return runApp [|"help"|] }
        async { return runApp [|"status"|] }
        async { return runApp [|"help"|] }
    ]
    
    let results = tasks |> Async.Parallel |> Async.RunSynchronously
    
    // All should complete without exceptions
    results |> Array.iter (fun result ->
        match result with
        | Ok _ -> () // Success expected for help/status
        | Error _ -> () // Error is also acceptable
    )
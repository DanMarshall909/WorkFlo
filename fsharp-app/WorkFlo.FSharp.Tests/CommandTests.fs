/// F# Test Suite: Testing Command Parsing and Execution
/// 
/// This test module validates the command parsing, pattern matching,
/// and state-based command execution that forms the core TDD workflow.
module WorkFlo.Tests.CommandTests

open Xunit
open FsUnit.Xunit
open FsCheck.Xunit
open WorkFlo.Types
open WorkFlo.Commands
open System.IO

/// Test Suite 1: Command Parsing and Pattern Matching
[<Fact>]
let ``parseCommand should handle all valid commands`` () =
    // Test all command parsing cases
    let testCases = [
        ("help", [||], Help)
        ("start", [|"123"|], Start "123")
        ("feature", [|"456"|], Feature "456") 
        ("red", [||], Red)
        ("green", [||], Green)
        ("refactor", [||], Refactor)
        ("cover", [||], Cover)
        ("next", [||], Next)
        ("status", [||], Status)
    ]
    
    testCases |> List.iter (fun (cmdStr, args, expected) ->
        match parseCommand cmdStr args with
        | Ok cmd -> cmd |> should equal expected
        | Error msg -> failwith $"Expected {cmdStr} to parse successfully: {msg}")

[<Fact>]
let ``parseCommand should be case insensitive`` () =
    // Test case insensitivity
    let casedCommands = [
        ("HELP", [||], Help)
        ("Start", [|"123"|], Start "123")
        ("RED", [||], Red)
        ("Green", [||], Green)
    ]
    
    casedCommands |> List.iter (fun (cmdStr, args, expected) ->
        match parseCommand cmdStr args with
        | Ok cmd -> cmd |> should equal expected
        | Error msg -> failwith $"Expected case insensitive parsing for {cmdStr}: {msg}")

[<Fact>]
let ``parseCommand should require arguments for start and feature`` () =
    // Test required argument validation
    match parseCommand "start" [||] with
    | Error msg -> msg |> should contain "Usage: start <issue_number>"
    | Ok _ -> failwith "Expected start command to require issue argument"
    
    match parseCommand "feature" [||] with
    | Error msg -> msg |> should contain "Usage: feature <issue_number>"
    | Ok _ -> failwith "Expected feature command to require issue argument"

[<Fact>]
let ``parseCommand should reject unknown commands`` () =
    // Test unknown command handling
    let unknownCommands = ["invalid"; "unknown"; "badcommand"; "xyz"]
    
    unknownCommands |> List.iter (fun cmd ->
        match parseCommand cmd [||] with
        | Error msg -> msg |> should contain "Unknown command"
        | Ok _ -> failwith $"Expected {cmd} to be rejected as unknown")

/// Test Suite 2: Command Execution with Mock Context
let createTestContext () = {
    ConfigFile = ".test-config"
    StateFile = Path.GetTempFileName()  // Use temp file for testing
    ScoreFile = ".test-scores"
    Debug = false
    Verbose = false
}

let cleanupTestContext (context: Context) =
    if File.Exists(context.StateFile) then File.Delete(context.StateFile)

[<Fact>]
let ``executeCommand Help should return usage information`` () =
    // Arrange: Test context
    let context = createTestContext()
    
    try
        // Act: Execute help command
        let result = executeCommand Help context
        
        // Assert: Should return help text with expected format
        match result with
        | Ok helpText ->
            helpText |> should contain "Usage:"
            helpText |> should contain "Commands:"
            helpText |> should contain "feature"
            helpText |> should contain "start"
        | Error msg -> failwith $"Help command should not fail: {msg}"
    finally
        cleanupTestContext context

[<Fact>]
let ``executeCommand Start should create new TDD session`` () =
    // Arrange: Test context
    let context = createTestContext()
    
    try
        // Act: Execute start command
        let result = executeCommand (Start "123") context
        
        // Assert: Should succeed and create state
        match result with
        | Ok message ->
            message |> should contain "Started TDD workflow"
            message |> should contain "123"
            File.Exists(context.StateFile) |> should equal true
        | Error msg -> failwith $"Start command should succeed: {msg}"
    finally
        cleanupTestContext context

[<Fact>]
let ``executeCommand Feature should return automation message`` () =
    // Arrange: Test context
    let context = createTestContext()
    
    try
        // Act: Execute feature command
        let result = executeCommand (Feature "456") context
        
        // Assert: Should return expected automation output
        match result with
        | Ok message ->
            message |> should contain "Starting automated feature development"
            message |> should contain "456"
            message |> should contain "TDD workflow"
            message |> should contain "90% confident"
        | Error msg -> failwith $"Feature command should succeed: {msg}"
    finally
        cleanupTestContext context

[<Fact>]
let ``executeCommand Start should validate issue numbers`` () =
    // Arrange: Test context
    let context = createTestContext()
    
    try
        // Act: Execute start with invalid issue
        let result = executeCommand (Start "abc") context
        
        // Assert: Should fail validation
        match result with
        | Error msg -> msg |> should contain "Not a valid number"
        | Ok _ -> failwith "Expected invalid issue number to fail"
    finally
        cleanupTestContext context

/// Test Suite 3: State-Based Command Execution
[<Fact>]
let ``TDD workflow should enforce correct phase transitions`` () =
    // Arrange: Test context and start a session
    let context = createTestContext()
    
    try
        // Act: Start session and try phase transitions
        executeCommand (Start "789") context |> ignore
        
        // Red phase should work from Start
        match executeCommand Red context with
        | Ok msg -> msg |> should contain "RED Phase"
        | Error msg -> failwith $"Red transition from Start should work: {msg}"
        
        // Green phase should work from Red
        match executeCommand Green context with
        | Ok msg -> msg |> should contain "GREEN Phase"
        | Error msg -> failwith $"Green transition from Red should work: {msg}"
        
        // Refactor phase should work from Green
        match executeCommand Refactor context with
        | Ok msg -> msg |> should contain "REFACTOR Phase"
        | Error msg -> failwith $"Refactor transition from Green should work: {msg}"
        
        // Cover phase should work from Refactor
        match executeCommand Cover context with
        | Ok msg -> msg |> should contain "COVER Phase"
        | Error msg -> failwith $"Cover transition from Refactor should work: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``TDD workflow should reject invalid phase transitions`` () =
    // Arrange: Test context and start a session
    let context = createTestContext()
    
    try
        // Act: Start session and try invalid transitions
        executeCommand (Start "999") context |> ignore
        
        // Green should fail from Start (must go through Red first)
        match executeCommand Green context with
        | Error msg -> msg |> should contain "Cannot transition to GREEN from Start"
        | Ok _ -> failwith "Expected Green from Start to fail"
        
        // Go to Red, then try invalid transition to Cover
        executeCommand Red context |> ignore
        match executeCommand Cover context with
        | Error msg -> msg |> should contain "Cannot transition to COVER from Red"
        | Ok _ -> failwith "Expected Cover from Red to fail"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Next command should advance criteria after Cover phase`` () =
    // Arrange: Complete a full TDD cycle
    let context = createTestContext()
    
    try
        // Act: Complete full cycle
        executeCommand (Start "555") context |> ignore
        executeCommand Red context |> ignore
        executeCommand Green context |> ignore
        executeCommand Refactor context |> ignore
        executeCommand Cover context |> ignore
        
        // Next should advance to criteria 2
        match executeCommand Next context with
        | Ok msg ->
            msg |> should contain "Criteria 1 completed"
            msg |> should contain "Moving to criteria 2"
        | Error msg -> failwith $"Next command should succeed after Cover: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Status command should show current session state`` () =
    // Arrange: Start a session
    let context = createTestContext()
    
    try
        // Act: Start session and check status
        executeCommand (Start "777") context |> ignore
        
        match executeCommand Status context with
        | Ok status ->
            status |> should contain "TDD Session Status"
            status |> should contain "777"
            status |> should contain "Criteria: 1/3"
        | Error msg -> failwith $"Status command should succeed: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Status command should handle no active session`` () =
    // Arrange: Clean context with no active session
    let context = createTestContext()
    
    try
        // Act: Check status with no session
        match executeCommand Status context with
        | Ok status -> status |> should contain "No active TDD session"
        | Error msg -> failwith $"Status should work with no session: {msg}"
            
    finally
        cleanupTestContext context

/// Test Suite 4: Command Pipeline Integration
[<Fact>]
let ``processCommand should integrate parsing and execution`` () =
    // Arrange: Test context
    let context = createTestContext()
    
    try
        // Act: Process commands through full pipeline
        match processCommand "start" [|"123"|] context with
        | Ok msg -> msg |> should contain "Started TDD workflow"
        | Error msg -> failwith $"Process start should succeed: {msg}"
        
        match processCommand "status" [||] context with
        | Ok msg -> msg |> should contain "123"
        | Error msg -> failwith $"Process status should succeed: {msg}"
        
        match processCommand "invalid" [||] context with
        | Error msg -> msg |> should contain "Unknown command"
        | Ok _ -> failwith "Expected invalid command to fail"
        
    finally
        cleanupTestContext context

/// Test Suite 5: Property-Based Testing for Command Robustness
[<Property>]
let ``parseCommand should never throw exceptions`` (cmdStr: string) (args: string[]) =
    // Property: parseCommand should always return Ok or Error, never throw
    try
        match parseCommand cmdStr args with
        | Ok _ -> true
        | Error _ -> true
    with
    | _ -> false

[<Property>]
let ``executeCommand Help should always succeed`` (context: Context) =
    // Property: Help command should never fail regardless of context
    try
        match executeCommand Help context with
        | Ok _ -> true
        | Error _ -> false
    with
    | _ -> false

[<Fact>]
let ``executeCommand should handle invalid issue numbers gracefully`` () =
    // Test with known invalid issue numbers
    let invalidIssues = [""; "abc"; "0"; "-1"; "12.5"]
    let context = createTestContext()
    
    try
        invalidIssues |> List.iter (fun invalidIssue ->
            match executeCommand (Start invalidIssue) context with
            | Error _ -> () // Expected behavior - should fail gracefully
            | Ok _ -> failwith $"Should not succeed with invalid issue: {invalidIssue}")
    finally
        cleanupTestContext context

/// Test Suite 6: Command Exhaustiveness Testing
[<Fact>]
let ``all Command cases should be handled by executeCommand`` () =
    // This test ensures no Command case is missed in executeCommand
    let context = createTestContext()
    
    try
        let allCommands = [
            Help
            Start "123"
            Feature "456" 
            Red
            Green
            Refactor
            Cover
            Next
            Status
        ]
        
        // All commands should return either Ok or Error, not throw
        allCommands |> List.iter (fun cmd ->
            match executeCommand cmd context with
            | Ok _ -> () // Success is fine
            | Error _ -> () // Error is also fine (may be state-dependent)
            // The key is that nothing should throw an exception
        )
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Command discriminated union should support exhaustive matching`` () =
    // Test that we can pattern match exhaustively on all Command cases
    let getCommandName cmd =
        match cmd with
        | Help -> "Help"
        | Start _ -> "Start"
        | Feature _ -> "Feature"
        | Red -> "Red"
        | Green -> "Green"
        | Refactor -> "Refactor"
        | Cover -> "Cover"
        | Next -> "Next"
        | Status -> "Status"
        // Compiler ensures this is exhaustive
    
    // Test all command name mappings
    getCommandName Help |> should equal "Help"
    getCommandName (Start "123") |> should equal "Start"
    getCommandName (Feature "456") |> should equal "Feature"
    getCommandName Red |> should equal "Red"
    getCommandName Green |> should equal "Green"
    getCommandName Refactor |> should equal "Refactor"
    getCommandName Cover |> should equal "Cover"
    getCommandName Next |> should equal "Next"
    getCommandName Status |> should equal "Status"

/// Summary: These tests validate that F#'s command system provides:
/// 1. Type-safe command parsing - invalid commands caught at compile time
/// 2. Exhaustive pattern matching - compiler ensures all cases handled
/// 3. State-based transitions - invalid workflow states prevented  
/// 4. Composable error handling - parsing and execution errors flow through Results
/// 5. Property-based robustness - edge cases covered automatically
/// 
/// This demonstrates how discriminated unions and pattern matching create
/// a command system that is both flexible and bulletproof, preventing
/// invalid states and ensuring all command cases are properly handled.
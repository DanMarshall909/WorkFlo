/// F# Test Suite: Expanded Command Testing for Full Coverage
module WorkFlo.Tests.CommandTestsExpanded

open Xunit
open FsUnit.Xunit
open WorkFlo.Types
open WorkFlo.Commands
open System.IO

/// Test context helper
let createTestContext () = {
    ConfigFile = ".test-config"
    StateFile = Path.GetTempFileName()
    ScoreFile = ".test-scores"
    Debug = false
    Verbose = false
}

let cleanupTestContext (context: Context) =
    if File.Exists(context.StateFile) then File.Delete(context.StateFile)

/// Test Suite 1: Complete Command Execution Coverage
[<Fact>]
let ``executeCommand Start should create new TDD session`` () =
    let context = createTestContext()
    
    try
        let result = executeCommand (Start "123") context
        
        match result with
        | Ok message ->
            message.Contains("Started TDD workflow") |> should be True
            message.Contains("123") |> should be True
            File.Exists(context.StateFile) |> should equal true
        | Error msg -> failwith $"Start command should succeed: {msg}"
    finally
        cleanupTestContext context

[<Fact>]
let ``executeCommand Start should validate issue numbers`` () =
    let context = createTestContext()
    
    try
        let result = executeCommand (Start "abc") context
        
        match result with
        | Error msg -> msg.Contains("Not a valid number") |> should be True
        | Ok _ -> failwith "Expected invalid issue number to fail"
    finally
        cleanupTestContext context

[<Fact>]
let ``executeCommand Feature should return automation message`` () =
    let context = createTestContext()
    
    try
        let result = executeCommand (Feature "456") context
        
        match result with
        | Ok message ->
            message.Contains("Starting automated feature development") |> should be True
            message.Contains("456") |> should be True
            message.Contains("TDD workflow") |> should be True
            message.Contains("90% confident") |> should be True
        | Error msg -> failwith $"Feature command should succeed: {msg}"
    finally
        cleanupTestContext context

[<Fact>]
let ``TDD workflow should enforce correct phase transitions`` () =
    let context = createTestContext()
    
    try
        // Start session
        executeCommand (Start "789") context |> ignore
        
        // Red phase should work from Start
        match executeCommand Red context with
        | Ok msg -> msg.Contains("RED Phase") |> should be True
        | Error msg -> failwith $"Red transition from Start should work: {msg}"
        
        // Green phase should work from Red
        match executeCommand Green context with
        | Ok msg -> msg.Contains("GREEN Phase") |> should be True
        | Error msg -> failwith $"Green transition from Red should work: {msg}"
        
        // Refactor phase should work from Green
        match executeCommand Refactor context with
        | Ok msg -> msg.Contains("REFACTOR Phase") |> should be True
        | Error msg -> failwith $"Refactor transition from Green should work: {msg}"
        
        // Cover phase should work from Refactor
        match executeCommand Cover context with
        | Ok msg -> msg.Contains("COVER Phase") |> should be True
        | Error msg -> failwith $"Cover transition from Refactor should work: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``TDD workflow should reject invalid phase transitions`` () =
    let context = createTestContext()
    
    try
        executeCommand (Start "999") context |> ignore
        
        // Green should fail from Start
        match executeCommand Green context with
        | Error msg -> msg.Contains("Cannot transition to GREEN from Start") |> should be True
        | Ok _ -> failwith "Expected Green from Start to fail"
        
        // Go to Red, then try invalid transition to Cover
        executeCommand Red context |> ignore
        match executeCommand Cover context with
        | Error msg -> msg.Contains("Cannot transition to COVER from Red") |> should be True
        | Ok _ -> failwith "Expected Cover from Red to fail"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Next command should advance criteria after Cover phase`` () =
    let context = createTestContext()
    
    try
        // Complete full cycle
        executeCommand (Start "555") context |> ignore
        executeCommand Red context |> ignore
        executeCommand Green context |> ignore
        executeCommand Refactor context |> ignore
        executeCommand Cover context |> ignore
        
        // Next should advance to criteria 2
        match executeCommand Next context with
        | Ok msg ->
            msg.Contains("Criteria 1 completed") |> should be True
            msg.Contains("Moving to criteria 2") |> should be True
        | Error msg -> failwith $"Next command should succeed after Cover: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Status command should show current session state`` () =
    let context = createTestContext()
    
    try
        executeCommand (Start "777") context |> ignore
        
        match executeCommand Status context with
        | Ok status ->
            status.Contains("TDD Session Status") |> should be True
            status.Contains("777") |> should be True
            status.Contains("Criteria: 1/3") |> should be True
        | Error msg -> failwith $"Status command should succeed: {msg}"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Status command should handle no active session`` () =
    let context = createTestContext()
    
    try
        match executeCommand Status context with
        | Ok status -> status.Contains("No active TDD session") |> should be True
        | Error msg -> failwith $"Status should work with no session: {msg}"
            
    finally
        cleanupTestContext context

/// Test Suite 2: Command Pipeline Integration  
[<Fact>]
let ``processCommand should integrate parsing and execution`` () =
    let context = createTestContext()
    
    try
        match processCommand "start" [|"123"|] context with
        | Ok msg -> msg.Contains("Started TDD workflow") |> should be True
        | Error msg -> failwith $"Process start should succeed: {msg}"
        
        match processCommand "status" [||] context with
        | Ok msg -> msg.Contains("123") |> should be True
        | Error msg -> failwith $"Process status should succeed: {msg}"
        
        match processCommand "invalid" [||] context with
        | Error msg -> msg.Contains("Unknown command") |> should be True
        | Ok _ -> failwith "Expected invalid command to fail"
        
    finally
        cleanupTestContext context

/// Test Suite 3: Command Exhaustiveness Testing
[<Fact>]
let ``all Command cases should be handled by executeCommand`` () =
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
        )
        
    finally
        cleanupTestContext context

[<Fact>]
let ``Command discriminated union should support exhaustive matching`` () =
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
    
    getCommandName Help |> should equal "Help"
    getCommandName (Start "123") |> should equal "Start"
    getCommandName (Feature "456") |> should equal "Feature"
    getCommandName Red |> should equal "Red"
    getCommandName Green |> should equal "Green"
    getCommandName Refactor |> should equal "Refactor"
    getCommandName Cover |> should equal "Cover"
    getCommandName Next |> should equal "Next"
    getCommandName Status |> should equal "Status"

/// Test Suite 4: Advanced Command Parsing
[<Fact>]
let ``parseCommand should handle all valid commands`` () =
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
    match parseCommand "start" [||] with
    | Error msg -> msg.Contains("Usage: start <issue_number>") |> should be True
    | Ok _ -> failwith "Expected start command to require issue argument"
    
    match parseCommand "feature" [||] with
    | Error msg -> msg.Contains("Usage: feature <issue_number>") |> should be True
    | Ok _ -> failwith "Expected feature command to require issue argument"

[<Fact>]
let ``parseCommand should reject unknown commands`` () =
    let unknownCommands = ["invalid"; "unknown"; "badcommand"; "xyz"]
    
    unknownCommands |> List.iter (fun cmd ->
        match parseCommand cmd [||] with
        | Error msg -> msg.Contains("Unknown command") |> should be True
        | Ok _ -> failwith $"Expected {cmd} to be rejected as unknown")

/// Test Suite 5: Error Handling and Edge Cases
[<Fact>]
let ``executeCommand should handle invalid issue numbers gracefully`` () =
    let invalidIssues = [""; "abc"; "0"; "-1"; "12.5"]
    let context = createTestContext()
    
    try
        invalidIssues |> List.iter (fun invalidIssue ->
            match executeCommand (Start invalidIssue) context with
            | Error _ -> () // Expected behavior
            | Ok _ -> failwith $"Should not succeed with invalid issue: {invalidIssue}")
    finally
        cleanupTestContext context

[<Fact>]
let ``commands should handle missing state file gracefully`` () =
    let context = createTestContext()
    // Don't create a state file
    
    try
        // Red should fail without active session
        match executeCommand Red context with
        | Error msg -> msg.Contains("No active TDD session") |> should be True
        | Ok _ -> failwith "Expected Red to fail without session"
        
        // Status should handle missing state
        match executeCommand Status context with
        | Ok msg -> msg.Contains("No active TDD session") |> should be True
        | Error _ -> failwith "Status should handle missing state gracefully"
        
    finally
        cleanupTestContext context

[<Fact>]
let ``complete TDD cycle should progress through all phases`` () =
    let context = createTestContext()
    
    try
        // Start -> Red -> Green -> Refactor -> Cover -> Next
        executeCommand (Start "111") context |> ignore
        executeCommand Red context |> ignore
        executeCommand Green context |> ignore  
        executeCommand Refactor context |> ignore
        executeCommand Cover context |> ignore
        
        match executeCommand Next context with
        | Ok msg -> msg.Contains("Moving to criteria 2") |> should be True
        | Error msg -> failwith $"Complete cycle should allow Next: {msg}"
        
        // Should now be back in Start phase for criteria 2
        match executeCommand Status context with
        | Ok status -> 
            status.Contains("Criteria: 2/3") |> should be True
            status.Contains("Phase: Start") |> should be True
        | Error msg -> failwith $"Status should work after Next: {msg}"
        
    finally
        cleanupTestContext context
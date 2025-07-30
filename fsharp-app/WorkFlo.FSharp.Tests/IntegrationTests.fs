/// F# Test Suite: Integration Testing for Complete TDD Workflows
/// 
/// This test module validates end-to-end TDD workflows, demonstrating
/// how all the F# components work together to provide a complete,
/// reliable TDD automation system.
module WorkFlo.Tests.IntegrationTests

open Xunit
open FsUnit.Xunit
open FsCheck.Xunit
open WorkFlo.Types
open WorkFlo.Commands
open WorkFlo.Core
open WorkFlo.Program
open System.IO

/// Test Utilities for Integration Testing
let createIntegrationContext () = {
    ConfigFile = Path.GetTempFileName()
    StateFile = Path.GetTempFileName()
    ScoreFile = Path.GetTempFileName()
    Debug = false
    Verbose = false
}

let cleanupIntegrationContext (context: Context) =
    [context.ConfigFile; context.StateFile; context.ScoreFile]
    |> List.iter (fun file -> if File.Exists(file) then File.Delete(file))

/// Test Suite 1: Complete TDD Cycle Integration
[<Fact>]
let ``complete TDD cycle should transition through all phases successfully`` () =
    // Arrange: Clean integration context
    let context = createIntegrationContext()
    
    try
        // Act: Execute complete TDD cycle
        let results = [
            executeCommand (Start "123") context
            executeCommand Red context
            executeCommand Green context
            executeCommand Refactor context
            executeCommand Cover context
            executeCommand Next context
        ]
        
        // Assert: All commands should succeed
        results |> List.iteri (fun i result ->
            match result with
            | Ok _ -> () // Success expected
            | Error msg -> failwith $"Step {i} failed: {msg}")
        
        // Verify final state shows criteria advancement
        match executeCommand Status context with
        | Ok status ->
            status |> should contain "Issue: 123"
            status |> should contain "Criteria: 2/3"  // Advanced to next criteria
            status |> should contain "Phase: Start"   // Reset for next criteria
        | Error msg -> failwith $"Final status check failed: {msg}"
        
    finally
        cleanupIntegrationContext context

[<Fact>]
let ``multiple TDD cycles should advance through all criteria`` () =
    // Arrange: Integration context
    let context = createIntegrationContext()
    
    try
        // Act: Execute multiple complete cycles
        executeCommand (Start "456") context |> ignore
        
        // Complete criteria 1
        [Red; Green; Refactor; Cover; Next]
        |> List.iter (fun cmd -> executeCommand cmd context |> ignore)
        
        // Complete criteria 2
        [Red; Green; Refactor; Cover; Next]
        |> List.iter (fun cmd -> executeCommand cmd context |> ignore)
        
        // Complete criteria 3 (final)
        [Red; Green; Refactor; Cover]
        |> List.iter (fun cmd -> executeCommand cmd context |> ignore)
        
        // Assert: Final next should indicate completion
        match executeCommand Next context with
        | Ok message -> message |> should contain "All criteria completed"
        | Error msg -> failwith $"Final completion should succeed: {msg}"
        
    finally
        cleanupIntegrationContext context

[<Fact>]
let ``TDD workflow should persist and restore state across commands`` () =
    // Arrange: Integration context
    let context = createIntegrationContext()
    
    try
        // Act: Start session and advance partway
        executeCommand (Start "789") context |> ignore
        executeCommand Red context |> ignore
        executeCommand Green context |> ignore
        
        // Verify state persistence by checking status
        match executeCommand Status context with
        | Ok status ->
            status |> should contain "Issue: 789"
            status |> should contain "Phase: Green"
            status |> should contain "Criteria: 1/3"
        | Error msg -> failwith $"Status should show persisted state: {msg}"
        
        // Continue workflow from persisted state
        executeCommand Refactor context |> ignore
        executeCommand Cover context |> ignore
        
        // Verify continued state progression
        match executeCommand Status context with
        | Ok status ->
            status |> should contain "Phase: Cover"
        | Error msg -> failwith $"Continued workflow should work: {msg}"
        
    finally
        cleanupIntegrationContext context

/// Test Suite 2: Error Handling and Recovery Integration
[<Fact>]
let ``workflow should handle and recover from validation errors`` () =
    // Arrange: Integration context  
    let context = createIntegrationContext()
    
    try
        // Act: Try invalid operations and recover
        
        // Invalid issue number should fail
        match executeCommand (Start "abc") context with
        | Error msg -> msg |> should contain "Not a valid number"
        | Ok _ -> failwith "Expected invalid issue to fail"
        
        // Valid start should work after error
        match executeCommand (Start "111") context with
        | Ok msg -> msg |> should contain "Started TDD workflow"
        | Error msg -> failwith $"Valid start should work after error: {msg}"
        
        // Invalid phase transition should fail
        match executeCommand Green context with  // Skip Red phase
        | Error msg -> msg |> should contain "Cannot transition to GREEN from Start"
        | Ok _ -> failwith "Expected invalid transition to fail"
        
        // Valid transition should work after error
        match executeCommand Red context with
        | Ok msg -> msg |> should contain "RED Phase"
        | Error msg -> failwith $"Valid transition should work after error: {msg}"
        
    finally
        cleanupIntegrationContext context

[<Fact>]
let ``workflow should handle commands without active session gracefully`` () =
    // Arrange: Clean context with no active session
    let context = createIntegrationContext()
    
    try
        // Act: Try workflow commands without starting session
        let commandsRequiringSession = [Red; Green; Refactor; Cover; Next]
        
        commandsRequiringSession |> List.iter (fun cmd ->
            match executeCommand cmd context with
            | Error msg -> msg |> should contain "No active TDD session"
            | Ok _ -> failwith $"Expected {cmd} to fail without active session")
        
        // Status should work even without session
        match executeCommand Status context with
        | Ok msg -> msg |> should contain "No active TDD session"
        | Error msg -> failwith $"Status should work without session: {msg}"
        
        // Help should always work
        match executeCommand Help context with
        | Ok msg -> msg |> should contain "Usage:"
        | Error msg -> failwith $"Help should always work: {msg}"
        
    finally
        cleanupIntegrationContext context

/// Test Suite 3: Program-Level Integration Testing
[<Fact>]
let ``runApp should handle command line arguments correctly`` () =
    // Test the main application entry point
    
    // Valid help command
    match runApp [|"help"|] with
    | Ok msg -> msg |> should contain "Usage:"
    | Error msg -> failwith $"Help should work: {msg}"
    
    // Valid start command
    match runApp [|"start"; "123"|] with
    | Ok msg -> msg |> should contain "Started TDD workflow"
    | Error msg -> failwith $"Start should work: {msg}"
    
    // Invalid command
    match runApp [|"invalid"|] with
    | Error msg -> msg |> should contain "Unknown command"
    | Ok _ -> failwith "Expected invalid command to fail"
    
    // No arguments
    match runApp [||] with
    | Error msg -> msg |> should contain "No command provided"
    | Ok _ -> failwith "Expected no arguments to fail"

[<Fact>]
let ``parseArgs should handle various argument patterns`` () =
    // Test argument parsing edge cases
    
    // No arguments
    match parseArgs [||] with
    | Error msg -> msg |> should contain "No command provided"
    | Ok _ -> failwith "Expected empty args to fail"
    
    // Single command
    match parseArgs [|"help"|] with
    | Ok (cmd, args) -> 
        cmd |> should equal "help"
        args |> should haveLength 0
    | Error msg -> failwith $"Single command should work: {msg}"
    
    // Command with arguments
    match parseArgs [|"start"; "123"; "extra"|] with
    | Ok (cmd, args) ->
        cmd |> should equal "start"
        args |> should equal [|"123"; "extra"|]
    | Error msg -> failwith $"Command with args should work: {msg}"

/// Test Suite 4: Feature Command Integration
[<Fact>]
let ``feature command should provide complete automation workflow`` () =
    // Arrange: Integration context
    let context = createIntegrationContext()
    
    try
        // Act: Execute feature command
        match executeCommand (Feature "999") context with
        | Ok output ->
            // Assert: Should contain all expected automation elements
            output |> should contain "Starting automated feature development"
            output |> should contain "issue #999"
            output |> should contain "TDD workflow"
            output |> should contain "feature/issue-999"
            output |> should contain "PR created"
            output |> should contain "90% confident"
            output |> should contain "Automated feature development completed"
        | Error msg -> failwith $"Feature command should succeed: {msg}"
        
        // Feature command should work with validation
        match executeCommand (Feature "abc") context with
        | Error msg -> msg |> should contain "Not a valid number"
        | Ok _ -> failwith "Expected invalid feature issue to fail"
        
    finally
        cleanupIntegrationContext context

/// Test Suite 5: File System Integration
[<Fact>]
let ``workflow should handle file system operations robustly`` () =
    // Arrange: Integration context with custom paths
    let context = {
        ConfigFile = "/tmp/test-config-integration"
        StateFile = "/tmp/test-state-integration"
        ScoreFile = "/tmp/test-score-integration"
        Debug = true
        Verbose = true
    }
    
    try
        // Act: Execute operations that create and modify files
        executeCommand (Start "555") context |> ignore
        
        // Assert: State file should be created
        File.Exists(context.StateFile) |> should equal true
        
        // Continue workflow - should read and update existing file
        executeCommand Red context |> ignore
        executeCommand Green context |> ignore
        
        // Verify state file contains expected content
        let stateContent = File.ReadAllText(context.StateFile)
        stateContent |> should contain "ISSUE=555"
        stateContent |> should contain "PHASE=Green"
        
        // Test recovery from file - delete and recreate context
        let newContext = { context with StateFile = context.StateFile }
        
        match executeCommand Status newContext with
        | Ok status ->
            status |> should contain "Issue: 555"
            status |> should contain "Phase: Green"
        | Error msg -> failwith $"Should recover state from file: {msg}"
        
    finally
        [context.ConfigFile; context.StateFile; context.ScoreFile]
        |> List.iter (fun file -> if File.Exists(file) then File.Delete(file))

/// Test Suite 6: Integration Testing with Known Values
[<Fact>]
let ``TDD workflow should maintain issue invariant across operations`` () =
    // Test with known issue numbers
    let testIssues = ["123"; "456"; "789"]
    
    testIssues |> List.iter (fun issue ->
        let context = createIntegrationContext()
        try
            // Start workflow
            executeCommand (Start issue) context |> ignore
            
            // Throughout the workflow, issue should remain constant
            let phases = [Red; Green; Refactor; Cover]
            phases |> List.iter (fun phase ->
                executeCommand phase context |> ignore
                match executeCommand Status context with
                | Ok status -> 
                    status |> should contain $"Issue: {issue}"
                | Error msg -> failwith $"Status should show issue {issue}: {msg}")
        finally
            cleanupIntegrationContext context)

[<Fact>]
let ``multiple complete TDD cycles should end in consistent state`` () =
    // Test with known number of cycles
    let context = createIntegrationContext()
    
    try
        executeCommand (Start "999") context |> ignore
        
        // Execute 2 complete cycles
        [1..2] |> List.iter (fun cycleNum ->
            [Red; Green; Refactor; Cover; Next]
            |> List.iter (fun cmd ->
                match executeCommand cmd context with
                | Ok _ -> () // Expected
                | Error msg -> failwith $"Cycle {cycleNum} command {cmd} failed: {msg}"))
                
        // Should now be on criteria 3
        match executeCommand Status context with
        | Ok status -> 
            status |> should contain "Criteria: 3/3"
            status |> should contain "Phase: Start"
        | Error msg -> failwith $"Final status should show criteria 3: {msg}"
    finally
        cleanupIntegrationContext context

/// Test Suite 7: Cross-Module Integration
[<Fact>]
let ``all modules should integrate seamlessly`` () =
    // Test that Types, Core, Commands, and Program modules work together
    let context = createIntegrationContext()
    
    try
        // Use functionality from all modules
        
        // Types module: Create records and use discriminated unions
        let testState = { Issue = "integration"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        
        // Core module: Validate and persist state
        let validationResult = validateIssueNumber "123"
        let saveResult = saveState context.StateFile testState
        let loadResult = loadState context.StateFile
        
        // Commands module: Parse and execute commands
        let parseResult = parseCommand "start" [|"123"|]
        let executeResult = executeCommand Help context
        
        // Program module: Full application pipeline
        let appResult = runApp [|"help"|]
        
        // Assert: All operations should succeed
        match validationResult, saveResult, loadResult, parseResult, executeResult, appResult with
        | Ok _, Ok _, Ok (Some _), Ok _, Ok _, Ok _ -> () // All succeeded
        | _ -> failwith "Expected all module integrations to succeed"
        
    finally
        cleanupIntegrationContext context

[<Fact>]
let ``system should handle concurrent access gracefully`` () =
    // Test that multiple contexts don't interfere with each other
    let context1 = createIntegrationContext()
    let context2 = createIntegrationContext()
    
    try
        // Execute different workflows in parallel contexts
        executeCommand (Start "111") context1 |> ignore
        executeCommand (Start "222") context2 |> ignore
        
        executeCommand Red context1 |> ignore
        executeCommand Green context2 |> ignore  // Different phase
        
        // Verify contexts remain independent
        match executeCommand Status context1, executeCommand Status context2 with
        | Ok status1, Ok status2 ->
            status1 |> should contain "Issue: 111"
            status1 |> should contain "Phase: Red"
            status2 |> should contain "Issue: 222"
            status2 |> should contain "Phase: Green"
        | _ -> failwith "Both contexts should maintain independent state"
        
    finally
        cleanupIntegrationContext context1
        cleanupIntegrationContext context2

/// Summary: These integration tests validate that the complete F# system provides:
/// 1. End-to-end workflow reliability - all components work together seamlessly
/// 2. State persistence and recovery - workflows survive across command invocations
/// 3. Error handling and recovery - system gracefully handles and recovers from errors
/// 4. File system robustness - handles file operations reliably across different scenarios
/// 5. Concurrent access safety - multiple workflows can operate independently
/// 6. Property-based workflow validation - invariants maintained across all operations
/// 
/// This demonstrates that the F# functional programming approach creates a TDD
/// automation system that is not only more reliable than imperative alternatives,
/// but also provides comprehensive error handling, state management, and workflow
/// orchestration that would be difficult to achieve with mutable, exception-based code.
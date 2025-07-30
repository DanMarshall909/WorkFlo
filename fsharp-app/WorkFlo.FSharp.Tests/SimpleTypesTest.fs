module WorkFlo.Tests.SimpleTypesTest

open Xunit
open WorkFlo.Types
open WorkFlo.Core
open WorkFlo.Commands

[<Fact>]
let ``tryParseInt works`` () =
    let result = tryParseInt "123"
    Assert.Equal(Some 123, result)

[<Fact>]
let ``tryParseInt returns None for invalid`` () =
    let result = tryParseInt "abc"
    Assert.Equal(None, result)

[<Fact>]
let ``doubleIfValid chains Option correctly`` () =
    let result1 = doubleIfValid "5"
    let result2 = doubleIfValid "abc"
    Assert.Equal(Some 10, result1)
    Assert.Equal(None, result2)

[<Fact>]
let ``validateIssue accepts valid strings`` () =
    match validateIssue "123" with
    | Ok issue -> Assert.Equal("123", issue)
    | Error _ -> Assert.True(false, "Should accept valid issue")

[<Fact>]
let ``validateIssue rejects empty strings`` () =
    match validateIssue "" with
    | Error msg -> Assert.True(msg.Contains("empty"))
    | Ok _ -> Assert.True(false, "Should reject empty issue")

[<Fact>]
let ``parseCommand handles Help`` () =
    match parseCommand "help" [||] with
    | Ok Help -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Expected Help command")
    | Error _ -> Assert.True(false, "Help should parse successfully")

[<Fact>]
let ``parseCommand handles Start with argument`` () =
    match parseCommand "start" [|"123"|] with
    | Ok (Start "123") -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Expected Start 123 command")
    | Error _ -> Assert.True(false, "Start should parse successfully")

[<Fact>]
let ``executeCommand Help returns help text`` () =
    let context = {
        ConfigFile = ".test-config"
        StateFile = ".test-state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand Help context with
    | Ok helpText -> 
        Assert.True(helpText.Contains("Usage"))
        Assert.True(helpText.Contains("Commands"))
    | Error _ -> Assert.True(false, "Help should succeed")

[<Fact>]
let ``executeCommand Start creates TDD session`` () =
    let context = {
        ConfigFile = ".test-config"
        StateFile = System.IO.Path.GetTempFileName()
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand (Start "123") context with
        | Ok message -> 
            Assert.True(message.Contains("Started"))
            Assert.True(System.IO.File.Exists(context.StateFile))
        | Error _ -> Assert.True(false, "Start should succeed")
    finally
        if System.IO.File.Exists(context.StateFile) then 
            System.IO.File.Delete(context.StateFile)

[<Fact>]
let ``validatePositiveInt accepts positive numbers`` () =
    match validatePositiveInt "123" with
    | Ok num -> Assert.Equal(123, num)
    | Error _ -> Assert.True(false, "Should accept positive number")

[<Fact>]
let ``validatePositiveInt rejects zero and negative`` () =
    match validatePositiveInt "0" with
    | Error msg -> Assert.True(msg.Contains("positive"))
    | Ok _ -> Assert.True(false, "Should reject zero")

[<Fact>]
let ``createContext initializes default values`` () =
    let context = WorkFlo.Program.createContext()
    Assert.Equal(".workflo-config", context.ConfigFile)
    Assert.Equal(".tdd-state", context.StateFile)
    Assert.Equal(".tdd-scores", context.ScoreFile)
    Assert.False(context.Debug)
    Assert.False(context.Verbose)

[<Fact>]
let ``parseArgs handles help command`` () =
    match WorkFlo.Program.parseArgs [|"help"|] with
    | Ok (cmd, args) ->
        Assert.Equal("help", cmd)
        Assert.Equal(0, args.Length)
    | Error _ -> Assert.True(false, "Help parsing should succeed")

[<Fact>]
let ``formatState creates key-value pairs`` () =
    let state = { Issue = "123"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let formatted = formatState state
    Assert.True(formatted.Contains("ISSUE=123"))
    Assert.True(formatted.Contains("CRITERIA=1"))
    Assert.True(formatted.Contains("PHASE=Start"))

[<Fact>]
let ``nextCriteria increments criteria and resets phase`` () =
    let state = { Issue = "456"; Criteria = 2; Phase = WorkFlo.Types.Cover; Total = 3 }
    let result = nextCriteria state
    Assert.Equal(3, result.Criteria)
    Assert.Equal(WorkFlo.Types.Start, result.Phase)
    Assert.Equal("456", result.Issue)

[<Fact>]
let ``runApp handles help command end-to-end`` () =
    match WorkFlo.Program.runApp [|"help"|] with
    | Ok message -> Assert.True(message.Contains("Usage"))
    | Error _ -> Assert.True(false, "runApp help should succeed")

[<Fact>]
let ``runApp handles start command end-to-end`` () =
    match WorkFlo.Program.runApp [|"start"; "789"|] with
    | Ok message -> Assert.True(message.Contains("Started"))
    | Error _ -> Assert.True(false, "runApp start should succeed")

[<Fact>]
let ``validateIssueNumber combines validation functions`` () =
    match validateIssueNumber "456" with
    | Ok num -> Assert.Equal(456, num)
    | Error _ -> Assert.True(false, "Should accept valid issue number")

[<Fact>]
let ``parseStateContent parses formatted state`` () =
    let content = "ISSUE=555\nCRITERIA=2\nPHASE=Green\nTOTAL=3\n"
    match parseStateContent content with
    | Ok state ->
        Assert.Equal("555", state.Issue)
        Assert.Equal(2, state.Criteria)
        Assert.Equal(WorkFlo.Types.Green, state.Phase)
        Assert.Equal(3, state.Total)
    | Error _ -> Assert.True(false, "Should parse valid content")

[<Fact>]
let ``executeCommand Status shows no active session`` () =
    let context = {
        ConfigFile = ".test-config"
        StateFile = "/tmp/non-existent-file.state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand Status context with
    | Ok status -> Assert.True(status.Contains("No active"))
    | Error _ -> Assert.True(false, "Status should handle missing state")

[<Fact>]
let ``executeCommand Red advances to Red phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "999"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Red context with
        | Ok message -> 
            Assert.True(message.Contains("RED"))
            let newContent = System.IO.File.ReadAllText(stateFile)
            Assert.True(newContent.Contains("PHASE=Red"))
        | Error err -> Assert.True(false, $"Red should succeed, got: {err}")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``executeCommand Green advances to Green phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "888"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Green context with
        | Ok message -> 
            Assert.True(message.Contains("GREEN"))
            let newContent = System.IO.File.ReadAllText(stateFile)
            Assert.True(newContent.Contains("PHASE=Green"))
        | Error err -> Assert.True(false, $"Green should succeed, got: {err}")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``executeCommand Refactor advances to Refactor phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "777"; Criteria = 1; Phase = WorkFlo.Types.Green; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Refactor context with
        | Ok message -> 
            Assert.True(message.Contains("REFACTOR"))
            let newContent = System.IO.File.ReadAllText(stateFile)
            Assert.True(newContent.Contains("PHASE=Refactor"))
        | Error err -> Assert.True(false, $"Refactor should succeed, got: {err}")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``executeCommand Cover advances to Cover phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "666"; Criteria = 1; Phase = WorkFlo.Types.Refactor; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Cover context with
        | Ok message -> 
            Assert.True(message.Contains("COVER"))
            let newContent = System.IO.File.ReadAllText(stateFile)
            Assert.True(newContent.Contains("PHASE=Cover"))
        | Error err -> Assert.True(false, $"Cover should succeed, got: {err}")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``processCommand delegates to parseCommand and executeCommand`` () =
    let context = {
        ConfigFile = ".test-config"
        StateFile = ".test-state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match processCommand "help" [||] context with
    | Ok message -> Assert.True(message.Contains("Usage"))
    | Error _ -> Assert.True(false, "processCommand help should succeed")

[<Fact>]
let ``saveState writes formatted state to file`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let state = { Issue = "555"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 3 }
    
    try
        match saveState stateFile state with
        | Ok () -> 
            let content = System.IO.File.ReadAllText(stateFile)
            Assert.True(content.Contains("ISSUE=555"))
            Assert.True(content.Contains("CRITERIA=2"))
            Assert.True(content.Contains("PHASE=Green"))
        | Error _ -> Assert.True(false, "saveState should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``loadState reads and parses state from file`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let content = "ISSUE=444\nCRITERIA=3\nPHASE=Cover\nTOTAL=5\n"
    System.IO.File.WriteAllText(stateFile, content)
    
    try
        match loadState stateFile with
        | Ok (Some state) -> 
            Assert.Equal("444", state.Issue)
            Assert.Equal(3, state.Criteria)
            Assert.Equal(WorkFlo.Types.Cover, state.Phase)
            Assert.Equal(5, state.Total)
        | Ok None -> Assert.True(false, "Should not return None for valid file")
        | Error _ -> Assert.True(false, "loadState should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``loadState returns None for missing file`` () =
    match loadState "/tmp/definitely-not-exists.state" with
    | Ok None -> Assert.True(true, "Should return None for missing file")
    | Ok (Some _) -> Assert.True(false, "Should not return state for missing file")
    | Error _ -> Assert.True(false, "Should return Ok None, not Error")

[<Fact>]
let ``parseArgs handles single command`` () =
    match WorkFlo.Program.parseArgs [|"status"|] with
    | Ok (cmd, args) ->
        Assert.Equal("status", cmd)
        Assert.Equal(0, args.Length)
    | Error _ -> Assert.True(false, "Should parse single command")

[<Fact>]
let ``parseArgs handles command with multiple arguments`` () =
    match WorkFlo.Program.parseArgs [|"start"; "123"; "extra"|] with
    | Ok (cmd, args) ->
        Assert.Equal("start", cmd)
        Assert.Equal(2, args.Length)
        Assert.Equal("123", args.[0])
        Assert.Equal("extra", args.[1])
    | Error _ -> Assert.True(false, "Should parse command with args")

[<Fact>]
let ``parseArgs handles empty array`` () =
    match WorkFlo.Program.parseArgs [||] with
    | Error msg -> Assert.True(msg.Contains("No command"))
    | Ok _ -> Assert.True(false, "Should return error for empty args")

[<Fact>]
let ``executeCommand Next advances to next criteria`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "333"; Criteria = 1; Phase = WorkFlo.Types.Cover; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Next context with
        | Ok message -> 
            Assert.True(message.Contains("criteria"))
            let newContent = System.IO.File.ReadAllText(stateFile)
            Assert.True(newContent.Contains("CRITERIA=2"))
            Assert.True(newContent.Contains("PHASE=Start"))
        | Error _ -> Assert.True(false, "Next should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

// ========================================
// BUSINESS REQUIREMENT TESTS - Not just coverage!
// Testing real WorkFlo TDD workflow scenarios
// ========================================

[<Fact>]
let ``Feature command provides complete automated workflow`` () =
    // BUSINESS REQUIREMENT: Feature command should give complete automated development flow
    let context = {
        ConfigFile = ".test-config"
        StateFile = ".test-state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand (Feature "456") context with
    | Ok message -> 
        Assert.True(message.Contains("automated feature development"))
        Assert.True(message.Contains("TDD workflow"))
        Assert.True(message.Contains("feature/issue-456"))
        Assert.True(message.Contains("PR created"))
        Assert.True(message.Contains("90% confident"))
    | Error err -> Assert.True(false, $"Feature should succeed, got: {err}")

[<Fact>]
let ``Complete TDD cycle from start to finish`` () =
    // BUSINESS REQUIREMENT: Full TDD cycle should work end-to-end
    let stateFile = System.IO.Path.GetTempFileName()
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        // Start TDD for issue 789
        match executeCommand (Start "789") context with
        | Ok startMsg -> 
            Assert.True(startMsg.Contains("Started TDD workflow for issue 789"))
            Assert.True(startMsg.Contains("START phase"))
        | Error _ -> Assert.True(false, "Start should succeed")
        
        // Go through complete Red → Green → Refactor → Cover cycle
        match executeCommand Red context with
        | Ok redMsg -> Assert.True(redMsg.Contains("RED Phase"))
        | Error _ -> Assert.True(false, "Red should succeed")
        
        match executeCommand Green context with
        | Ok greenMsg -> Assert.True(greenMsg.Contains("GREEN Phase"))
        | Error _ -> Assert.True(false, "Green should succeed")
        
        match executeCommand Refactor context with
        | Ok refactorMsg -> Assert.True(refactorMsg.Contains("REFACTOR Phase"))
        | Error _ -> Assert.True(false, "Refactor should succeed")
        
        match executeCommand Cover context with
        | Ok coverMsg -> Assert.True(coverMsg.Contains("COVER Phase"))
        | Error _ -> Assert.True(false, "Cover should succeed")
        
        // Advance to next criteria
        match executeCommand Next context with
        | Ok nextMsg -> 
            Assert.True(nextMsg.Contains("Criteria 1 completed"))
            Assert.True(nextMsg.Contains("Moving to criteria 2"))
        | Error _ -> Assert.True(false, "Next should succeed")
        
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``Invalid phase transitions give proper error messages`` () =
    // BUSINESS REQUIREMENT: Users should get clear error messages for invalid transitions
    let stateFile = System.IO.Path.GetTempFileName()
    let initialState = { Issue = "999"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let content = formatState initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        // Try to go Green from Start (should fail)
        match executeCommand Green context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to GREEN from Start"))
        | Ok _ -> Assert.True(false, "Green from Start should fail")
        
        // Try to go Cover from Start (should fail)
        match executeCommand Cover context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to COVER from Start"))
        | Ok _ -> Assert.True(false, "Cover from Start should fail")
        
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``Next command completes all criteria properly`` () =
    // BUSINESS REQUIREMENT: Next command should handle completion of final criteria
    let stateFile = System.IO.Path.GetTempFileName()
    let finalState = { Issue = "555"; Criteria = 3; Phase = WorkFlo.Types.Cover; Total = 3 }
    let content = formatState finalState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Next context with
        | Ok message -> 
            Assert.True(message.Contains("All criteria completed"))
            Assert.True(message.Contains("TDD cycle finished"))
            Assert.True(message.Contains("issue 555"))
        | Error _ -> Assert.True(false, "Next should complete final criteria")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``Commands without active session give proper guidance`` () =
    // BUSINESS REQUIREMENT: Clear guidance when no TDD session exists
    let context = {
        ConfigFile = ".test-config"
        StateFile = "/tmp/non-existent-session.state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand Red context with
    | Error msg -> 
        Assert.True(msg.Contains("No active TDD session"))
        Assert.True(msg.Contains("start <issue>"))
    | Ok _ -> Assert.True(false, "Red without session should fail")
    
    match executeCommand Next context with
    | Error msg -> 
        Assert.True(msg.Contains("No active TDD session"))
        Assert.True(msg.Contains("start <issue>"))
    | Ok _ -> Assert.True(false, "Next without session should fail")

[<Fact>]
let ``Status command shows detailed session information`` () =
    // BUSINESS REQUIREMENT: Status should show all relevant TDD session details
    let stateFile = System.IO.Path.GetTempFileName()
    let currentState = { Issue = "888"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 5 }
    let content = formatState currentState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Status context with
        | Ok status -> 
            Assert.True(status.Contains("TDD Session Status"))
            Assert.True(status.Contains("Issue: 888"))
            Assert.True(status.Contains("Criteria: 2/5"))
            Assert.True(status.Contains("Phase: Green"))
            Assert.True(status.Contains("help"))
        | Error _ -> Assert.True(false, "Status should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``Help command provides complete usage information`` () =
    // BUSINESS REQUIREMENT: Help should guide users through all available commands
    let context = {
        ConfigFile = ".test-config"
        StateFile = ".test-state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand Help context with
    | Ok help -> 
        Assert.True(help.Contains("Usage: flo"))
        Assert.True(help.Contains("feature <issue>"))
        Assert.True(help.Contains("start <issue>"))
        Assert.True(help.Contains("red"))
        Assert.True(help.Contains("green"))
        Assert.True(help.Contains("refactor"))
        Assert.True(help.Contains("cover"))
        Assert.True(help.Contains("next"))
        Assert.True(help.Contains("status"))
        Assert.True(help.Contains("F# Implementation"))
    | Error _ -> Assert.True(false, "Help should always succeed")

[<Fact>]
let ``parseCommand validates required arguments`` () =
    // BUSINESS REQUIREMENT: Commands requiring arguments should validate them
    match parseCommand "start" [||] with
    | Error msg -> Assert.True(msg.Contains("Usage: start <issue_number>"))
    | Ok _ -> Assert.True(false, "Start without args should fail")
    
    match parseCommand "feature" [||] with
    | Error msg -> Assert.True(msg.Contains("Usage: feature <issue_number>"))
    | Ok _ -> Assert.True(false, "Feature without args should fail")
    
    match parseCommand "unknown" [||] with
    | Error msg -> Assert.True(msg.Contains("Unknown command: unknown"))
    | Ok _ -> Assert.True(false, "Unknown command should fail")

[<Fact>]
let ``Issue validation enforces business rules`` () =
    // BUSINESS REQUIREMENT: Issue numbers must be positive integers
    match validateIssueNumber "0" with
    | Error msg -> Assert.True(msg.Contains("positive"))
    | Ok _ -> Assert.True(false, "Zero issue should be rejected")
    
    match validateIssueNumber "-5" with
    | Error msg -> Assert.True(msg.Contains("positive"))
    | Ok _ -> Assert.True(false, "Negative issue should be rejected")
    
    match validateIssueNumber "abc" with
    | Error msg -> Assert.True(msg.Contains("valid number"))
    | Ok _ -> Assert.True(false, "Non-numeric issue should be rejected")
    
    match validateIssueNumber "" with
    | Error msg -> Assert.True(msg.Contains("empty"))
    | Ok _ -> Assert.True(false, "Empty issue should be rejected")

[<Fact>]
let ``Next command prevents advancement from wrong phases`` () =
    // BUSINESS REQUIREMENT: Next should only work from Cover phase
    let stateFile = System.IO.Path.GetTempFileName()
    let startState = { Issue = "777"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let content = formatState startState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Next context with
        | Error msg -> 
            Assert.True(msg.Contains("Cannot advance criteria from Start phase"))
            Assert.True(msg.Contains("Complete COVER phase first"))
        | Ok _ -> Assert.True(false, "Next from Start should fail")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``TDD workflow enforces correct phase sequence`` () =
    // BUSINESS REQUIREMENT: TDD must follow Start → Red → Green → Refactor → Cover sequence
    let stateFile = System.IO.Path.GetTempFileName()
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        // Start with valid issue
        match executeCommand (Start "999") context with
        | Ok _ -> ()
        | Error _ -> Assert.True(false, "Start should succeed")
        
        // Try to skip Red and go directly to Refactor (should fail)
        match executeCommand Refactor context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to REFACTOR from Start"))
        | Ok _ -> Assert.True(false, "Should not skip Red and Green phases")
        
        // Proper Red phase
        match executeCommand Red context with
        | Ok _ -> ()
        | Error _ -> Assert.True(false, "Red should succeed from Start")
        
        // Try to skip Green and go to Cover (should fail)
        match executeCommand Cover context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to COVER from Red"))
        | Ok _ -> Assert.True(false, "Should not skip Green and Refactor phases")
        
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``File I/O errors are handled gracefully`` () =
    // BUSINESS REQUIREMENT: File operations should fail gracefully
    let readOnlyDir = "/proc/version"  // This is read-only, can't write here
    let context = {
        ConfigFile = ".test-config"
        StateFile = readOnlyDir
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match executeCommand (Start "123") context with
    | Error msg -> Assert.True(msg.Length > 0)  // Should get an error message
    | Ok _ -> Assert.True(false, "Writing to read-only should fail")

[<Fact>]
let ``Corrupted state file handling`` () =
    // BUSINESS REQUIREMENT: Corrupted state files should be handled gracefully
    let stateFile = System.IO.Path.GetTempFileName()
    System.IO.File.WriteAllText(stateFile, "INVALID_STATE_CONTENT_NOT_PARSEABLE")
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match executeCommand Status context with
        | Error msg -> Assert.True(msg.Length > 0)  // Should handle parsing error
        | Ok _ -> Assert.True(false, "Corrupted state should fail gracefully")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``Environment variables affect context creation`` () =
    // BUSINESS REQUIREMENT: Debug and Verbose flags should be configurable
    let originalDebug = System.Environment.GetEnvironmentVariable("TDD_DEBUG")
    let originalVerbose = System.Environment.GetEnvironmentVariable("TDD_VERBOSE")
    
    try
        System.Environment.SetEnvironmentVariable("TDD_DEBUG", "1")
        System.Environment.SetEnvironmentVariable("TDD_VERBOSE", "1")
        
        let context = WorkFlo.Program.createContext()
        Assert.True(context.Debug)
        Assert.True(context.Verbose)
        
        System.Environment.SetEnvironmentVariable("TDD_DEBUG", "0")
        System.Environment.SetEnvironmentVariable("TDD_VERBOSE", "0")
        
        let context2 = WorkFlo.Program.createContext()
        Assert.False(context2.Debug)
        Assert.False(context2.Verbose)
        
    finally
        // Restore original values
        System.Environment.SetEnvironmentVariable("TDD_DEBUG", originalDebug)
        System.Environment.SetEnvironmentVariable("TDD_VERBOSE", originalVerbose)

[<Fact>]
let ``Case insensitive command parsing`` () =
    // BUSINESS REQUIREMENT: Commands should work regardless of case
    match parseCommand "START" [|"123"|] with
    | Ok (Start "123") -> Assert.True(true)
    | _ -> Assert.True(false, "START should parse as Start")
    
    match parseCommand "Red" [||] with
    | Ok Red -> Assert.True(true)
    | _ -> Assert.True(false, "Red should parse")
    
    match parseCommand "GREEN" [||] with
    | Ok Green -> Assert.True(true)
    | _ -> Assert.True(false, "GREEN should parse as Green")

[<Fact>]
let ``State persistence maintains all fields correctly`` () =
    // BUSINESS REQUIREMENT: State must persist all fields accurately
    let stateFile = System.IO.Path.GetTempFileName()
    let originalState = { Issue = "999"; Criteria = 3; Phase = WorkFlo.Types.Refactor; Total = 5 }
    
    try
        // Save state
        match saveState stateFile originalState with
        | Ok () -> ()
        | Error _ -> Assert.True(false, "Save should succeed")
        
        // Load state
        match loadState stateFile with
        | Ok (Some loadedState) ->
            Assert.Equal(originalState.Issue, loadedState.Issue)
            Assert.Equal(originalState.Criteria, loadedState.Criteria)
            Assert.Equal(originalState.Phase, loadedState.Phase)
            Assert.Equal(originalState.Total, loadedState.Total)
        | _ -> Assert.True(false, "Load should succeed and return state")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``main function handles success cases correctly`` () =
    // BUSINESS REQUIREMENT: Main should return 0 exit code for successful operations
    let result = WorkFlo.Program.main [|"help"|]
    Assert.Equal(0, result)

[<Fact>]
let ``main function handles error cases correctly`` () =
    // BUSINESS REQUIREMENT: Main should return 1 exit code for errors
    let result = WorkFlo.Program.main [|"invalid-command"|]
    Assert.Equal(1, result)

[<Fact>]
let ``main function handles empty arguments`` () =
    // BUSINESS REQUIREMENT: Main should return error code for no arguments
    let result = WorkFlo.Program.main [||]
    Assert.Equal(1, result)

[<Fact>]
let ``Advanced TDD progress assessment works`` () =
    // BUSINESS REQUIREMENT: Advanced pattern matching should assess TDD progress
    let startState = { Issue = "123"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let result = WorkFlo.Advanced.assessTddProgress startState
    Assert.True(result.Contains("Beginning TDD journey"))
    
    let finalState = { Issue = "456"; Criteria = 3; Phase = WorkFlo.Types.Cover; Total = 3 }
    let finalResult = WorkFlo.Advanced.assessTddProgress finalState
    Assert.True(finalResult.Contains("All criteria complete"))

[<Fact>]
let ``Active patterns validate issue numbers`` () =
    // BUSINESS REQUIREMENT: Active patterns should provide custom validation logic
    let validResult = WorkFlo.Advanced.processIssueInput "123"
    Assert.True(validResult.Contains("Valid issue: 123"))
    
    let invalidResult = WorkFlo.Advanced.processIssueInput "abc"
    Assert.True(invalidResult.Contains("Invalid:"))
    
    let outOfRangeResult = WorkFlo.Advanced.processIssueInput "99999"
    Assert.True(outOfRangeResult.Contains("Invalid:"))

[<Fact>]
let ``Phase advice provides context-specific guidance`` () =
    // BUSINESS REQUIREMENT: Phase advice should guide users through TDD workflow
    let redState = { Issue = "789"; Criteria = 2; Phase = WorkFlo.Types.Red; Total = 3 }
    let redAdvice = WorkFlo.Advanced.getPhaseAdvice redState
    Assert.True(redAdvice.Contains("Write failing test"))
    
    let greenState = { Issue = "789"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 3 }
    let greenAdvice = WorkFlo.Advanced.getPhaseAdvice greenState
    Assert.True(greenAdvice.Contains("Implement minimal code"))

[<Fact>]
let ``TDD strategy adapts to session progress`` () =
    // BUSINESS REQUIREMENT: Strategy should change based on session state
    let earlyState = { Issue = "111"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 5 }
    let earlyStrategy = WorkFlo.Advanced.getTddStrategy earlyState
    Assert.True(earlyStrategy.Contains("understanding requirements"))
    
    let lateState = { Issue = "222"; Criteria = 4; Phase = WorkFlo.Types.Cover; Total = 5 }
    let lateStrategy = WorkFlo.Advanced.getTddStrategy lateState
    Assert.True(lateStrategy.Contains("Perfect your implementation"))

[<Fact>]
let ``Session analysis provides meaningful feedback`` () =
    // BUSINESS REQUIREMENT: Session analysis should help improve TDD practice
    let perfectSession : WorkFlo.Advanced.TddSession = {
        State = { Issue = "333"; Criteria = 3; Phase = WorkFlo.Types.Cover; Total = 3 }
        StartTime = System.DateTime.Now.AddHours(-1.0)
        TestRuns = 10
        FailedTests = 0
    }
    let perfectResult = WorkFlo.Advanced.analyzeSession perfectSession
    Assert.True(perfectResult.Contains("Perfect session"))
    
    let problemSession : WorkFlo.Advanced.TddSession = {
        State = { Issue = "444"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 3 }
        StartTime = System.DateTime.Now.AddHours(-3.0)
        TestRuns = 2
        FailedTests = 2
    }
    let problemResult = WorkFlo.Advanced.analyzeSession problemSession
    Assert.True(problemResult.Contains("Long session") || problemResult.Contains("Many failing tests"))

[<Fact>]
let ``TDD history analysis tracks patterns`` () =
    // BUSINESS REQUIREMENT: History analysis should identify productive patterns
    let emptyHistory = WorkFlo.Advanced.analyzeTddHistory []
    Assert.True(emptyHistory.Contains("No TDD history"))
    
    let singleSession = [{ Issue = "555"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 1 }]
    let singleResult = WorkFlo.Advanced.analyzeTddHistory singleSession
    Assert.True(singleResult.Contains("Single session"))
    
    let multiSession = [
        { Issue = "666"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        { Issue = "666"; Criteria = 2; Phase = WorkFlo.Types.Red; Total = 3 }
    ]
    let multiResult = WorkFlo.Advanced.analyzeTddHistory multiSession
    Assert.True(multiResult.Contains("Multiple criteria in same issue"))

// ========================================
// ADVANCED PATTERN MATCHING EDGE CASES
// Testing uncovered branches and conditions
// ========================================

[<Fact>]
let ``assessTddProgress handles error conditions`` () =
    // BUSINESS REQUIREMENT: Should detect invalid criteria exceeding total
    let errorState = { Issue = "999"; Criteria = 5; Phase = WorkFlo.Types.Start; Total = 3 }
    let result = WorkFlo.Advanced.assessTddProgress errorState
    Assert.True(result.Contains("ERROR: Criteria exceeds total"))

[<Fact>]
let ``assessTddProgress handles final criteria start state`` () =
    // BUSINESS REQUIREMENT: Should recognize when starting final acceptance criteria
    let finalStartState = { Issue = "888"; Criteria = 3; Phase = WorkFlo.Types.Start; Total = 3 }
    let result = WorkFlo.Advanced.assessTddProgress finalStartState
    Assert.True(result.Contains("Starting final acceptance criteria"))

[<Fact>]
let ``assessTddProgress provides generic progress info`` () =
    // BUSINESS REQUIREMENT: Should provide progress info for any phase
    let midState = { Issue = "777"; Criteria = 2; Phase = WorkFlo.Types.Refactor; Total = 4 }
    let result = WorkFlo.Advanced.assessTddProgress midState
    Assert.True(result.Contains("Phase: Refactor, Progress: 2/4"))

[<Fact>]
let ``processIssueInput handles out of range issues`` () =
    // BUSINESS REQUIREMENT: Should reject issue numbers outside valid range
    let outOfRangeResult = WorkFlo.Advanced.processIssueInput "50000"
    Assert.True(outOfRangeResult.Contains("Invalid: Issue number out of range"))

[<Fact>]
let ``getPhaseAdvice handles all phase types`` () =
    // BUSINESS REQUIREMENT: Should provide advice for Refactor and Cover phases
    let refactorState = { Issue = "111"; Criteria = 1; Phase = WorkFlo.Types.Refactor; Total = 3 }
    let refactorAdvice = WorkFlo.Advanced.getPhaseAdvice refactorState
    Assert.True(refactorAdvice.Contains("Clean up and improve code quality"))
    
    let coverState = { Issue = "222"; Criteria = 1; Phase = WorkFlo.Types.Cover; Total = 3 }
    let coverAdvice = WorkFlo.Advanced.getPhaseAdvice coverState
    Assert.True(coverAdvice.Contains("Add comprehensive test coverage"))
    
    let defaultState = { Issue = "333"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let defaultAdvice = WorkFlo.Advanced.getPhaseAdvice defaultState
    Assert.True(defaultAdvice.Contains("Plan your next TDD step"))

[<Fact>]
let ``getTddStrategy covers all strategy phases`` () =
    // BUSINESS REQUIREMENT: Strategy should adapt to different project phases
    let completeState = { Issue = "444"; Criteria = 5; Phase = WorkFlo.Types.Cover; Total = 5 }
    let completeStrategy = WorkFlo.Advanced.getTddStrategy completeState
    Assert.True(completeStrategy.Contains("Excellent work! Ready for the next feature"))

[<Fact>]
let ``analyzeSession covers all session scenarios`` () =
    // BUSINESS REQUIREMENT: Session analysis should handle various problematic patterns
    let manyFailuresSession : WorkFlo.Advanced.TddSession = {
        State = { Issue = "555"; Criteria = 1; Phase = WorkFlo.Types.Green; Total = 3 }
        StartTime = System.DateTime.Now.AddHours(-1.0)
        TestRuns = 10
        FailedTests = 8  // More than half failed
    }
    let failureResult = WorkFlo.Advanced.analyzeSession manyFailuresSession
    Assert.True(failureResult.Contains("Many failing tests"))
    
    let redPhaseNoTestsSession : WorkFlo.Advanced.TddSession = {
        State = { Issue = "666"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 3 }
        StartTime = System.DateTime.Now
        TestRuns = 0
        FailedTests = 0
    }
    let noTestsResult = WorkFlo.Advanced.analyzeSession redPhaseNoTestsSession
    Assert.True(noTestsResult.Contains("Remember to run tests in RED phase"))
    
    let normalSession : WorkFlo.Advanced.TddSession = {
        State = { Issue = "777"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 3 }
        StartTime = System.DateTime.Now.AddMinutes(-30.0)
        TestRuns = 5
        FailedTests = 1
    }
    let normalResult = WorkFlo.Advanced.analyzeSession normalSession
    Assert.True(normalResult.Contains("Session progressing normally"))

[<Fact>]
let ``analyzeTddHistory handles productive sessions`` () =
    // BUSINESS REQUIREMENT: Should recognize productive patterns with many sessions
    let productiveHistory = [
        { Issue = "100"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        { Issue = "101"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 2 }
        { Issue = "102"; Criteria = 1; Phase = WorkFlo.Types.Green; Total = 4 }
        { Issue = "103"; Criteria = 1; Phase = WorkFlo.Types.Refactor; Total = 1 }
        { Issue = "104"; Criteria = 1; Phase = WorkFlo.Types.Cover; Total = 2 }
        { Issue = "105"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        { Issue = "106"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 1 }
    ]
    let productiveResult = WorkFlo.Advanced.analyzeTddHistory productiveHistory
    Assert.True(productiveResult.Contains("Productive! 7 TDD sessions"))

[<Fact>]
let ``parseCommand handles case sensitivity edge cases`` () =
    // BUSINESS REQUIREMENT: All command variations should be accepted
    match parseCommand "FEATURE" [|"789"|] with
    | Ok (Feature "789") -> Assert.True(true)
    | _ -> Assert.True(false, "FEATURE should parse as Feature")
    
    match parseCommand "STATUS" [||] with
    | Ok Status -> Assert.True(true)
    | _ -> Assert.True(false, "STATUS should parse as Status")
    
    match parseCommand "NEXT" [||] with
    | Ok Next -> Assert.True(true)
    | _ -> Assert.True(false, "NEXT should parse as Next")

[<Fact>]
let ``executeCommand handles all error conditions`` () =
    // BUSINESS REQUIREMENT: Commands should fail gracefully in invalid states
    let context = {
        ConfigFile = ".test-config"
        StateFile = "/tmp/non-existent-test.state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    // Test all commands that require active session
    match executeCommand Green context with
    | Error msg -> Assert.True(msg.Contains("No active TDD session"))
    | Ok _ -> Assert.True(false, "Green without session should fail")
    
    match executeCommand Refactor context with
    | Error msg -> Assert.True(msg.Contains("No active TDD session"))
    | Ok _ -> Assert.True(false, "Refactor without session should fail")
    
    match executeCommand Cover context with
    | Error msg -> Assert.True(msg.Contains("No active TDD session"))
    | Ok _ -> Assert.True(false, "Cover without session should fail")

[<Fact>]
let ``saveState and loadState handle file operations robustly`` () =
    // BUSINESS REQUIREMENT: State persistence should be reliable
    let tempFile = System.IO.Path.GetTempFileName()
    let complexState = { Issue = "COMPLEX-999"; Criteria = 42; Phase = WorkFlo.Types.Cover; Total = 100 }
    
    try
        // Test successful save/load cycle
        match saveState tempFile complexState with
        | Ok () -> ()
        | Error _ -> Assert.True(false, "Save should succeed")
        
        match loadState tempFile with
        | Ok (Some loadedState) ->
            Assert.Equal(complexState.Issue, loadedState.Issue)
            Assert.Equal(complexState.Criteria, loadedState.Criteria)
            Assert.Equal(complexState.Phase, loadedState.Phase)
            Assert.Equal(complexState.Total, loadedState.Total)
        | _ -> Assert.True(false, "Load should succeed")
        
        // Test loading non-existent file returns None
        match loadState "/tmp/definitely-does-not-exist-12345.state" with
        | Ok None -> Assert.True(true)
        | _ -> Assert.True(false, "Non-existent file should return None")
        
    finally
        if System.IO.File.Exists(tempFile) then System.IO.File.Delete(tempFile)

// ========================================
// FINAL COVERAGE PUSH - Remaining Edge Cases
// ========================================

[<Fact>]
let ``parseCommand covers all command variations`` () =
    // BUSINESS REQUIREMENT: Comprehensive command parsing coverage
    match parseCommand "COVER" [||] with
    | Ok Cover -> Assert.True(true)
    | _ -> Assert.True(false, "COVER should parse")
    
    match parseCommand "REFACTOR" [||] with
    | Ok Refactor -> Assert.True(true)
    | _ -> Assert.True(false, "REFACTOR should parse")

[<Fact>]
let ``Core validation covers error paths`` () =
    // BUSINESS REQUIREMENT: Core validation should handle all error conditions
    match tryParseInt "2147483648" with  // Int32.MaxValue + 1
    | None -> Assert.True(true)
    | Some _ -> Assert.True(false, "Should fail for overflow")

[<Fact>]
let ``parseStateContent handles malformed input`` () =
    // BUSINESS REQUIREMENT: State parsing should handle malformed content gracefully
    match parseStateContent "ISSUE=123\nCRITERIA=not_a_number\nPHASE=Start\nTOTAL=3\n" with
    | Error msg -> Assert.True(msg.Contains("Invalid criteria or total numbers"))
    | Ok _ -> Assert.True(false, "Should fail for invalid criteria")
    
    match parseStateContent "ISSUE=123\nCRITERIA=2\nPHASE=InvalidPhase\nTOTAL=3\n" with
    | Error msg -> Assert.True(msg.Contains("Unknown phase"))
    | Ok _ -> Assert.True(false, "Should fail for invalid phase")

[<Fact>]
let ``entryPoint function delegates to main`` () =
    // BUSINESS REQUIREMENT: Entry point should properly delegate to main function
    let result = WorkFlo.Program.entryPoint [|"help"|]
    Assert.Equal(0, result)

[<Fact>]
let ``all command error scenarios work`` () =
    // BUSINESS REQUIREMENT: Comprehensive error handling for all commands
    let stateFile = System.IO.Path.GetTempFileName()
    let wrongPhaseState = { Issue = "999"; Criteria = 1; Phase = WorkFlo.Types.Cover; Total = 3 }
    let content = formatState wrongPhaseState
    System.IO.File.WriteAllText(stateFile, content)
    
    let context = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        // Red from Cover should fail
        match executeCommand Red context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to RED from Cover"))
        | Ok _ -> Assert.True(false, "Red from Cover should fail")
        
        // Green from Cover should fail  
        match executeCommand Green context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to GREEN from Cover"))
        | Ok _ -> Assert.True(false, "Green from Cover should fail")
        
        // Refactor from Cover should fail
        match executeCommand Refactor context with
        | Error msg -> Assert.True(msg.Contains("Cannot transition to REFACTOR from Cover"))
        | Ok _ -> Assert.True(false, "Refactor from Cover should fail")
        
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``nextCriteria handles boundary conditions`` () =
    // BUSINESS REQUIREMENT: nextCriteria should handle edge cases properly
    let maxState = { Issue = "999"; Criteria = 999; Phase = WorkFlo.Types.Cover; Total = 1000 }
    let result = nextCriteria maxState
    Assert.Equal(1000, result.Criteria)
    Assert.Equal(WorkFlo.Types.Start, result.Phase)

[<Fact>]
let ``writeAllText and readAllText error handling`` () =
    // BUSINESS REQUIREMENT: File I/O should handle permission errors
    match writeAllText "/proc/version" "test" with
    | Error msg -> Assert.True(msg.Length > 0)
    | Ok _ -> Assert.True(false, "Should fail to write to read-only file")

[<Fact>]
let ``Advanced patterns handle all edge cases`` () =
    // BUSINESS REQUIREMENT: Advanced patterns should cover all logical branches
    
    // Test the incomplete pattern match in Advanced.fs line 64
    let middlePhaseState = { Issue = "123"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 4 }
    let strategy = WorkFlo.Advanced.getTddStrategy middlePhaseState
    Assert.True(strategy.Length > 0)  // Should not crash, should return something
    
    // Test all partial active pattern cases
    let redState = { Issue = "456"; Criteria = 1; Phase = WorkFlo.Types.Red; Total = 3 }
    let greenState = { Issue = "789"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 3 }
    
    let redAdvice = WorkFlo.Advanced.getPhaseAdvice redState
    let greenAdvice = WorkFlo.Advanced.getPhaseAdvice greenState
    
    Assert.True(redAdvice.Contains("failing test"))
    Assert.True(greenAdvice.Contains("minimal code"))

[<Fact>]
let ``processCommand integration with all error paths`` () =
    // BUSINESS REQUIREMENT: Full integration should handle all error combinations
    let context = {
        ConfigFile = ".test-config"
        StateFile = "/tmp/integration-test.state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    // Invalid command
    match processCommand "invalid" [||] context with
    | Error msg -> Assert.True(msg.Contains("Unknown command"))
    | Ok _ -> Assert.True(false, "Invalid command should fail")
    
    // Command with wrong arguments
    match processCommand "start" [||] context with
    | Error msg -> Assert.True(msg.Contains("Usage: start"))
    | Ok _ -> Assert.True(false, "Start without args should fail")

[<Fact>]
let ``runApp comprehensive integration`` () =
    // BUSINESS REQUIREMENT: runApp should handle complete end-to-end scenarios
    
    // Test successful feature command
    match WorkFlo.Program.runApp [|"feature"; "12345"|] with
    | Ok message -> Assert.True(message.Contains("automated feature development"))
    | Error _ -> Assert.True(false, "Feature should succeed")
    
    // Test invalid command args
    match WorkFlo.Program.runApp [|"start"|] with
    | Error msg -> Assert.True(msg.Contains("Usage: start"))
    | Ok _ -> Assert.True(false, "Start without args should fail")
    
    // Test completely invalid command
    match WorkFlo.Program.runApp [|"nonexistent"|] with
    | Error msg -> Assert.True(msg.Contains("Unknown command"))
    | Ok _ -> Assert.True(false, "Invalid command should fail")
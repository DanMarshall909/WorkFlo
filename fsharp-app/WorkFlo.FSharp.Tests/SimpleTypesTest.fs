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
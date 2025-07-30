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
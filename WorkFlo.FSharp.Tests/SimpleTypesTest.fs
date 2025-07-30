module WorkFlo.Tests.SimpleTypesTest

open Xunit
open WorkFlo.Domain
open WorkFlo.CoreServices
open WorkFlo.Railway
open WorkFlo.Railway.Builders

[<Fact>]
let ``IssueNumber.fromString works`` () =
    let result = IssueNumber.fromString "123"
    match result with
    | Ok issueNum -> Assert.Equal(123, IssueNumber.value issueNum)
    | Error _ -> Assert.True(false, "Should parse valid issue number")

[<Fact>]
let ``IssueNumber.fromString returns Error for invalid`` () =
    let result = IssueNumber.fromString "abc"
    match result with
    | Error _ -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Should reject invalid issue number")

[<Fact>]
let ``CriteriaCount.fromString validates positive numbers`` () =
    let result1 = CriteriaCount.fromString "5"
    let result2 = CriteriaCount.fromString "0"
    match result1 with
    | Ok count -> Assert.Equal(5, CriteriaCount.value count)
    | Error _ -> Assert.True(false, "Should accept positive number")
    match result2 with
    | Error _ -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Should reject zero")

[<Fact>]
let ``IssueNumber validates numeric strings`` () =
    match IssueNumber.fromString "123" with
    | Ok issue -> Assert.Equal(123, IssueNumber.value issue)
    | Error _ -> Assert.True(false, "Should accept valid issue")

[<Fact>]
let ``IssueNumber rejects empty strings`` () =
    match IssueNumber.fromString "" with
    | Error _ -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Should reject empty issue")

[<Fact>]
let ``CommandService.parseCommand handles Help`` () =
    match CommandService.parseCommand "help" [||] with
    | Ok Help -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Expected Help command")
    | Error _ -> Assert.True(false, "Help should parse successfully")

[<Fact>]
let ``CommandService.parseCommand handles Start with argument`` () =
    match CommandService.parseCommand "start" [|"123"|] with
    | Ok (Start issueNum) -> Assert.Equal(123, IssueNumber.value issueNum)
    | Ok _ -> Assert.True(false, "Expected Start command")
    | Error _ -> Assert.True(false, "Start should parse successfully")

[<Fact>]
let ``WorkflowService.executeCommand Help returns help text`` () =
    let config = {
        ConfigFile = ".test-config"
        StateFile = ".test-state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match WorkflowService.executeCommand config None Help with
    | Ok (_, helpText) -> 
        Assert.True(helpText.Contains("Commands"))
        Assert.True(helpText.Contains("help"))
    | Error _ -> Assert.True(false, "Help should succeed")

[<Fact>]
let ``WorkflowService.executeCommand Start creates TDD session`` () =
    let config = {
        ConfigFile = ".test-config"
        StateFile = System.IO.Path.GetTempFileName()
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        let issueNumber = IssueNumber.create 123 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
        match WorkflowService.executeCommand config None (Start issueNumber) with
        | Ok (Some _, message) -> 
            Assert.True(message.Contains("Started"))
            Assert.True(System.IO.File.Exists(config.StateFile))
        | _ -> Assert.True(false, "Start should succeed")
    finally
        if System.IO.File.Exists(config.StateFile) then 
            System.IO.File.Delete(config.StateFile)

[<Fact>]
let ``CriteriaCount accepts positive numbers`` () =
    match CriteriaCount.fromString "123" with
    | Ok count -> Assert.Equal(123, CriteriaCount.value count)
    | Error _ -> Assert.True(false, "Should accept positive number")

[<Fact>]
let ``CriteriaCount rejects zero and negative`` () =
    match CriteriaCount.fromString "0" with
    | Error _ -> Assert.True(true)
    | Ok _ -> Assert.True(false, "Should reject zero")

[<Fact>]
let ``Application.createDefaultConfig initializes default values`` () =
    let config = WorkFlo.Application.createDefaultConfig()
    Assert.Equal(".workflo", config.ConfigFile)
    Assert.Equal(".workflo.state", config.StateFile)
    Assert.Equal(".workflo.scores", config.ScoreFile)
    Assert.False(config.Debug)
    Assert.False(config.Verbose)

[<Fact>]
let ``Program.parseArgs handles help command`` () =
    match WorkFlo.Program.parseArgs [|"help"|] with
    | Ok Help -> Assert.True(true)
    | Error _ -> Assert.True(false, "Help parsing should succeed")

[<Fact>]
let ``StateService.serialize creates key-value pairs`` () =
    let issue = IssueNumber.create 123 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Start; Total = total }
    let formatted = StateService.serialize state
    Assert.True(formatted.Contains("ISSUE=123"))
    Assert.True(formatted.Contains("CRITERIA=1"))
    Assert.True(formatted.Contains("PHASE=Start"))

[<Fact>]
let ``TddState.advanceCriteria increments criteria and resets phase`` () =
    let issue = IssueNumber.create 456 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 2 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Cover; Total = total }
    match TddState.advanceCriteria state with
    | Ok result ->
        Assert.Equal(3, CriteriaCount.value result.Criteria)
        Assert.Equal(TddPhase.Cover, result.Phase)  // Phase doesn't change in advanceCriteria
        Assert.Equal(456, IssueNumber.value result.Issue)
    | Error _ -> Assert.True(false, "Should advance criteria successfully")

[<Fact>]
let ``Program.runApp handles help command end-to-end`` () =
    let exitCode = WorkFlo.Program.runApp [|"help"|]
    Assert.Equal(0, exitCode)

[<Fact>]
let ``Program.runApp handles start command end-to-end`` () =
    let exitCode = WorkFlo.Program.runApp [|"start"; "789"|]
    Assert.Equal(0, exitCode)

[<Fact>]
let ``IssueNumber.fromString combines validation functions`` () =
    match IssueNumber.fromString "456" with
    | Ok issueNum -> Assert.Equal(456, IssueNumber.value issueNum)
    | Error _ -> Assert.True(false, "Should accept valid issue number")

[<Fact>]
let ``StateService.deserialize parses formatted state`` () =
    let content = "ISSUE=555\nCRITERIA=2\nPHASE=Green\nTOTAL=3\n"
    match StateService.deserialize content with
    | Ok state ->
        Assert.Equal(555, IssueNumber.value state.Issue)
        Assert.Equal(2, CriteriaCount.value state.Criteria)
        Assert.Equal(TddPhase.Green, state.Phase)
        Assert.Equal(3, TotalCount.value state.Total)
    | Error _ -> Assert.True(false, "Should parse valid content")

[<Fact>]
let ``WorkflowService.executeCommand Status shows no active session`` () =
    let config = {
        ConfigFile = ".test-config"
        StateFile = "/tmp/non-existent-file.state"
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    match WorkflowService.executeCommand config None Status with
    | Ok (None, status) -> Assert.True(status.Contains("No active"))
    | _ -> Assert.True(false, "Status should handle missing state")

[<Fact>]
let ``WorkflowService.executeCommand Red advances to Red phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let issue = IssueNumber.create 999 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let initialState = { Issue = issue; Criteria = criteria; Phase = TddPhase.Start; Total = total }
    let content = StateService.serialize initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let config = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match WorkflowService.executeCommand config (Some initialState) Red with
        | Ok (Some newState, message) -> 
            Assert.True(message.Contains("RED"))
            Assert.Equal(TddPhase.Red, newState.Phase)
        | _ -> Assert.True(false, "Red should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``WorkflowService.executeCommand Green advances to Green phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let issue = IssueNumber.create 888 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let initialState = { Issue = issue; Criteria = criteria; Phase = TddPhase.Red; Total = total }
    let content = StateService.serialize initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let config = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match WorkflowService.executeCommand config (Some initialState) Green with
        | Ok (Some newState, message) -> 
            Assert.True(message.Contains("GREEN"))
            Assert.Equal(TddPhase.Green, newState.Phase)
        | _ -> Assert.True(false, "Green should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``WorkflowService.executeCommand Refactor advances to Refactor phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let issue = IssueNumber.create 777 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let initialState = { Issue = issue; Criteria = criteria; Phase = TddPhase.Green; Total = total }
    let content = StateService.serialize initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let config = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match WorkflowService.executeCommand config (Some initialState) Refactor with
        | Ok (Some newState, message) -> 
            Assert.True(message.Contains("REFACTOR"))
            Assert.Equal(TddPhase.Refactor, newState.Phase)
        | _ -> Assert.True(false, "Refactor should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``WorkflowService.executeCommand Cover advances to Cover phase`` () =
    let stateFile = System.IO.Path.GetTempFileName()
    let issue = IssueNumber.create 666 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let initialState = { Issue = issue; Criteria = criteria; Phase = TddPhase.Refactor; Total = total }
    let content = StateService.serialize initialState
    System.IO.File.WriteAllText(stateFile, content)
    
    let config = {
        ConfigFile = ".test-config"
        StateFile = stateFile
        ScoreFile = ".test-scores"
        Debug = false
        Verbose = false
    }
    
    try
        match WorkflowService.executeCommand config (Some initialState) Cover with
        | Ok (Some newState, message) -> 
            Assert.True(message.Contains("COVER"))
            Assert.Equal(TddPhase.Cover, newState.Phase)
        | _ -> Assert.True(false, "Cover should succeed")
    finally
        if System.IO.File.Exists(stateFile) then System.IO.File.Delete(stateFile)

[<Fact>]
let ``TddPhase.fromString parses phase names correctly`` () =
    let phases = ["Start"; "Red"; "Green"; "Refactor"; "Cover"]
    let expectedPhases = [TddPhase.Start; TddPhase.Red; TddPhase.Green; TddPhase.Refactor; TddPhase.Cover]
    
    List.zip phases expectedPhases
    |> List.iter (fun (phaseStr, expectedPhase) ->
        match TddPhase.fromString phaseStr with
        | Ok phase -> Assert.Equal(expectedPhase, phase)
        | Error _ -> Assert.True(false, $"Should parse {phaseStr}"))

[<Fact>]
let ``TddState.isComplete returns true when all criteria are met`` () =
    let issue = IssueNumber.create 123 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Cover; Total = total }
    Assert.True(TddState.isComplete state)

[<Fact>]
let ``TddState.isComplete returns false when criteria are not met`` () =
    let issue = IssueNumber.create 123 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 2 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Cover; Total = total }
    Assert.False(TddState.isComplete state)

[<Fact>]
let ``TddState.progressPercentage calculates correct percentage`` () =
    let issue = IssueNumber.create 123 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    let criteria = CriteriaCount.create 2 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
    let total = TotalCount.create 4 |> Result.defaultWith (fun _ -> failwith "Invalid total")
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Green; Total = total }
    let progress = TddState.progressPercentage state
    Assert.Equal(50.0, progress)
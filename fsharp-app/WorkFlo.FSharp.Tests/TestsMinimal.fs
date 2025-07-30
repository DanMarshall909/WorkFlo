/// Minimal F# Test Suite to Fix Test Discovery
module WorkFlo.Tests.TestsMinimal

open Xunit
open WorkFlo.Types
open WorkFlo.Commands
open WorkFlo.Core

[<Fact>]
let ``TddState record should be immutable`` () =
    let originalState = { Issue = "123"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let updatedState = { originalState with Criteria = 2 }
    
    Assert.Equal(1, originalState.Criteria)
    Assert.Equal(2, updatedState.Criteria)

[<Fact>]
let ``tryParseInt should return Some for valid integers`` () =
    Assert.Equal(Some 123, tryParseInt "123")
    Assert.Equal(Some 0, tryParseInt "0")

[<Fact>]
let ``tryParseInt should return None for invalid input`` () =
    Assert.Equal(None, tryParseInt "abc")
    Assert.Equal(None, tryParseInt "")

[<Fact>]
let ``validateIssue should accept non-empty strings`` () =
    match validateIssue "123" with
    | Ok issue -> Assert.Equal("123", issue)
    | Error _ -> Assert.True(false, "Expected 123 to be valid")

[<Fact>]
let ``validateIssue should reject empty strings`` () =
    match validateIssue "" with
    | Error msg -> Assert.True(msg.Contains("empty"))
    | Ok _ -> Assert.True(false, "Expected empty string to be invalid")

[<Fact>]
let ``parseCommand should handle Help command`` () =
    match parseCommand "help" [||] with
    | Ok Help -> () // Success
    | Ok _ -> Assert.True(false, "Expected Help command")
    | Error msg -> Assert.True(false, $"Help parsing failed: {msg}")

[<Fact>]
let ``parseCommand should handle Start command with argument`` () =
    match parseCommand "start" [|"123"|] with
    | Ok (Start "123") -> () // Success
    | Ok _ -> Assert.True(false, "Expected Start 123 command")
    | Error msg -> Assert.True(false, $"Start parsing failed: {msg}")

[<Fact>]
let ``parseCommand should reject unknown commands`` () =
    match parseCommand "invalid" [||] with
    | Error msg -> Assert.True(msg.Contains("Unknown"))
    | Ok _ -> Assert.True(false, "Expected unknown command to fail")

[<Fact>]
let ``executeCommand Help should return help text`` () =
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
    | Error msg -> Assert.True(false, $"Help command should not fail: {msg}")

[<Fact>]
let ``nextCriteria should increment criteria`` () =
    let state = { Issue = "456"; Criteria = 2; Phase = WorkFlo.Types.Cover; Total = 3 }
    let result = nextCriteria state
    
    Assert.Equal(3, result.Criteria)
    Assert.Equal(WorkFlo.Types.Start, result.Phase)
    Assert.Equal("456", result.Issue)
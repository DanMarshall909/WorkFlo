/// F# Test Suite: Testing Immutable Records, Discriminated Unions, and Option Types
module WorkFlo.Tests.TypesTestsFixed

open Xunit
open FsUnit.Xunit
open WorkFlo.Types

/// Test Suite 1: Immutable Records - Proving Immutability and 'with' Updates
[<Fact>]
let ``TddState record should be immutable`` () =
    let originalState = { Issue = "123"; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
    let updatedState = { originalState with Criteria = 2 }
    
    originalState.Criteria |> should equal 1
    updatedState.Criteria |> should equal 2
    updatedState.Issue |> should equal "123"
    updatedState.Total |> should equal 3

[<Fact>]
let ``nextCriteria should increment criteria and reset phase to Start`` () =
    let state = { Issue = "456"; Criteria = 2; Phase = WorkFlo.Types.Cover; Total = 3 }
    let result = nextCriteria state
    
    result.Criteria |> should equal 3
    result.Phase |> should equal WorkFlo.Types.Start
    result.Issue |> should equal "456"
    result.Total |> should equal 3

[<Fact>]
let ``GameScores record should preserve all fields in immutable updates`` () =
    let scores = {
        PerformanceScore = 85
        QualityScore = 90
        EfficiencyScore = 88
        LlmEfficiencyScore = 92
        TotalTests = 50
        TotalLines = 1000
        TestRuns = 25
        FailedRuns = 2
        LlmInteractions = 15
        EstimatedTokens = 5000
    }
    
    let updatedScores = { scores with PerformanceScore = 95 }
    
    updatedScores.PerformanceScore |> should equal 95
    updatedScores.QualityScore |> should equal 90
    updatedScores.TestRuns |> should equal 25
    updatedScores.EstimatedTokens |> should equal 5000

/// Test Suite 2: Discriminated Unions - Compile-time Safety and Pattern Matching
[<Fact>]
let ``TddPhase discriminated union should have all expected cases`` () =
    let phases = [WorkFlo.Types.Start; WorkFlo.Types.Red; WorkFlo.Types.Green; WorkFlo.Types.Refactor; WorkFlo.Types.Cover]
    
    phases |> should haveLength 5
    phases |> List.contains WorkFlo.Types.Start |> should be True
    phases |> List.contains WorkFlo.Types.Red |> should be True
    phases |> List.contains WorkFlo.Types.Green |> should be True
    phases |> List.contains WorkFlo.Types.Refactor |> should be True
    phases |> List.contains WorkFlo.Types.Cover |> should be True

[<Fact>]
let ``TddPhase should support exhaustive pattern matching`` () =
    let getPhaseDescription phase =
        match phase with
        | WorkFlo.Types.Start -> "Planning phase"
        | WorkFlo.Types.Red -> "Write failing test"
        | WorkFlo.Types.Green -> "Minimal implementation"
        | WorkFlo.Types.Refactor -> "Improve code quality"
        | WorkFlo.Types.Cover -> "Comprehensive testing"
    
    getPhaseDescription WorkFlo.Types.Start |> should equal "Planning phase"
    getPhaseDescription WorkFlo.Types.Red |> should equal "Write failing test"
    getPhaseDescription WorkFlo.Types.Green |> should equal "Minimal implementation"
    getPhaseDescription WorkFlo.Types.Refactor |> should equal "Improve code quality"
    getPhaseDescription WorkFlo.Types.Cover |> should equal "Comprehensive testing"

/// Test Suite 3: Option Types - Null Safety and Explicit Handling
[<Fact>]
let ``tryParseInt should return Some for valid integers`` () =
    let validInputs = ["0"; "123"; "999"; "1"]
    
    validInputs |> List.iter (fun input ->
        match tryParseInt input with
        | Some value -> value |> should be (greaterThanOrEqualTo 0)
        | None -> failwith $"Expected {input} to parse successfully")

[<Fact>]
let ``tryParseInt should return None for invalid input`` () =
    let invalidInputs = [""; "abc"; "12.5"; "not-a-number"; " "]
    
    invalidInputs |> List.iter (fun input ->
        tryParseInt input |> should equal None)

[<Fact>]
let ``doubleIfValid should chain Option operations correctly`` () =
    doubleIfValid "5" |> should equal (Some 10)
    doubleIfValid "0" |> should equal (Some 0)
    doubleIfValid "abc" |> should equal None
    doubleIfValid "" |> should equal None

[<Fact>]
let ``addTwoNumbers should demonstrate Option.bind chaining`` () =
    addTwoNumbers "3" "4" |> should equal (Some 7)
    addTwoNumbers "10" "20" |> should equal (Some 30)
    addTwoNumbers "5" "abc" |> should equal None
    addTwoNumbers "xyz" "5" |> should equal None
    addTwoNumbers "" "" |> should equal None

/// Test Suite 4: Advanced Option Patterns
[<Fact>]
let ``getThresholdOrDefault should provide fallback values`` () =
    let configWithThreshold = { ConfidenceThreshold = Some 95; MutationThreshold = None; Persona = None; Debug = None }
    let configWithoutThreshold = { ConfidenceThreshold = None; MutationThreshold = None; Persona = None; Debug = None }
    
    getThresholdOrDefault configWithThreshold |> should equal 95
    getThresholdOrDefault configWithoutThreshold |> should equal 85

[<Fact>]
let ``validateAdultAge should chain Option.bind and Option.filter`` () =
    validateAdultAge (Some "25") |> should equal (Some 25)
    validateAdultAge (Some "16") |> should equal None
    validateAdultAge (Some "abc") |> should equal None
    validateAdultAge None |> should equal None

[<Fact>]
let ``createUserScore should combine multiple Options`` () =
    createUserScore (Some "Alice") (Some "95") |> should equal (Some "Alice: 95")
    createUserScore (Some "Bob") None |> should equal None
    createUserScore None (Some "88") |> should equal None
    createUserScore None None |> should equal None

[<Fact>]
let ``parseAllScores should fail fast on invalid input`` () =
    parseAllScores ["85"; "90"; "78"] |> should equal (Some [85; 90; 78])
    parseAllScores ["85"; "abc"; "78"] |> should equal None
    parseAllScores [] |> should equal (Some [])
    parseAllScores ["100"] |> should equal (Some [100])

/// Test Suite 5: Property-Based Testing with Known Values
[<Fact>]
let ``nextCriteria should always preserve Issue and Total`` () =
    let testCases = [
        ("issue1", 1, 3)
        ("issue2", 2, 5)
        ("test-123", 5, 10)
    ]
    
    testCases |> List.iter (fun (issue, criteria, total) ->
        let state = { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Cover; Total = total }
        let result = nextCriteria state
        result.Issue |> should equal issue
        result.Total |> should equal total
        result.Criteria |> should equal (criteria + 1))

[<Fact>]
let ``tryParseInt should never throw exceptions`` () =
    let testInputs = [
        "123"; "0"; "-5"; "abc"; ""; "  "; "12.5"; "null"; "NaN"
    ]
    
    testInputs |> List.iter (fun input ->
        try
            let result = tryParseInt input
            match result with
            | Some _ -> ()
            | None -> ()
        with
        | ex -> failwith $"tryParseInt should not throw for input '{input}': {ex.Message}")

[<Fact>]
let ``TddState with updates should preserve unchanged fields`` () =
    let testCases = [
        ("issue-1", 1, 3)
        ("feature-abc", 2, 5)
        ("test-xyz", 3, 7)
    ]
    
    testCases |> List.iter (fun (issue, criteria, total) ->
        let original = { Issue = issue; Criteria = criteria; Phase = WorkFlo.Types.Start; Total = total }
        let updated = { original with Phase = WorkFlo.Types.Red }
        
        updated.Issue |> should equal original.Issue
        updated.Criteria |> should equal original.Criteria
        updated.Total |> should equal original.Total
        updated.Phase |> should equal WorkFlo.Types.Red)

/// Test Suite 6: Context and Configuration Types
[<Fact>]
let ``Context record should have immutable configuration paths`` () =
    let context = {
        ConfigFile = ".workflo-config"
        StateFile = ".tdd-state"
        ScoreFile = ".tdd-scores"
        Debug = false
        Verbose = true
    }
    
    let debugContext = { context with Debug = true }
    
    context.Debug |> should equal false
    debugContext.Debug |> should equal true
    debugContext.StateFile |> should equal ".tdd-state"

[<Fact>]
let ``WorkFloConfig should support partial configuration`` () =
    let config = {
        Persona = "claude"
        ConfidenceThreshold = 90
        MutationThreshold = 85
    }
    
    let updatedConfig = { config with ConfidenceThreshold = 95 }
    
    updatedConfig.ConfidenceThreshold |> should equal 95
    updatedConfig.Persona |> should equal "claude"
    updatedConfig.MutationThreshold |> should equal 85
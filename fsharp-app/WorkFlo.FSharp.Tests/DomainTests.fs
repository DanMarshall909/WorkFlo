/// Domain Model Tests - Testing the refactored domain model
/// 
/// These tests verify the domain model behavior and business rules
/// using property-based testing and domain-specific scenarios
module WorkFlo.Tests.DomainTests

open Xunit
open WorkFlo.Domain
open WorkFlo.Railway

// ========================================
// ISSUE NUMBER TESTS
// ========================================

[<Fact>]
let ``IssueNumber creation succeeds for positive integers`` () =
    match IssueNumber.create 42 with
    | Ok issueNumber -> 
        let value = IssueNumber.value issueNumber
        Assert.Equal(42, value)
    | Error _ -> Assert.True(false, "Should succeed for positive number")

[<Fact>]
let ``IssueNumber creation fails for zero and negative integers`` () =
    match IssueNumber.create 0 with
    | Error (ValidationError ("IssueNumber", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should fail for zero")
    
    match IssueNumber.create -5 with
    | Error (ValidationError ("IssueNumber", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should fail for negative")

[<Fact>]
let ``IssueNumber fromString parses valid numbers`` () =
    match IssueNumber.fromString "123" with
    | Ok issueNumber ->
        Assert.Equal(123, IssueNumber.value issueNumber)
    | Error _ -> Assert.True(false, "Should parse valid number string")

[<Fact>]
let ``IssueNumber fromString rejects invalid formats`` () =
    match IssueNumber.fromString "abc" with
    | Error (ValidationError ("IssueNumber", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should reject non-numeric string")
    
    match IssueNumber.fromString "" with
    | Error (ValidationError ("IssueNumber", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should reject empty string")

// ========================================
// CRITERIA COUNT TESTS  
// ========================================

[<Fact>]
let ``CriteriaCount allows zero and positive values`` () =
    match CriteriaCount.create 0 with
    | Ok criteriaCount ->
        Assert.Equal(0, CriteriaCount.value criteriaCount)
    | Error _ -> Assert.True(false, "Should allow zero criteria")
    
    match CriteriaCount.create 5 with
    | Ok criteriaCount ->
        Assert.Equal(5, CriteriaCount.value criteriaCount)
    | Error _ -> Assert.True(false, "Should allow positive criteria")

[<Fact>]
let ``CriteriaCount rejects negative values`` () =
    match CriteriaCount.create -1 with
    | Error (ValidationError ("CriteriaCount", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should reject negative criteria count")

// ========================================
// TDD PHASE TESTS
// ========================================

[<Fact>]
let ``TddPhase round-trip conversion works correctly`` () =
    let phases = [Start; Red; Green; Refactor; Cover; Next]
    
    for phase in phases do
        let phaseString = TddPhase.toString phase
        match TddPhase.fromString phaseString with
        | Ok convertedPhase ->
            Assert.Equal(phase, convertedPhase)
        | Error _ -> 
            Assert.True(false, $"Round-trip conversion failed for {phase}")

[<Fact>]
let ``TddPhase fromString rejects invalid phase names`` () =
    match TddPhase.fromString "InvalidPhase" with
    | Error (ValidationError ("TddPhase", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should reject invalid phase name")

[<Fact>]
let ``TddPhase canTransitionTo validates correct transitions`` () =
    // Valid transitions
    Assert.True(TddPhase.canTransitionTo Start Red)
    Assert.True(TddPhase.canTransitionTo Red Green)
    Assert.True(TddPhase.canTransitionTo Green Refactor)
    Assert.True(TddPhase.canTransitionTo Refactor Cover)
    Assert.True(TddPhase.canTransitionTo Cover Next)
    
    // Can always restart
    Assert.True(TddPhase.canTransitionTo Cover Start)
    Assert.True(TddPhase.canTransitionTo Red Start)
    
    // Invalid transitions
    Assert.False(TddPhase.canTransitionTo Start Green)
    Assert.False(TddPhase.canTransitionTo Red Refactor)
    Assert.False(TddPhase.canTransitionTo Green Cover)

// ========================================
// TDD STATE TESTS
// ========================================

[<Fact>]
let ``TddState creation succeeds with valid parameters`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 2 |> Result.defaultWith failwith
    let total = TotalCount.create 5 |> Result.defaultWith failwith
    
    match TddState.create issueNumber criteria Start total with
    | Ok state ->
        Assert.Equal(42, IssueNumber.value state.Issue)
        Assert.Equal(2, CriteriaCount.value state.Criteria)
        Assert.Equal(Start, state.Phase)
        Assert.Equal(5, TotalCount.value state.Total)
    | Error _ -> Assert.True(false, "Should succeed with valid parameters")

[<Fact>]
let ``TddState creation fails when criteria exceeds total`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 6 |> Result.defaultWith failwith
    let total = TotalCount.create 5 |> Result.defaultWith failwith
    
    match TddState.create issueNumber criteria Start total with
    | Error (BusinessRuleViolation ("CriteriaLimit", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should fail when criteria exceeds total")

[<Fact>]
let ``TddState isComplete returns true when criteria equals total and phase is Cover`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 3 |> Result.defaultWith failwith
    let total = TotalCount.create 3 |> Result.defaultWith failwith
    
    let completeState = TddState.create issueNumber criteria Cover total |> Result.defaultWith failwith
    Assert.True(TddState.isComplete completeState)
    
    let incompleteState = TddState.create issueNumber criteria Red total |> Result.defaultWith failwith
    Assert.False(TddState.isComplete incompleteState)

[<Fact>]
let ``TddState progressPercentage calculates correctly`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 2 |> Result.defaultWith failwith
    let total = TotalCount.create 5 |> Result.defaultWith failwith
    
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    let progress = TddState.progressPercentage state
    
    Assert.Equal(40.0, progress)

[<Fact>]
let ``TddState advanceCriteria increases criteria by one`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 2 |> Result.defaultWith failwith
    let total = TotalCount.create 5 |> Result.defaultWith failwith
    
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    
    match TddState.advanceCriteria state with
    | Ok newState ->
        Assert.Equal(3, CriteriaCount.value newState.Criteria)
    | Error _ -> Assert.True(false, "Should advance criteria successfully")

[<Fact>]
let ``TddState advanceCriteria fails when already at maximum`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 5 |> Result.defaultWith failwith
    let total = TotalCount.create 5 |> Result.defaultWith failwith
    
    let state = TddState.create issueNumber criteria Cover total |> Result.defaultWith failwith
    
    match TddState.advanceCriteria state with
    | Error (BusinessRuleViolation ("AdvanceCriteria", _)) -> Assert.True(true)
    | _ -> Assert.True(false, "Should fail when criteria already at maximum")

// ========================================
// TDD SESSION TESTS
// ========================================

[<Fact>]
let ``TddSession duration calculates time elapsed`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 1 |> Result.defaultWith failwith
    let total = TotalCount.create 3 |> Result.defaultWith failwith
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    
    let session = {
        State = state
        StartTime = System.DateTime.Now.AddMinutes(-30.0)
        TestRuns = 10
        FailedTests = 2
    }
    
    let duration = TddSession.duration session
    Assert.True(duration.TotalMinutes >= 29.0 && duration.TotalMinutes <= 31.0)

[<Fact>]
let ``TddSession successRate calculates correctly`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 1 |> Result.defaultWith failwith
    let total = TotalCount.create 3 |> Result.defaultWith failwith
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    
    let session = {
        State = state
        StartTime = System.DateTime.Now
        TestRuns = 10
        FailedTests = 2
    }
    
    let successRate = TddSession.successRate session
    Assert.Equal(80.0, successRate)

[<Fact>]
let ``TddSession successRate handles zero test runs`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 1 |> Result.defaultWith failwith
    let total = TotalCount.create 3 |> Result.defaultWith failwith
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    
    let session = {
        State = state
        StartTime = System.DateTime.Now
        TestRuns = 0
        FailedTests = 0
    }
    
    let successRate = TddSession.successRate session
    Assert.Equal(0.0, successRate)

[<Fact>]
let ``TddSession isEfficient identifies efficient sessions`` () =
    let issueNumber = IssueNumber.create 42 |> Result.defaultWith failwith
    let criteria = CriteriaCount.create 1 |> Result.defaultWith failwith
    let total = TotalCount.create 3 |> Result.defaultWith failwith
    let state = TddState.create issueNumber criteria Start total |> Result.defaultWith failwith
    
    // Efficient session: short duration, high success rate
    let efficientSession = {
        State = state
        StartTime = System.DateTime.Now.AddMinutes(-20.0)
        TestRuns = 10
        FailedTests = 1  // 90% success rate
    }
    
    Assert.True(TddSession.isEfficient efficientSession)
    
    // Inefficient session: long duration or low success rate
    let inefficientSession = {
        State = state
        StartTime = System.DateTime.Now.AddMinutes(-45.0)  // Too long
        TestRuns = 10
        FailedTests = 1
    }
    
    Assert.False(TddSession.isEfficient inefficientSession)
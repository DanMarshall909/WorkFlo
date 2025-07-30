/// Domain Model for WorkFlo TDD Workflow System
/// 
/// This module contains the core domain types and business rules
/// following F# best practices for domain modeling
namespace WorkFlo.Domain

/// Domain Errors - Explicit error modeling instead of generic strings
type WorkFloError =
    | ValidationError of field: string * message: string
    | FileError of operation: string * path: string * message: string
    | StateTransitionError of fromState: string * toState: string * reason: string
    | ParseError of content: string * message: string
    | BusinessRuleViolation of rule: string * context: string

/// Issue Number - Strong typing for business concepts
type IssueNumber = private IssueNumber of int
module IssueNumber =
    let create (value: int) =
        if value <= 0 then
            Error (ValidationError("IssueNumber", "Issue number must be positive"))
        else
            Ok (IssueNumber value)
    
    let value (IssueNumber num) = num
    
    let fromString (str: string) =
        match System.Int32.TryParse(str) with
        | true, num -> create num
        | false, _ -> Error (ValidationError("IssueNumber", $"'{str}' is not a valid number"))

/// Criteria Count - Another strong type for domain concepts  
type CriteriaCount = private CriteriaCount of int
module CriteriaCount =
    let create (value: int) =
        if value < 0 then
            Error (ValidationError("CriteriaCount", "Criteria count cannot be negative"))
        else
            Ok (CriteriaCount value)
    
    let value (CriteriaCount count) = count
    
    let fromString (str: string) =
        match System.Int32.TryParse(str) with
        | true, num -> create num
        | false, _ -> Error (ValidationError("CriteriaCount", $"'{str}' is not a valid criteria count"))

/// Total Count - Strong typing prevents mixing up criteria and total
type TotalCount = private TotalCount of int
module TotalCount =
    let create (value: int) =
        if value <= 0 then
            Error (ValidationError("TotalCount", "Total count must be positive"))
        else
            Ok (TotalCount value)
    
    let value (TotalCount count) = count
    
    let fromString (str: string) =
        match System.Int32.TryParse(str) with
        | true, num -> create num
        | false, _ -> Error (ValidationError("TotalCount", $"'{str}' is not a valid total count"))

/// TDD Phase - Explicit phases with clear transitions
type TddPhase =
    | Start
    | Red
    | Green  
    | Refactor
    | Cover
    | Next

module TddPhase =
    let fromString = function
        | "Start" -> Ok Start
        | "Red" -> Ok Red
        | "Green" -> Ok Green
        | "Refactor" -> Ok Refactor
        | "Cover" -> Ok Cover
        | "Next" -> Ok Next
        | invalid -> Error (ValidationError("TddPhase", $"Unknown phase: {invalid}"))
    
    let toString = function
        | Start -> "Start"
        | Red -> "Red"
        | Green -> "Green"
        | Refactor -> "Refactor"
        | Cover -> "Cover"
        | Next -> "Next"
    
    /// Business rule: Valid phase transitions
    let canTransitionTo currentPhase targetPhase =
        match currentPhase, targetPhase with
        | Start, Red -> true
        | Red, Green -> true
        | Green, Refactor -> true
        | Refactor, Cover -> true
        | Cover, Next -> true
        | _, Start -> true  // Can always restart
        | same1, same2 when same1 = same2 -> true  // Can stay in same phase
        | fromPhase, toPhase -> false

/// TDD State - Core domain aggregate
type TddState = {
    Issue: IssueNumber
    Criteria: CriteriaCount  
    Phase: TddPhase
    Total: TotalCount
}

module TddState =
    /// Smart constructor with business rules validation
    let create issueNumber criteria phase total =
        // Business rule: Criteria cannot exceed total
        if CriteriaCount.value criteria > TotalCount.value total then
            Error (BusinessRuleViolation("CriteriaLimit", 
                $"Criteria count ({CriteriaCount.value criteria}) cannot exceed total ({TotalCount.value total})"))
        else
            Ok {
                Issue = issueNumber
                Criteria = criteria
                Phase = phase
                Total = total
            }
    
    /// Business rule: Check if TDD cycle is complete
    let isComplete state =
        CriteriaCount.value state.Criteria = TotalCount.value state.Total &&
        state.Phase = Cover
    
    /// Business rule: Calculate progress percentage
    let progressPercentage state =
        let criteriaFloat = float (CriteriaCount.value state.Criteria)
        let totalFloat = float (TotalCount.value state.Total)
        (criteriaFloat / totalFloat) * 100.0
    
    /// Business rule: Advance to next criteria
    let advanceCriteria state =
        let currentCriteria = CriteriaCount.value state.Criteria
        let maxCriteria = TotalCount.value state.Total
        
        if currentCriteria >= maxCriteria then
            Error (BusinessRuleViolation("AdvanceCriteria", "Cannot advance beyond total criteria count"))
        else
            CriteriaCount.create (currentCriteria + 1)
            |> Result.map (fun newCriteria -> { state with Criteria = newCriteria })

/// Application Configuration - Strong typing for config
type AppConfig = {
    ConfigFile: string
    StateFile: string
    ScoreFile: string
    Debug: bool
    Verbose: bool
}

/// Commands - Discriminated union for type-safe commands
type WorkFloCommand =
    | Start of IssueNumber
    | Red
    | Green
    | Refactor  
    | Cover
    | Next
    | Status
    | Help

/// TDD Session Analytics - Rich domain model for analysis
type TddSession = {
    State: TddState
    StartTime: System.DateTime
    TestRuns: int
    FailedTests: int
}

module TddSession =
    let duration session =
        System.DateTime.Now - session.StartTime
    
    let successRate session =
        if session.TestRuns = 0 then 0.0
        else
            let successfulRuns = session.TestRuns - session.FailedTests
            (float successfulRuns / float session.TestRuns) * 100.0
    
    let isEfficient session =
        let dur = duration session
        dur.TotalMinutes <= 30.0 && successRate session >= 80.0
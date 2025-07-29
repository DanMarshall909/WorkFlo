/// F# Learning Module 7: Advanced Pattern Matching and Active Patterns
/// 
/// TypeScript: Complex if/else chains and type checking
/// F# approach: Sophisticated pattern matching that makes impossible states impossible
module WorkFlo.Advanced

open WorkFlo.Types

/// Lesson 50: Guards in pattern matching - conditions within patterns
let assessTddProgress (state: TddState) : string =
    match state with
    | { Phase = WorkFlo.Types.Start; Criteria = c } when c > state.Total -> 
        "ERROR: Criteria exceeds total!"
    | { Phase = WorkFlo.Types.Start; Criteria = c; Total = t } when c = t ->
        "🎯 Starting final acceptance criteria"
    | { Phase = WorkFlo.Types.Start; Criteria = 1 } ->
        "🚀 Beginning TDD journey"
    | { Phase = WorkFlo.Types.Cover; Criteria = c; Total = t } when c = t ->
        "🎉 All criteria complete - ready for next!"
    | { Phase = phase; Criteria = c; Total = t } ->
        $"📋 Phase: {phase}, Progress: {c}/{t}"

/// Lesson 51: Active Patterns - Custom pattern matching
let (|ValidIssueNumber|InvalidIssue|) (input: string) =
    match WorkFlo.Core.validateIssueNumber input with
    | Ok number when number > 0 && number < 10000 -> ValidIssueNumber number
    | Ok _ -> InvalidIssue "Issue number out of range"  
    | Error msg -> InvalidIssue msg

/// Lesson 52: Using active patterns in match expressions
let processIssueInput (input: string) : string =
    match input with
    | ValidIssueNumber num -> $"✅ Valid issue: {num}"
    | InvalidIssue reason -> $"❌ Invalid: {reason}"

/// Lesson 53: Partial Active Patterns for optional matching
let (|RedPhase|_|) (state: TddState) =
    match state.Phase with
    | WorkFlo.Types.Red -> Some state.Criteria
    | _ -> None

let (|GreenPhase|_|) (state: TddState) =
    match state.Phase with  
    | WorkFlo.Types.Green -> Some state.Criteria
    | _ -> None

/// Lesson 54: Combining multiple active patterns
let getPhaseAdvice (state: TddState) : string =
    match state with
    | RedPhase criteria -> 
        $"🔴 Write failing test for criteria {criteria}"
    | GreenPhase criteria -> 
        $"🟢 Implement minimal code for criteria {criteria}"
    | { Phase = WorkFlo.Types.Refactor } -> 
        "🔵 Clean up and improve code quality"
    | { Phase = WorkFlo.Types.Cover } ->
        "🟣 Add comprehensive test coverage"
    | _ -> 
        "📝 Plan your next TDD step"

/// Lesson 55: Multi-case active patterns for complex categorization  
let (|EarlyPhase|MiddlePhase|LatePhase|Complete|) (state: TddState) =
    let progress = float state.Criteria / float state.Total
    match state.Phase, progress with
    | WorkFlo.Types.Start, _ when progress <= 0.33 -> EarlyPhase
    | (WorkFlo.Types.Red | WorkFlo.Types.Green), _ when progress <= 0.66 -> MiddlePhase  
    | (WorkFlo.Types.Refactor | WorkFlo.Types.Cover), _ when progress < 1.0 -> LatePhase
    | _, _ when progress >= 1.0 -> Complete

/// Lesson 56: Strategic advice based on categorization
let getTddStrategy (state: TddState) : string =
    match state with
    | EarlyPhase -> 
        "🌱 Focus on understanding requirements and writing clear tests"
    | MiddlePhase -> 
        "⚡ Build momentum with quick red-green cycles"  
    | LatePhase -> 
        "🎯 Perfect your implementation and ensure comprehensive coverage"
    | Complete -> 
        "🎉 Excellent work! Ready for the next feature"

/// Lesson 57: Record patterns with nested matching
type TddSession = {
    State: TddState
    StartTime: System.DateTime
    TestRuns: int
    FailedTests: int
}

let analyzeSession (session: TddSession) : string =
    match session with
    | { State = { Phase = WorkFlo.Types.Cover; Criteria = c; Total = t }; TestRuns = runs; FailedTests = 0 } 
        when c = t && runs > 5 ->
        "🏆 Perfect session! All tests passing, comprehensive coverage achieved"
    | { TestRuns = runs; FailedTests = failed } when failed > runs / 2 ->
        "⚠️  Many failing tests - consider smaller steps"
    | { State = RedPhase _; TestRuns = 0 } ->
        "💡 Remember to run tests in RED phase!"
    | { StartTime = start } when System.DateTime.Now.Subtract(start).TotalHours > 2.0 ->
        "🕐 Long session - consider taking a break"
    | _ ->
        "📈 Session progressing normally"

/// Lesson 58: List patterns for processing collections
let analyzeTddHistory (states: TddState list) : string =
    match states with
    | [] -> "No TDD history available"
    | [single] -> $"Single session for issue {single.Issue}"
    | first :: second :: _ when first.Issue = second.Issue ->
        "Multiple criteria in same issue - good iterative approach!"
    | first :: rest when List.length rest > 5 ->
        $"Productive! {List.length states} TDD sessions starting with issue {first.Issue}"
    | first :: _ ->
        $"TDD journey started with issue {first.Issue}"

/// TRY THIS: Advanced pattern matching examples
/// 
/// let testState = { Issue = "123"; Criteria = 2; Phase = Red; Total = 3 }
/// 
/// assessTddProgress testState           // "📋 Phase: Red, Progress: 2/3"
/// processIssueInput "123"              // "✅ Valid issue: 123"
/// processIssueInput "abc"              // "❌ Invalid: Not a valid number"
/// processIssueInput "99999"            // "❌ Invalid: Issue number out of range"
/// 
/// getPhaseAdvice testState             // "🔴 Write failing test for criteria 2"
/// getTddStrategy testState             // "⚡ Build momentum with quick red-green cycles"
/// 
/// let session = { 
///     State = testState
///     StartTime = System.DateTime.Now.AddHours(-1.0)
///     TestRuns = 8
///     FailedTests = 2 
/// }
/// analyzeSession session               // Analysis based on session metrics
/// 
/// analyzeTddHistory [testState; { testState with Criteria = 3 }]  
///                                     // "Multiple criteria in same issue - good iterative approach!"
/// 
/// F# Pattern Matching Advantages:
/// - Exhaustive checking prevents missing cases
/// - Guards add conditions without nested if statements  
/// - Active patterns create custom matching logic
/// - Deep structural matching works on any data shape
/// - Compile-time verification of all cases handled
/// - Much more expressive than switch statements or if/else chains!
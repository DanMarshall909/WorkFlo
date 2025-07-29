/// F# Learning Module 1: Immutable Records vs Mutable Objects
/// 
/// In TypeScript, we had interfaces with mutable properties:
/// interface TddState { issue: string; criteria: number; ... }
/// 
/// In F#, we use RECORDS which are immutable by default!
module WorkFlo.Types

/// Lesson 1: F# Records are immutable by default
/// Compare to TypeScript: interface TddState { issue: string; criteria: number; phase: string; total: number }
/// F# Advantage: Cannot accidentally mutate these values!
type TddState = {
    Issue: string       // Immutable string - can't change after creation
    Criteria: int       // Immutable integer
    Phase: TddPhase     // Notice we use a custom type, not string!
    Total: int          // All fields are readonly by design
}

/// Lesson 2: Discriminated Unions vs String Literals  
/// TypeScript: type TddPhase = 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER'
/// F# Advantage: Compile-time safety! Can't accidentally type 'GREEEN' or 'start'
and TddPhase = 
    | Start         // Each case is a distinct value
    | Red           // No quotes needed - these are types, not strings!
    | Green         // Compiler ensures we handle all cases
    | Refactor      // Try adding a new phase - compiler will tell you everywhere to update!
    | Cover

/// Lesson 3: How to "modify" immutable records
/// You don't mutate them - you create new ones with the 'with' keyword!
/// 
/// TypeScript (mutable):  state.criteria = state.criteria + 1
/// F# (immutable):        { state with Criteria = state.Criteria + 1 }
let nextCriteria (state: TddState) : TddState =
    { state with 
        Criteria = state.Criteria + 1
        Phase = Start }  // Create NEW record with updated values

/// Lesson 4: More immutable types from our TypeScript conversion
type GameScores = {
    PerformanceScore: int
    QualityScore: int  
    EfficiencyScore: int
    LlmEfficiencyScore: int
    TotalTests: int
    TotalLines: int
    TestRuns: int
    FailedRuns: int
    LlmInteractions: int
    EstimatedTokens: int
} // All immutable! No accidental score modifications

/// Lesson 5: Configuration as immutable data
type WorkFloConfig = {
    Persona: string
    ConfidenceThreshold: int
    MutationThreshold: int
    // ... more config fields as immutable values
}

/// Lesson 6: Context record instead of mutable object
type Context = {
    ConfigFile: string
    StateFile: string
    ScoreFile: string
    Debug: bool
    Verbose: bool
} // Immutable context - thread-safe by design!

/// Lesson 21: Option Types - No More Null Reference Exceptions!
/// TypeScript: string | null | undefined (runtime errors waiting to happen)
/// F# Option: Some value | None (compile-time safety!)
type ConfigValue = string option  // Can be Some "value" or None

/// Lesson 22: Working with Options safely
let tryParseInt (str: string) : int option =
    match System.Int32.TryParse(str) with
    | (true, value) -> Some value    // Success: wrap in Some
    | (false, _) -> None            // Failure: return None (no exceptions!)

/// Lesson 23: Option.map for transforming values inside Option
let doubleIfValid (str: string) : int option =
    tryParseInt str
    |> Option.map (fun x -> x * 2)  // Only applies function if Some, ignores None

/// Lesson 24: Chaining Options with Option.bind
let addTwoNumbers (str1: string) (str2: string) : int option =
    tryParseInt str1
    |> Option.bind (fun x ->         // If first parse succeeded...
        tryParseInt str2
        |> Option.map (fun y -> x + y))  // Try second parse and add

/// TRY THIS IN F# INTERACTIVE:
/// 
/// let state = { Issue = "123"; Criteria = 1; Phase = Start; Total = 3 }
/// let nextState = nextCriteria state
/// printfn "Original: %A" state.Criteria    // Still 1!  
/// printfn "New: %A" nextState.Criteria     // Now 2!
/// 
/// // Option examples:
/// tryParseInt "123"        // Some 123
/// tryParseInt "abc"        // None
/// doubleIfValid "5"        // Some 10
/// doubleIfValid "abc"      // None
/// addTwoNumbers "3" "4"    // Some 7
/// addTwoNumbers "3" "abc"  // None
/// 
/// Notice: No null reference exceptions possible!
/// Option forces you to handle the "no value" case explicitly!
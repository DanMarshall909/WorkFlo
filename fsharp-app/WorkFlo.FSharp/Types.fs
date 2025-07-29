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

/// TRY THIS IN F# INTERACTIVE:
/// 
/// let state = { Issue = "123"; Criteria = 1; Phase = Start; Total = 3 }
/// let nextState = nextCriteria state
/// printfn "Original: %A" state.Criteria    // Still 1!  
/// printfn "New: %A" nextState.Criteria     // Now 2!
/// 
/// Notice: Original state unchanged - we created a NEW state!
/// This is the power of immutability - no surprising side effects!
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

/// Lesson 31: Advanced Option Patterns - Configuration Management
/// TypeScript: config.threshold || 85 (runtime errors if config is null)
/// F# Option: Explicit handling with defaultValue
type ConfigOptions = {
    ConfidenceThreshold: int option
    MutationThreshold: int option  
    Persona: string option
    Debug: bool option
}


let getThresholdOrDefault (config: ConfigOptions) : int =
    config.ConfidenceThreshold |> Option.defaultValue 85

/// Lesson 32: Option.filter - Safe predicate checking
/// TypeScript: if (user && user.age && user.age >= 18) { ... }
/// F# Option: Chain filters safely without null checks
let validateAdultAge (ageStr: string option) : int option =
    ageStr
    |> Option.bind tryParseInt           // Convert string to int if Some
    |> Option.filter (fun age -> age >= 18)  // Keep only if adult

/// Lesson 33: Working with multiple Options - applicative style
let createUserScore (name: string option) (score: string option) : string option =
    match name, score with
    | Some n, Some s -> Some $"{n}: {s}"
    | _ -> None  // If either is None, result is None

/// Lesson 34: Option.traverse - Transform list of Options
let parseAllScores (scores: string list) : int list option =
    let rec traverse acc remaining =
        match remaining with
        | [] -> Some (List.rev acc)  // All parsed successfully
        | head :: tail ->
            match tryParseInt head with
            | Some value -> traverse (value :: acc) tail
            | None -> None  // One failed, entire operation fails
    traverse [] scores

/// TRY THIS IN F# INTERACTIVE:
/// 
/// let state = { Issue = "123"; Criteria = 1; Phase = Start; Total = 3 }
/// let nextState = nextCriteria state
/// printfn "Original: %A" state.Criteria    // Still 1!  
/// printfn "New: %A" nextState.Criteria     // Now 2!
/// 
/// // Basic Option examples:
/// tryParseInt "123"        // Some 123
/// tryParseInt "abc"        // None
/// doubleIfValid "5"        // Some 10
/// doubleIfValid "abc"      // None
/// addTwoNumbers "3" "4"    // Some 7
/// addTwoNumbers "3" "abc"  // None
///
/// // Advanced Option examples:
/// let config = { ConfidenceThreshold = Some 90; MutationThreshold = None; Persona = Some "teacher"; Debug = None }
/// getThresholdOrDefault config                    // 90
/// getThresholdOrDefault { config with ConfidenceThreshold = None }  // 85 (default)
///
/// validateAdultAge (Some "25")      // Some 25
/// validateAdultAge (Some "16")      // None (too young)
/// validateAdultAge (Some "abc")     // None (not a number)
/// validateAdultAge None             // None (no age provided)
///
/// createUserScore (Some "Alice") (Some "95")   // Some "Alice: 95"
/// createUserScore (Some "Bob") None            // None
/// createUserScore None (Some "85")             // None
///
/// parseAllScores ["85"; "90"; "78"]    // Some [85; 90; 78]
/// parseAllScores ["85"; "abc"; "78"]   // None (one invalid score fails all)
/// 
/// Notice: No null reference exceptions possible!
/// Option forces you to handle the "no value" case explicitly!
/// Every operation is composable and predictable!
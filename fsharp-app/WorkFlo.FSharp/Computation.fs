/// F# Learning Module 6: Computation Expressions - The Magic Behind Async
/// 
/// TypeScript: No equivalent! This is where F# truly shines over imperative languages
/// Computation expressions let you build custom control flow that looks like native syntax
module WorkFlo.Computation

open WorkFlo.Types

/// Lesson 42: Understanding what async { ... } really does
/// This shows the "desugaring" - what the compiler transforms async syntax into
let manualAsyncExample (someAsyncOp: unit -> Async<int>) (anotherAsyncOp: unit -> Async<int>) =
    // This async block:
    // async { 
    //     let! x = someAsyncOp()
    //     let! y = anotherAsyncOp()
    //     return x + y
    // }
    // 
    // Gets transformed into:
    async.Bind(someAsyncOp(), fun x ->
        async.Bind(anotherAsyncOp(), fun y ->
            async.Return(x + y)))

/// Lesson 43: Custom Maybe Computation Expression
/// This shows how Option types can have their own syntax sugar
type MaybeBuilder() =
    member _.Return(x) = Some x
    member _.Bind(opt, f) = Option.bind f opt  
    member _.ReturnFrom(x) = x
    member _.Zero() = None

let maybe = MaybeBuilder()

/// Lesson 44: Using our custom computation expression
let addThreeNumbers (a: string) (b: string) (c: string) : int option =
    maybe {
        let! x = WorkFlo.Types.tryParseInt a
        let! y = WorkFlo.Types.tryParseInt b  
        let! z = WorkFlo.Types.tryParseInt c
        return x + y + z
    }
    // Without computation expression, this would be:
    // Option.bind (tryParseInt a) (fun x ->
    //     Option.bind (tryParseInt b) (fun y ->
    //         Option.bind (tryParseInt c) (fun z ->
    //             Some (x + y + z))))

/// Lesson 45: Custom Result Computation Expression
type ResultBuilder() =
    member _.Return(x) = Ok x
    member _.Bind(result, f) = Result.bind f result
    member _.ReturnFrom(x) = x

let result = ResultBuilder()

/// Lesson 46: Building complex validation with computation expressions
let validateTddStart (issueStr: string) (criteriaStr: string) (totalStr: string) : Result<TddState, string> =
    result {
        let! issue = WorkFlo.Core.validateIssue issueStr
        let! criteria = WorkFlo.Core.validatePositiveInt criteriaStr
        let! total = WorkFlo.Core.validatePositiveInt totalStr
        
        if criteria > total then
            return! Error "Criteria cannot exceed total"
        else
            return { 
                Issue = issue
                Criteria = criteria
                Phase = WorkFlo.Types.Start
                Total = total 
            }
    }

/// Lesson 47: Recursive validation with Result propagation
let processMultipleStates (states: string list) : Result<TddState list, string> =
    let rec processStates acc remaining =
        match remaining with
        | [] -> Ok (List.rev acc)
        | stateStr :: rest ->
            match WorkFlo.Core.parseStateContent stateStr with
            | Ok state -> processStates (state :: acc) rest
            | Error err -> Error $"Invalid state: {err}"
    
    processStates [] states

/// Lesson 48: Building custom control flow - AsyncResult combination
type AsyncResultBuilder() =
    member _.Return(x) = async { return Ok x }
    member _.Bind(asyncResult, f) = 
        async {
            let! result = asyncResult
            match result with
            | Ok value -> return! f value
            | Error err -> return Error err
        }
    member _.ReturnFrom(x) = x

let asyncResult = AsyncResultBuilder()

/// Lesson 49: Using combined AsyncResult for complex operations
let validateAndSaveWithLogging (issue: string) (filename: string) : Async<Result<string, string>> =
    asyncResult {
        // This combines async operations with Result error handling!
        let! validIssue = async { return WorkFlo.Core.validateIssue issue }
        let! issueNum = async { return WorkFlo.Core.validatePositiveInt validIssue }
        
        let newState = { Issue = string issueNum; Criteria = 1; Phase = WorkFlo.Types.Start; Total = 3 }
        let! () = WorkFlo.AsyncCore.saveStateAsync filename newState
        
        return $"Successfully started TDD for issue {issueNum} and saved to {filename}"
    }

/// TRY THIS: Computation expressions vs manual chaining
/// 
/// // Without computation expressions (painful!):
/// validateIssue issue
/// |> Result.bind (fun validIssue ->
///     validatePositiveInt validIssue  
///     |> Result.bind (fun issueNum ->
///         saveState filename { Issue = string issueNum; Criteria = 1; Phase = Start; Total = 3 }
///         |> Result.map (fun () -> $"Started TDD for {issueNum}")))
/// 
/// // With computation expressions (clean!):
/// result {
///     let! validIssue = validateIssue issue
///     let! issueNum = validatePositiveInt validIssue
///     let! () = saveState filename { Issue = string issueNum; Criteria = 1; Phase = Start; Total = 3 }
///     return $"Started TDD for {issueNum}"
/// }
/// 
/// Computation expressions provide:
/// - Custom syntax for any monad-like pattern
/// - Automatic error propagation and short-circuiting  
/// - Readable sequential-looking code for complex control flow
/// - Zero runtime cost - it's all compile-time transformation!
/// 
/// F# Examples to try:
/// addThreeNumbers "10" "20" "30"     // Some 60
/// addThreeNumbers "10" "abc" "30"    // None (short-circuits on error)
/// 
/// validateTddStart "123" "1" "3"     // Ok { Issue = "123"; Criteria = 1; ... }
/// validateTddStart "" "1" "3"        // Error "Issue number cannot be empty"
/// validateTddStart "123" "5" "3"     // Error "Criteria cannot exceed total"
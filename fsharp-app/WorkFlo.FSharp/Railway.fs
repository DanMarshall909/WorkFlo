/// Railway Oriented Programming (ROP) Module
/// 
/// This module implements the Railway Oriented Programming pattern
/// for elegant error handling and function composition in F#
namespace WorkFlo.Railway

/// Result extensions for better composition
module Result =
    /// Map function for transforming success values
    let map f result =
        match result with
        | Ok value -> Ok (f value)
        | Error error -> Error error
    
    /// Bind function for chaining operations that can fail
    let bind f result =
        match result with
        | Ok value -> f value
        | Error error -> Error error
    
    /// Apply function for handling multiple parameters
    let apply fResult xResult =
        match fResult, xResult with
        | Ok f, Ok x -> Ok (f x)
        | Error err, _ -> Error err
        | _, Error err -> Error err
    
    /// Combine multiple results into a list
    let sequence results =
        let folder result acc =
            match result, acc with
            | Ok value, Ok values -> Ok (value :: values)
            | Error err, _ -> Error err
            | _, Error err -> Error err
        
        List.foldBack folder results (Ok [])
    
    /// Traverse a list with a function that returns Result
    let traverse f list =
        list |> List.map f |> sequence
    
    /// Execute side effect only on success
    let tee f result =
        match result with
        | Ok value -> 
            f value
            result
        | Error _ -> result
    
    /// Execute side effect only on error
    let teeError f result =
        match result with
        | Ok _ -> result
        | Error error ->
            f error
            result
    
    /// Convert an option to Result with custom error
    let ofOption error = function
        | Some value -> Ok value
        | None -> Error error
    
    /// Provide a default value on error
    let defaultValue defaultVal result =
        match result with
        | Ok value -> value
        | Error _ -> defaultVal
    
    /// Provide a default using a function on error
    let defaultWith f result =
        match result with
        | Ok value -> value
        | Error error -> f error

/// Async Result extensions for asynchronous operations
module AsyncResult =
    /// Map over async result
    let map f asyncResult =
        async {
            let! result = asyncResult
            return Result.map f result
        }
    
    /// Bind async results
    let bind f asyncResult =
        async {
            let! result = asyncResult
            match result with
            | Ok value -> return! f value
            | Error error -> return Error error
        }
    
    /// Apply for async results
    let apply fAsyncResult xAsyncResult =
        async {
            let! fResult = fAsyncResult
            let! xResult = xAsyncResult
            return Result.apply fResult xResult
        }
    
    /// Lift a regular function to async result
    let retn value = async { return Ok value }
    
    /// Catch exceptions and convert to Error
    let catch f =
        async {
            try
                let! result = f ()
                return Ok result
            with
            | ex -> return Error ex.Message
        }

/// Computation Expression for Result workflow
type ResultBuilder() =
    member _.Return(x) = Ok x
    member _.Bind(x, f) = Result.bind f x
    member _.ReturnFrom(x) = x
    member _.Zero() = Ok ()
    member _.Delay(f) = f
    member _.Run(f) = f()
    
    member _.TryWith(computation, handler) =
        try computation()
        with ex -> handler ex
    
    member _.TryFinally(computation, compensation) =
        try computation()
        finally compensation()

/// Computation Expression for AsyncResult workflow  
type AsyncResultBuilder() =
    member _.Return(x) = AsyncResult.retn x
    member _.Bind(x, f) = AsyncResult.bind f x
    member _.ReturnFrom(x) = x
    member _.Zero() = AsyncResult.retn ()
    member _.Delay(f) = f
    member _.Run(f) = f()
    
    member _.TryWith(computation, handler) =
        async {
            try
                return! computation()
            with ex -> 
                return! handler ex
        }

/// Global instances for use throughout the application
let result = ResultBuilder()
let asyncResult = AsyncResultBuilder()

/// Pipeline operators for better composition
module Operators =
    /// Infix map operator
    let (<!>) = Result.map
    
    /// Infix apply operator  
    let (<*>) = Result.apply
    
    /// Infix bind operator
    let (>>=) x f = Result.bind f x
    
    /// Kleisli composition for Result
    let (>=>) f g x = f x >>= g
    
    /// Async result map
    let (<!^>) = AsyncResult.map
    
    /// Async result apply
    let (<*^>) = AsyncResult.apply
    
    /// Async result bind
    let (>>=^) x f = AsyncResult.bind f x
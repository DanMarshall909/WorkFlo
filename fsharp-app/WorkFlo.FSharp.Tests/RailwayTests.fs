/// Railway Oriented Programming Tests
/// 
/// These tests verify the Railway Oriented Programming patterns
/// and functional composition utilities
module WorkFlo.Tests.RailwayTests

open Xunit
open WorkFlo.Railway
open WorkFlo.Railway.Operators

// ========================================
// RESULT MODULE TESTS
// ========================================

[<Fact>]
let ``Result.map transforms success values`` () =
    let addOne x = x + 1
    let result = Ok 42 |> Result.map addOne
    
    match result with
    | Ok value -> Assert.Equal(43, value)
    | Error _ -> Assert.True(false, "Should transform success value")

[<Fact>]
let ``Result.map preserves errors`` () =
    let addOne x = x + 1
    let result = Error "test error" |> Result.map addOne
    
    match result with
    | Error msg -> Assert.Equal("test error", msg)
    | Ok _ -> Assert.True(false, "Should preserve error")

[<Fact>]
let ``Result.bind chains operations that can fail`` () =
    let divide x y = 
        if y = 0 then Error "Division by zero"
        else Ok (x / y)
    
    let result = Ok 10 |> Result.bind (divide 100)
    
    match result with
    | Ok value -> Assert.Equal(10, value)
    | Error _ -> Assert.True(false, "Should succeed with valid division")
    
    let errorResult = Ok 0 |> Result.bind (divide 100)
    
    match errorResult with
    | Error msg -> Assert.Equal("Division by zero", msg)
    | Ok _ -> Assert.True(false, "Should propagate division by zero error")

[<Fact>]
let ``Result.apply handles multiple parameters`` () =
    let add x y = x + y
    let fResult = Ok add
    let xResult = Ok 10
    let yResult = Ok 20
    
    let result = fResult |> Result.apply <| xResult |> Result.apply <| yResult
    
    match result with
    | Ok value -> Assert.Equal(30, value)
    | Error _ -> Assert.True(false, "Should apply function to both parameters")

[<Fact>]
let ``Result.sequence combines list of results`` () =
    let results = [Ok 1; Ok 2; Ok 3]
    let combined = Result.sequence results
    
    match combined with
    | Ok values -> Assert.Equal([1; 2; 3], values)
    | Error _ -> Assert.True(false, "Should combine all success results")
    
    let mixedResults = [Ok 1; Error "fail"; Ok 3]
    let failedCombined = Result.sequence mixedResults
    
    match failedCombined with
    | Error msg -> Assert.Equal("fail", msg)
    | Ok _ -> Assert.True(false, "Should fail if any result is Error")

[<Fact>]
let ``Result.traverse maps and sequences in one operation`` () =
    let parseNum (s: string) =
        match System.Int32.TryParse(s) with
        | true, num -> Ok num
        | false, _ -> Error $"'{s}' is not a valid number"
    
    let strings = ["1"; "2"; "3"]
    let result = Result.traverse parseNum strings
    
    match result with
    | Ok numbers -> Assert.Equal([1; 2; 3], numbers)
    | Error _ -> Assert.True(false, "Should parse all valid numbers")
    
    let invalidStrings = ["1"; "abc"; "3"]
    let failedResult = Result.traverse parseNum invalidStrings
    
    match failedResult with
    | Error msg -> Assert.True(msg.Contains("abc"))
    | Ok _ -> Assert.True(false, "Should fail on invalid number")

[<Fact>]
let ``Result.ofOption converts Option to Result`` () =
    let someValue = Some 42
    let result = Result.ofOption "No value" someValue
    
    match result with
    | Ok value -> Assert.Equal(42, value)
    | Error _ -> Assert.True(false, "Should convert Some to Ok")
    
    let noneValue = None
    let errorResult = Result.ofOption "No value" noneValue
    
    match errorResult with
    | Error msg -> Assert.Equal("No value", msg)
    | Ok _ -> Assert.True(false, "Should convert None to Error")

// ========================================
// RESULT BUILDER TESTS
// ========================================

[<Fact>]
let ``result computation expression handles success flow`` () =
    let parseAndAdd (x: string) (y: string) =
        result {
            let! xNum = 
                match System.Int32.TryParse(x) with
                | true, num -> Ok num
                | false, _ -> Error $"'{x}' is not a number"
            
            let! yNum = 
                match System.Int32.TryParse(y) with
                | true, num -> Ok num
                | false, _ -> Error $"'{y}' is not a number"
            
            return xNum + yNum
        }
    
    let result = parseAndAdd "10" "20"
    
    match result with
    | Ok sum -> Assert.Equal(30, sum)
    | Error _ -> Assert.True(false, "Should parse and add successfully")

[<Fact>]
let ``result computation expression short-circuits on error`` () =
    let parseAndAdd (x: string) (y: string) =
        result {
            let! xNum = 
                match System.Int32.TryParse(x) with
                | true, num -> Ok num
                | false, _ -> Error $"'{x}' is not a number"
            
            let! yNum = 
                match System.Int32.TryParse(y) with
                | true, num -> Ok num
                | false, _ -> Error $"'{y}' is not a number"
            
            return xNum + yNum
        }
    
    let result = parseAndAdd "abc" "20"
    
    match result with
    | Error msg -> Assert.True(msg.Contains("abc"))
    | Ok _ -> Assert.True(false, "Should short-circuit on first error")

// ========================================
// ASYNC RESULT TESTS
// ========================================

[<Fact>]
let ``AsyncResult.map transforms async success values`` () =
    let asyncResult = async { return Ok 42 }
    let addOne x = x + 1
    
    let result = 
        asyncResult 
        |> AsyncResult.map addOne 
        |> Async.RunSynchronously
    
    match result with
    | Ok value -> Assert.Equal(43, value)
    | Error _ -> Assert.True(false, "Should transform async success value")

[<Fact>]
let ``AsyncResult.bind chains async operations`` () =
    let asyncDivide x y = 
        async {
            if y = 0 then 
                return Error "Division by zero"
            else 
                return Ok (x / y)
        }
    
    let asyncResult = async { return Ok 100 }
    
    let result = 
        asyncResult 
        |> AsyncResult.bind (asyncDivide 10)
        |> Async.RunSynchronously
    
    match result with
    | Ok value -> Assert.Equal(10, value)
    | Error _ -> Assert.True(false, "Should chain async operations successfully")

[<Fact>]
let ``asyncResult computation expression handles async workflow`` () =
    let asyncParseAndAdd (x: string) (y: string) =
        asyncResult {
            let! xNum = async {
                match System.Int32.TryParse(x) with
                | true, num -> return Ok num
                | false, _ -> return Error $"'{x}' is not a number"
            }
            
            let! yNum = async {
                match System.Int32.TryParse(y) with
                | true, num -> return Ok num
                | false, _ -> return Error $"'{y}' is not a number"
            }
            
            return xNum + yNum
        }
    
    let result = 
        asyncParseAndAdd "15" "25"
        |> Async.RunSynchronously
    
    match result with
    | Ok sum -> Assert.Equal(40, sum)
    | Error _ -> Assert.True(false, "Should handle async workflow successfully")

// ========================================
// PIPELINE OPERATORS TESTS
// ========================================

[<Fact>]
let ``Pipeline operators enable clean composition`` () =
    open Operators
    
    let addOne x = Ok (x + 1)
    let multiplyTwo x = Ok (x * 2)
    let toString x = Ok (string x)
    
    let result = 
        Ok 5
        >>= addOne
        >>= multiplyTwo  
        >>= toString
    
    match result with
    | Ok str -> Assert.Equal("12", str)
    | Error _ -> Assert.True(false, "Should compose operations cleanly")

[<Fact>]
let ``Map operator transforms values in pipeline`` () =
    open Operators
    
    let addOne x = x + 1
    let multiplyTwo x = x * 2
    
    let result = 
        Ok 5
        <!> addOne
        <!> multiplyTwo
    
    match result with
    | Ok value -> Assert.Equal(12, value)
    | Error _ -> Assert.True(false, "Should transform values in pipeline")

[<Fact>]
let ``Kleisli composition chains functions effectively`` () =
    open Operators
    
    let validatePositive x = 
        if x > 0 then Ok x 
        else Error "Must be positive"
    
    let divideByTwo x = Ok (x / 2)
    
    let validateAndDivide = validatePositive >=> divideByTwo
    
    let result = validateAndDivide 10
    
    match result with
    | Ok value -> Assert.Equal(5, value)
    | Error _ -> Assert.True(false, "Should chain functions with Kleisli composition")
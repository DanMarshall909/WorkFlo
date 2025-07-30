/// F# Test Suite: Testing Result Types, Validation, and File Operations
module WorkFlo.Tests.CoreTestsFixed

open Xunit
open FsUnit.Xunit
open WorkFlo.Types
open WorkFlo.Core
open System.IO

/// Test Suite 1: Result Types and Validation
[<Fact>]
let ``validateIssue should accept non-empty strings`` () =
    let validIssues = ["1"; "123"; "999"; "feature-branch"]
    
    validIssues |> List.iter (fun issue ->
        match validateIssue issue with
        | Ok validIssue -> validIssue |> should equal issue
        | Error _ -> failwith $"Expected {issue} to be valid")

[<Fact>]
let ``validateIssue should reject empty or null strings`` () =
    let invalidIssues = [""; "   "]
    
    invalidIssues |> List.iter (fun issue ->
        match validateIssue issue with
        | Error msg -> msg.Contains("empty") |> should be True
        | Ok _ -> failwith $"Expected {issue} to be invalid")

[<Fact>]
let ``validatePositiveInt should accept positive numbers`` () =
    let validNumbers = ["1"; "123"; "999"; "2024"]
    
    validNumbers |> List.iter (fun numStr ->
        match validatePositiveInt numStr with
        | Ok num -> num |> should be (greaterThan 0)
        | Error _ -> failwith $"Expected {numStr} to be valid positive integer")

[<Fact>]
let ``validatePositiveInt should reject non-positive numbers`` () =
    let invalidNumbers = ["0"; "-1"; "-5"; "abc"; ""]
    
    invalidNumbers |> List.iter (fun numStr ->
        match validatePositiveInt numStr with
        | Error _ -> () // Expected
        | Ok _ -> failwith $"Expected {numStr} to be invalid")

[<Fact>]
let ``validateIssueNumber should compose validation functions`` () =
    validateIssueNumber "123" |> should equal (Ok 123)
    match validateIssueNumber "0" with
    | Error msg -> msg.Contains("positive") |> should be True
    | Ok _ -> failwith "Expected 0 to be invalid"
    match validateIssueNumber "" with
    | Error msg -> msg.Contains("empty") |> should be True
    | Ok _ -> failwith "Expected empty string to be invalid"

/// Test Suite 2: File Operations with Result Types
[<Fact>]
let ``readAllText should return Ok for existing files`` () =
    let testFilePath = Path.GetTempFileName()
    let testContent = "Test content for file operations"
    
    try
        File.WriteAllText(testFilePath, testContent)
        let result = readAllText testFilePath
        
        match result with
        | Ok content -> content |> should equal testContent
        | Error msg -> failwith $"Expected file read to succeed: {msg}"
    finally
        if File.Exists(testFilePath) then File.Delete(testFilePath)

[<Fact>]
let ``readAllText should return Error for non-existent files`` () =
    let nonExistentPath = "/tmp/this-file-does-not-exist-12345.txt"
    let result = readAllText nonExistentPath
    
    match result with
    | Error msg -> msg.Contains("File not found") |> should be True
    | Ok _ -> failwith "Expected file read to fail for non-existent file"

[<Fact>]
let ``writeAllText should create file and return Ok`` () =
    let testFilePath = Path.GetTempFileName()
    let testContent = "Test content for write operations"
    
    try
        let result = writeAllText testFilePath testContent
        
        match result with
        | Ok _ -> 
            File.Exists(testFilePath) |> should equal true
            File.ReadAllText(testFilePath) |> should equal testContent
        | Error msg -> failwith $"Expected file write to succeed: {msg}"
    finally
        if File.Exists(testFilePath) then File.Delete(testFilePath)

/// Test Suite 3: State Formatting and Parsing
[<Fact>]
let ``formatState should create parseable key-value format`` () =
    let state = { Issue = "456"; Criteria = 2; Phase = WorkFlo.Types.Green; Total = 4 }
    let formatted = formatState state
    
    formatted.Contains("ISSUE=456") |> should be True
    formatted.Contains("CRITERIA=2") |> should be True
    formatted.Contains("PHASE=Green") |> should be True
    formatted.Contains("TOTAL=4") |> should be True

[<Fact>]
let ``parseStateContent should parse formatted state correctly`` () =
    let content = "ISSUE=789\nCRITERIA=3\nPHASE=Red\nTOTAL=5\n"
    let result = parseStateContent content
    
    match result with
    | Ok state ->
        state.Issue |> should equal "789"
        state.Criteria |> should equal 3
        state.Phase |> should equal WorkFlo.Types.Red
        state.Total |> should equal 5
    | Error msg -> failwith $"Expected parsing to succeed: {msg}"

[<Fact>]
let ``parseStateContent should handle invalid phase names`` () =
    let content = "ISSUE=123\nCRITERIA=1\nPHASE=INVALID_PHASE\nTOTAL=3\n"
    let result = parseStateContent content
    
    match result with
    | Error msg -> msg.Contains("Unknown phase") |> should be True
    | Ok _ -> failwith "Expected parsing to fail for invalid phase"

[<Fact>]
let ``parseStateContent should handle missing fields`` () =
    let content = "ISSUE=123\nCRITERIA=1\n"
    let result = parseStateContent content
    
    match result with
    | Error msg -> msg.Contains("Missing required fields") |> should be True
    | Ok _ -> failwith "Expected parsing to fail for missing fields"

[<Fact>]
let ``parseStateContent should handle invalid numbers`` () =
    let content = "ISSUE=123\nCRITERIA=abc\nPHASE=Start\nTOTAL=xyz\n"
    let result = parseStateContent content
    
    match result with
    | Error msg -> msg.Contains("Invalid criteria or total") |> should be True
    | Ok _ -> failwith "Expected parsing to fail for invalid numbers"

/// Test Suite 4: Complete State Management Pipeline
[<Fact>]
let ``saveState and loadState should round-trip correctly`` () =
    let testState = { Issue = "321"; Criteria = 2; Phase = WorkFlo.Types.Refactor; Total = 4 }
    let testFilePath = Path.GetTempFileName()
    
    try
        // Save state
        match saveState testFilePath testState with
        | Ok _ -> ()
        | Error msg -> failwith $"Save should succeed: {msg}"
        
        // Load state back
        match loadState testFilePath with
        | Ok (Some loadedState) ->
            loadedState.Issue |> should equal testState.Issue
            loadedState.Criteria |> should equal testState.Criteria
            loadedState.Phase |> should equal testState.Phase
            loadedState.Total |> should equal testState.Total
        | Ok None -> failwith "Expected state to be loaded"
        | Error msg -> failwith $"Load should succeed: {msg}"
    finally
        if File.Exists(testFilePath) then File.Delete(testFilePath)

[<Fact>]
let ``loadState should return None for non-existent file`` () =
    let nonExistentPath = "/tmp/non-existent-state-file.txt"
    
    match loadState nonExistentPath with
    | Ok None -> () // Expected behavior
    | Ok (Some _) -> failwith "Expected None for non-existent file"
    | Error msg -> failwith $"Expected Ok None, got Error: {msg}"

/// Test Suite 5: Result Type Chaining
[<Fact>]
let ``Result chaining should short-circuit on first error`` () =
    let pipeline input =
        validateIssue input
        |> Result.bind validatePositiveInt
        |> Result.map (fun num -> num * 2)
    
    pipeline "123" |> should equal (Ok 246)
    
    match pipeline "" with
    | Error msg -> msg.Contains("empty") |> should be True
    | Ok _ -> failwith "Expected empty string to fail validation"
    
    match pipeline "abc" with
    | Error msg -> msg.Contains("valid number") |> should be True
    | Ok _ -> failwith "Expected non-numeric to fail parsing"

/// Test Suite 6: Additional Validation Tests
[<Fact>]
let ``validateIssue should never throw exceptions with various inputs`` () =
    let testInputs = [""; "123"; "abc"; "  "; "0"; "-1"]
    
    testInputs |> List.iter (fun input ->
        try
            match validateIssue input with
            | Ok _ -> ()
            | Error _ -> ()
        with
        | ex -> failwith $"validateIssue should not throw for input '{input}': {ex.Message}")

[<Fact>]
let ``validatePositiveInt should handle edge cases gracefully`` () =
    let edgeCases = ["0"; "-1"; "2147483648"; "abc"; "12.5"; ""]
    
    edgeCases |> List.iter (fun input ->
        try
            match validatePositiveInt input with
            | Ok num -> num |> should be (greaterThan 0)
            | Error _ -> () // Expected for invalid inputs
        with
        | ex -> failwith $"validatePositiveInt should not throw for input '{input}': {ex.Message}")

[<Fact>]
let ``file operations should handle permission errors gracefully`` () =
    // Test with a path that should cause permission issues
    let restrictedPath = "/root/restricted-file.txt"
    
    match writeAllText restrictedPath "test content" with
    | Error msg -> msg.Contains("Access") |> should be True
    | Ok _ -> () // Might succeed in some environments

[<Fact>]
let ``formatState should handle all TddPhase values`` () =
    let phases = [WorkFlo.Types.Start; WorkFlo.Types.Red; WorkFlo.Types.Green; WorkFlo.Types.Refactor; WorkFlo.Types.Cover]
    
    phases |> List.iter (fun phase ->
        let state = { Issue = "test"; Criteria = 1; Phase = phase; Total = 3 }
        let formatted = formatState state
        formatted.Contains($"PHASE={phase}") |> should be True)
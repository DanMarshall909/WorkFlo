#!/usr/bin/env -S dotnet fsi

// Basic functionality test for the refactored F# WorkFlo project

#r "WorkFlo.FSharp/bin/Debug/net9.0/WorkFlo.FSharp.dll"

open WorkFlo.Domain
open WorkFlo.CoreServices
open WorkFlo.Railway.Builders

printfn "Testing F# WorkFlo Refactored Code"
printfn "=================================="

// Test 1: Domain model creation
printfn "\n1. Testing Domain Model Creation:"
let issueResult = IssueNumber.fromString "123"
match issueResult with
| Ok issue -> printfn "✅ IssueNumber created: %d" (IssueNumber.value issue)
| Error err -> printfn "❌ Failed to create IssueNumber: %A" err

let criteriaResult = CriteriaCount.fromString "1"
match criteriaResult with
| Ok criteria -> printfn "✅ CriteriaCount created: %d" (CriteriaCount.value criteria)
| Error err -> printfn "❌ Failed to create CriteriaCount: %A" err

// Test 2: Command parsing
printfn "\n2. Testing Command Parsing:"
let helpResult = CommandService.parseCommand "help" [||]
match helpResult with
| Ok Help -> printfn "✅ Help command parsed successfully"
| _ -> printfn "❌ Failed to parse help command"

let startResult = CommandService.parseCommand "start" [|"456"|]
match startResult with
| Ok (Start issueNum) -> printfn "✅ Start command parsed: issue %d" (IssueNumber.value issueNum)
| _ -> printfn "❌ Failed to parse start command"

// Test 3: State serialization
printfn "\n3. Testing State Serialization:"
result {
    let! issue = IssueNumber.create 789
    let! criteria = CriteriaCount.create 2
    let! total = TotalCount.create 5
    let state = { Issue = issue; Criteria = criteria; Phase = TddPhase.Red; Total = total }
    
    let serialized = StateService.serialize state
    printfn "✅ State serialized:\n%s" serialized
    
    let! deserialized = StateService.deserialize serialized
    printfn "✅ State deserialized: Issue=%d, Criteria=%d, Phase=%A, Total=%d" 
        (IssueNumber.value deserialized.Issue)
        (CriteriaCount.value deserialized.Criteria)
        deserialized.Phase
        (TotalCount.value deserialized.Total)
    
    return ()
} |> function
| Ok () -> printfn "✅ Serialization round-trip successful"
| Error err -> printfn "❌ Serialization failed: %A" err

// Test 4: Railway operators
printfn "\n4. Testing Railway Operators:"
let chainResult = 
    result {
        let! issue = IssueNumber.fromString "999"
        let! criteria = CriteriaCount.fromString "3"
        let! total = TotalCount.fromString "5"
        return (issue, criteria, total)
    }

match chainResult with
| Ok (issue, criteria, total) -> 
    printfn "✅ Railway chaining successful: Issue=%d, Criteria=%d, Total=%d"
        (IssueNumber.value issue)
        (CriteriaCount.value criteria)
        (TotalCount.value total)
| Error err -> printfn "❌ Railway chaining failed: %A" err

printfn "\n=================================="
printfn "F# WorkFlo Core Functionality Test Complete"
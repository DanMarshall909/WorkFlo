#!/usr/bin/env -S dotnet fsi

// Workflow integration test for F# WorkFlo

#r "WorkFlo.FSharp/bin/Debug/net9.0/WorkFlo.FSharp.dll"

open WorkFlo.Domain
open WorkFlo.CoreServices
open WorkFlo.Railway.Builders
open System.IO

printfn "Testing F# WorkFlo Workflow Integration"
printfn "======================================"

let tempStateFile = Path.GetTempFileName()
let config = {
    ConfigFile = ".test-config"
    StateFile = tempStateFile
    ScoreFile = ".test-scores"
    Debug = false
    Verbose = false
}

try
    printfn "\n1. Testing Start Command:"
    let issueNumber = IssueNumber.create 101 |> Result.defaultWith (fun _ -> failwith "Invalid issue")
    
    match WorkflowService.executeCommand config None (Start issueNumber) with
    | Ok (Some newState, message) ->
        printfn "✅ Start command successful: %s" message
        printfn "   State: Issue=%d, Phase=%A, Progress=%.1f%%" 
            (IssueNumber.value newState.Issue)
            newState.Phase
            (TddState.progressPercentage newState)
            
        printfn "\n2. Testing Red Phase Transition:"        
        match WorkflowService.executeCommand config (Some newState) Red with
        | Ok (Some redState, redMessage) ->
            printfn "✅ Red transition successful: %s" redMessage
            printfn "   State: Phase=%A" redState.Phase
            
            printfn "\n3. Testing Green Phase Transition:"
            match WorkflowService.executeCommand config (Some redState) Green with
            | Ok (Some greenState, greenMessage) ->
                printfn "✅ Green transition successful: %s" greenMessage
                printfn "   State: Phase=%A" greenState.Phase
                
                printfn "\n4. Testing Status Command:"
                match WorkflowService.executeCommand config (Some greenState) Status with
                | Ok (_, statusMessage) ->
                    printfn "✅ Status command successful:"
                    printfn "   %s" statusMessage
                | Error err -> printfn "❌ Status failed: %A" err
                
            | Error err -> printfn "❌ Green transition failed: %A" err
        | Error err -> printfn "❌ Red transition failed: %A" err
    | Error err -> printfn "❌ Start command failed: %A" err
    
    printfn "\n5. Testing Validation Logic:"
    // Test invalid transition
    match WorkflowService.executeCommand config None Red with
    | Error (StateTransitionError _) -> printfn "✅ Validation correctly rejected invalid transition"
    | _ -> printfn "❌ Validation failed to reject invalid transition"
    
finally
    if File.Exists(tempStateFile) then File.Delete(tempStateFile)

printfn "\n======================================"
printfn "F# WorkFlo Workflow Integration Test Complete"
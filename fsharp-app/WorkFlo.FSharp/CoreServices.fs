/// Core Services Module - Business Logic Implementation
/// 
/// This module implements the core business services using
/// Railway Oriented Programming and domain-driven design
namespace WorkFlo.CoreServices

open WorkFlo.Domain
open WorkFlo.Railway
open WorkFlo.Railway.Operators

/// File operations with proper error handling
module FileService =
    open System.IO
    
    /// Read file content safely
    let readAllText (path: string) : Result<string, WorkFloError> =
        try
            if File.Exists(path) then
                File.ReadAllText(path) |> Ok
            else
                Error (FileError("read", path, "File does not exist"))
        with
        | ex -> Error (FileError("read", path, ex.Message))
    
    /// Write file content safely
    let writeAllText (path: string) (content: string) : Result<unit, WorkFloError> =
        try
            File.WriteAllText(path, content)
            Ok ()
        with
        | ex -> Error (FileError("write", path, ex.Message))
    
    /// Check if file exists
    let exists (path: string) = File.Exists(path)

/// State serialization and parsing
module StateService =
    open System
    
    /// Serialize TDD state to string format
    let serialize (state: TddState) : string =
        let issue = IssueNumber.value state.Issue
        let criteria = CriteriaCount.value state.Criteria
        let phase = TddPhase.toString state.Phase
        let total = TotalCount.value state.Total
        
        $"ISSUE={issue}\nCRITERIA={criteria}\nPHASE={phase}\nTOTAL={total}\n"
    
    /// Parse TDD state from string format
    let deserialize (content: string) : Result<TddState, WorkFloError> =
        let lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries)
        let parseKvp (line: string) =
            match line.Split('=', 2) with
            | [| key; value |] -> Ok (key.Trim(), value.Trim())
            | _ -> Error (ParseError(line, "Invalid key=value format"))
        
        let getField key pairs =
            pairs 
            |> List.tryFind (fun (k, _) -> k = key)
            |> Option.map snd
            |> Result.ofOption (ParseError(content, $"Missing required field: {key}"))
        
        result {
            let! pairs = lines |> Array.toList |> Result.traverse parseKvp
            let! issueStr = getField "ISSUE" pairs
            let! criteriaStr = getField "CRITERIA" pairs  
            let! phaseStr = getField "PHASE" pairs
            let! totalStr = getField "TOTAL" pairs
            
            let! issue = IssueNumber.fromString issueStr
            let! criteria = CriteriaCount.fromString criteriaStr
            let! phase = TddPhase.fromString phaseStr
            let! total = TotalCount.fromString totalStr
            
            return! TddState.create issue criteria phase total
        }

/// State persistence operations
module StatePersistence =
    /// Save state to file
    let saveState (filePath: string) (state: TddState) : Result<unit, WorkFloError> =
        let content = StateService.serialize state
        FileService.writeAllText filePath content
    
    /// Load state from file  
    let loadState (filePath: string) : Result<TddState option, WorkFloError> =
        if FileService.exists filePath then
            FileService.readAllText filePath
            |> Result.bind StateService.deserialize
            |> Result.map Some
        else
            Ok None
    
    /// Load state with fallback to None if file doesn't exist
    let loadStateOrDefault (filePath: string) : Result<TddState option, WorkFloError> =
        match FileService.exists filePath with
        | true -> loadState filePath
        | false -> Ok None

/// Command validation and parsing
module CommandService =
    /// Parse command from string arguments
    let parseCommand (command: string) (args: string array) : Result<WorkFloCommand, WorkFloError> =
        match command.ToLower(), args with
        | "start", [| issueStr |] ->
            IssueNumber.fromString issueStr |> Result.map Start
        | "start", _ ->
            Error (ValidationError("Start", "Start command requires exactly one issue number argument"))
        | "red", [||] -> Ok Red
        | "green", [||] -> Ok Green  
        | "refactor", [||] -> Ok Refactor
        | "cover", [||] -> Ok Cover
        | "next", [||] -> Ok Next
        | "status", [||] -> Ok Status
        | "help", [||] -> Ok Help
        | unknown, _ ->
            Error (ValidationError("Command", $"Unknown command: {unknown}"))

/// TDD Workflow Business Rules
module WorkflowService =
    /// Validate state transition for a command
    let validateTransition (currentState: TddState option) (command: WorkFloCommand) : Result<unit, WorkFloError> =
        match currentState, command with
        | None, Start _ -> Ok ()  // Can always start fresh
        | None, _ -> Error (StateTransitionError("None", "Command", "Must start workflow first"))
        | Some state, Start _ -> Ok ()  // Can restart anytime
        | Some state, Red when state.Phase = Start -> Ok ()
        | Some state, Green when state.Phase = Red -> Ok ()
        | Some state, Refactor when state.Phase = Green -> Ok ()
        | Some state, Cover when state.Phase = Refactor -> Ok ()
        | Some state, Next when state.Phase = Cover -> Ok ()
        | Some state, Status -> Ok ()  // Status always allowed
        | Some state, Help -> Ok ()    // Help always allowed
        | Some state, cmd ->
            let cmdStr = sprintf "%A" cmd
            let phaseStr = TddPhase.toString state.Phase
            Error (StateTransitionError(phaseStr, cmdStr, $"Cannot execute {cmdStr} in {phaseStr} phase"))
    
    /// Execute a command and return new state
    let executeCommand (config: AppConfig) (currentState: TddState option) (command: WorkFloCommand) : Result<TddState option * string, WorkFloError> =
        result {
            do! validateTransition currentState command
            
            match command with
            | Start issueNumber ->
                let newState = {
                    Issue = issueNumber
                    Criteria = CriteriaCount.create 1 |> Result.defaultWith (fun _ -> failwith "Invalid criteria")
                    Phase = Start
                    Total = TotalCount.create 3 |> Result.defaultWith (fun _ -> failwith "Invalid total")
                }
                do! StatePersistence.saveState config.StateFile newState
                return (Some newState, $"Started TDD workflow for issue {IssueNumber.value issueNumber}")
            
            | Red ->
                match currentState with
                | Some state ->
                    let newState = { state with Phase = Red }
                    do! StatePersistence.saveState config.StateFile newState
                    return (Some newState, "Moved to RED phase - write a failing test")
                | None -> return! Error (StateTransitionError("None", "Red", "No active workflow"))
            
            | Green ->
                match currentState with
                | Some state ->
                    let newState = { state with Phase = Green }
                    do! StatePersistence.saveState config.StateFile newState
                    return (Some newState, "Moved to GREEN phase - make the test pass")
                | None -> return! Error (StateTransitionError("None", "Green", "No active workflow"))
            
            | Refactor ->
                match currentState with
                | Some state ->
                    let newState = { state with Phase = Refactor }
                    do! StatePersistence.saveState config.StateFile newState
                    return (Some newState, "Moved to REFACTOR phase - improve the code")
                | None -> return! Error (StateTransitionError("None", "Refactor", "No active workflow"))
            
            | Cover ->
                match currentState with
                | Some state ->
                    let newState = { state with Phase = Cover }
                    do! StatePersistence.saveState config.StateFile newState
                    return (Some newState, "Moved to COVER phase - check test coverage")
                | None -> return! Error (StateTransitionError("None", "Cover", "No active workflow"))
            
            | Next ->
                match currentState with
                | Some state when TddState.isComplete state ->
                    return (None, "TDD cycle completed successfully!")
                | Some state ->
                    let! nextState = TddState.advanceCriteria state
                    let newState = { nextState with Phase = Start }
                    do! StatePersistence.saveState config.StateFile newState
                    let criteria = CriteriaCount.value newState.Criteria
                    let total = TotalCount.value newState.Total
                    return (Some newState, $"Advanced to criteria {criteria} of {total}")
                | None -> return! Error (StateTransitionError("None", "Next", "No active workflow"))
            
            | Status ->
                match currentState with
                | Some state ->
                    let issue = IssueNumber.value state.Issue
                    let criteria = CriteriaCount.value state.Criteria
                    let total = TotalCount.value state.Total
                    let phase = TddPhase.toString state.Phase
                    let progress = TddState.progressPercentage state
                    return (currentState, $"Issue: {issue}, Phase: {phase}, Progress: {criteria}/{total} ({progress:F1}%)")
                | None -> return (None, "No active TDD workflow")
            
            | Help ->
                let helpText = """
WorkFlo TDD Commands:
  start <issue>  - Start TDD workflow for issue number
  red           - Move to RED phase (write failing test)
  green         - Move to GREEN phase (make test pass)  
  refactor      - Move to REFACTOR phase (improve code)
  cover         - Move to COVER phase (check coverage)
  next          - Advance to next criteria or complete cycle
  status        - Show current workflow status
  help          - Show this help message
"""
                return (currentState, helpText.Trim())
        }
module WorkFlo.Tests.TypesTestsMinimal

open Xunit
open FsUnit.Xunit
open WorkFlo.Types

[<Fact>]
let ``TddState record should be immutable`` () =
    let originalState = { Issue = "123"; Criteria = 1; Phase = Start; Total = 3 }
    let updatedState = { originalState with Criteria = 2 }
    
    originalState.Criteria |> should equal 1
    updatedState.Criteria |> should equal 2
    updatedState.Issue |> should equal "123"
    updatedState.Total |> should equal 3

[<Fact>]
let ``nextCriteria should increment criteria and reset phase to Start`` () =
    let state = { Issue = "456"; Criteria = 2; Phase = Cover; Total = 3 }
    let result = nextCriteria state
    
    result.Criteria |> should equal 3
    result.Phase |> should equal Start
    result.Issue |> should equal "456"
    result.Total |> should equal 3

[<Fact>]
let ``TddPhase discriminated union should have all expected cases`` () =
    let phases = [Start; Red; Green; Refactor; Cover]
    
    phases |> should haveLength 5
    phases |> should contain Start
    phases |> should contain Red
    phases |> should contain Green
    phases |> should contain Refactor
    phases |> should contain Cover
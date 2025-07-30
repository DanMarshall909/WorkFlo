module WorkFlo.Tests.Simple

open Xunit
open FsUnit.Xunit
open WorkFlo.Types

[<Fact>]
let ``simple test works`` () =
    1 |> should equal 1

[<Fact>]
let ``tryParseInt basic test`` () =
    tryParseInt "123" |> should equal (Some 123)
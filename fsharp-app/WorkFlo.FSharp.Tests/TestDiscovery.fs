module WorkFlo.Tests.TestDiscovery

open Xunit
open FsUnit.Xunit

[<Fact>]
let ``simple test to check discovery`` () =
    1 |> should equal 1
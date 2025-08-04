#!/usr/bin/env bats

@test "flo --persona gemini switches to gemini persona" {
    run ./flo --persona gemini
    [ "$status" -eq 0 ]
    [[ "$output" == *"Switched to gemini persona"* ]]
    run cat .workflo-config
    [ "$status" -eq 0 ]
    [[ "$output" == *"PERSONA=gemini"* ]]
}

@test "flo --persona claude switches to claude persona" {
    run ./flo --persona claude
    [ "$status" -eq 0 ]
    [[ "$output" == *"Switched to claude persona"* ]]
    run cat .workflo-config
    [ "$status" -eq 0 ]
    [[ "$output" == *"PERSONA=claude"* ]]
}

@test "flo --persona invalid-persona shows an error" {
    run ./flo --persona invalid-persona
    [ "$status" -ne 0 ]
    [[ "$output" == *"Persona file not found"* ]]
}
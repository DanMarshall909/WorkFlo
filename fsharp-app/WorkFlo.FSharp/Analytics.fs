/// Analytics Module - TDD Session Analysis and Reporting
/// 
/// This module provides analytics and insights for TDD sessions
/// using functional composition and immutable data structures
namespace WorkFlo.Analytics

open WorkFlo.Domain
open WorkFlo.Railway
open WorkFlo.Railway.Operators
open System

/// Performance metrics for TDD sessions
type PerformanceMetrics = {
    Duration: TimeSpan
    SuccessRate: float
    Efficiency: float
    PhasesCompleted: int
    TestsPerMinute: float
}

module PerformanceMetrics =
    /// Calculate metrics from a TDD session
    let calculate (session: TddSession) : PerformanceMetrics =
        let duration = TddSession.duration session
        let successRate = TddSession.successRate session
        let testsPerMinute = 
            if duration.TotalMinutes > 0.0 
            then float session.TestRuns / duration.TotalMinutes
            else 0.0
        
        {
            Duration = duration
            SuccessRate = successRate
            Efficiency = if TddSession.isEfficient session then 100.0 else successRate
            PhasesCompleted = 1  // Simplified for now
            TestsPerMinute = testsPerMinute
        }

/// TDD Session analysis patterns using active patterns
module SessionAnalysis =
    /// Classify session performance
    let (|Excellent|Good|NeedsImprovement|Poor|) (metrics: PerformanceMetrics) =
        match metrics.SuccessRate, metrics.TestsPerMinute with
        | rate, tpm when rate >= 90.0 && tpm >= 2.0 -> Excellent
        | rate, tpm when rate >= 75.0 && tpm >= 1.0 -> Good  
        | rate, tpm when rate >= 50.0 || tpm >= 0.5 -> NeedsImprovement
        | _ -> Poor
    
    /// Classify session duration
    let (|Quick|Normal|Slow|VerySlow|) (duration: TimeSpan) =
        match duration.TotalMinutes with
        | mins when mins <= 10.0 -> Quick
        | mins when mins <= 30.0 -> Normal
        | mins when mins <= 60.0 -> Slow
        | _ -> VerySlow
    
    /// Generate analysis message for a session
    let analyzeSession (session: TddSession) : string =
        let metrics = PerformanceMetrics.calculate session
        let durationText = 
            match metrics.Duration with
            | Quick -> "excellent time management"
            | Normal -> "good pacing"
            | Slow -> "could be faster"
            | VerySlow -> "took quite a while"
        
        let performanceText =
            match metrics with
            | Excellent -> "Outstanding TDD practice!"
            | Good -> "Solid TDD execution"
            | NeedsImprovement -> "Room for improvement"
            | Poor -> "Consider reviewing TDD fundamentals"
        
        $"{performanceText} ({durationText}, {metrics.SuccessRate:F1}% success rate)"

/// Session history analysis using functional composition
module HistoryAnalysis =
    /// Aggregate session statistics
    type SessionStats = {
        TotalSessions: int
        AverageSuccessRate: float
        TotalTestRuns: int
        AverageSessionDuration: TimeSpan
        CompletionRate: float
    }
    
    /// Calculate statistics from session history
    let calculateStats (sessions: TddSession list) : SessionStats =
        if List.isEmpty sessions then
            {
                TotalSessions = 0
                AverageSuccessRate = 0.0
                TotalTestRuns = 0
                AverageSessionDuration = TimeSpan.Zero
                CompletionRate = 0.0
            }
        else
            let totalSessions = List.length sessions
            let totalTestRuns = sessions |> List.sumBy (fun s -> s.TestRuns)
            let averageSuccessRate = 
                sessions 
                |> List.map TddSession.successRate
                |> List.average
            
            let totalMinutes = 
                sessions
                |> List.map TddSession.duration
                |> List.sumBy (fun ts -> ts.TotalMinutes)
            
            let averageDuration = TimeSpan.FromMinutes(totalMinutes / float totalSessions)
            
            let completedSessions = 
                sessions 
                |> List.filter (fun s -> TddState.isComplete s.State)
                |> List.length
            
            let completionRate = float completedSessions / float totalSessions * 100.0
            
            {
                TotalSessions = totalSessions
                AverageSuccessRate = averageSuccessRate
                TotalTestRuns = totalTestRuns
                AverageSessionDuration = averageDuration
                CompletionRate = completionRate
            }
    
    /// Generate insights from session statistics
    let generateInsights (stats: SessionStats) : string list =
        [
            if stats.TotalSessions = 0 then
                "No TDD sessions recorded yet. Start with 'workflo start <issue-number>'"
            
            elif stats.TotalSessions = 1 then
                "Great start! One TDD session completed."
            
            else
                $"Total sessions: {stats.TotalSessions}"
                $"Average success rate: {stats.AverageSuccessRate:F1}%"
                $"Total tests written: {stats.TotalTestRuns}"
                $"Average session time: {stats.AverageSessionDuration.TotalMinutes:F1} minutes"
                $"Completion rate: {stats.CompletionRate:F1}%"
                
                if stats.CompletionRate < 50.0 then
                    "💡 Tip: Try to complete more TDD cycles for better practice"
                
                if stats.AverageSuccessRate < 75.0 then
                    "💡 Tip: Focus on writing simpler, more focused tests"
                
                if stats.AverageSessionDuration.TotalMinutes > 45.0 then
                    "💡 Tip: Consider shorter TDD cycles with smaller increments"
        ]

/// Progress tracking and goal setting
module ProgressTracking =
    /// TDD skill level based on performance
    type SkillLevel =
        | Beginner
        | Intermediate  
        | Advanced
        | Expert
    
    /// Determine skill level from session history
    let assessSkillLevel (sessions: TddSession list) : SkillLevel =
        let stats = HistoryAnalysis.calculateStats sessions
        
        match stats.TotalSessions, stats.AverageSuccessRate, stats.CompletionRate with
        | sessions, rate, completion when sessions >= 20 && rate >= 90.0 && completion >= 80.0 -> Expert
        | sessions, rate, completion when sessions >= 10 && rate >= 80.0 && completion >= 70.0 -> Advanced
        | sessions, rate, completion when sessions >= 5 && rate >= 70.0 && completion >= 60.0 -> Intermediate
        | _ -> Beginner
    
    /// Generate personalized recommendations
    let getRecommendations (skillLevel: SkillLevel) (recentSession: TddSession option) : string list =
        let baseRecommendations =
            match skillLevel with
            | Beginner -> 
                [
                    "Focus on the basic Red-Green-Refactor cycle"
                    "Write the simplest test that fails first"
                    "Make small, incremental changes"
                ]
            | Intermediate -> 
                [
                    "Practice test-driven design patterns"
                    "Focus on refactoring techniques"
                    "Experiment with different testing strategies"
                ]
            | Advanced -> 
                [
                    "Explore advanced TDD patterns like Outside-In TDD"
                    "Practice behavior-driven development (BDD)"
                    "Mentor others in TDD practices"
                ]
            | Expert -> 
                [
                    "Contribute to TDD communities and discussions"
                    "Develop new TDD techniques and tools"
                    "Share your expertise through teaching"
                ]
        
        let sessionSpecificTips =
            match recentSession with
            | Some session ->
                let metrics = PerformanceMetrics.calculate session
                [
                    if metrics.TestsPerMinute < 1.0 then
                        "Try writing smaller, more focused tests"
                    if metrics.SuccessRate < 80.0 then
                        "Consider using a more systematic approach to debugging"
                    if metrics.Duration.TotalMinutes > 30.0 then
                        "Break down larger problems into smaller pieces"
                ]
            | None -> []
        
        baseRecommendations @ sessionSpecificTips

/// Report generation with functional composition
module Reporting =
    /// Generate comprehensive TDD report
    let generateSessionReport (session: TddSession) : string =
        let analysis = SessionAnalysis.analyzeSession session
        let metrics = PerformanceMetrics.calculate session
        let duration = TddSession.duration session
        let issue = IssueNumber.value session.State.Issue
        
        $"""
TDD Session Report - Issue #{issue}
=====================================
Status: {analysis}
Duration: {duration.TotalMinutes:F1} minutes
Test Runs: {session.TestRuns}
Failed Tests: {session.FailedTests}
Success Rate: {metrics.SuccessRate:F1}%
Tests per Minute: {metrics.TestsPerMinute:F1}

Current Phase: {TddPhase.toString session.State.Phase}
Progress: {TddState.progressPercentage session.State:F1}% complete
"""
    
    /// Generate history summary report
    let generateHistoryReport (sessions: TddSession list) : string =
        let stats = HistoryAnalysis.calculateStats sessions
        let insights = HistoryAnalysis.generateInsights stats
        let skillLevel = ProgressTracking.assessSkillLevel sessions
        let recommendations = ProgressTracking.getRecommendations skillLevel None
        
        let insightsText = insights |> String.concat "\n"
        let recommendationsText = recommendations |> String.concat "\n• "
        
        $"""
TDD Practice Summary
===================
{insightsText}

Skill Level: {skillLevel}

Recommendations:
• {recommendationsText}
"""
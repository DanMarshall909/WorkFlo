#!/bin/bash
# Fallback AI Provider for WorkFlo TDD
# Provides basic heuristic analysis when AI providers are unavailable

# Fallback review implementation using heuristics
ai_review() {
    local changes="$1"
    local branch="$2"
    local commit_msg="$3"
    
    echo "⚠️ AI not available, using basic static analysis"
    
    local line_count=$(echo "$changes" | wc -l)
    local complexity_score=$((100 - (line_count > 50 ? (line_count - 50) / 2 : 0)))
    [[ $complexity_score -lt 60 ]] && complexity_score=60
    [[ $complexity_score -gt 95 ]] && complexity_score=95
    
    echo "Quality assessment: ${complexity_score}/100"
    echo "Code review suggestions:"
    
    # Basic heuristic analysis
    if echo "$changes" | grep -q "function\|def\|=>" && [[ $line_count -gt 20 ]]; then
        echo "  • Consider breaking down large functions into smaller ones"
    fi
    if echo "$changes" | grep -qE "TODO|FIXME|HACK"; then
        echo "  • Address TODO/FIXME comments before committing"
    fi
    if echo "$changes" | grep -q "console.log\|echo.*debug\|print(" && ! echo "$changes" | grep -q "test"; then
        echo "  • Remove debug statements before production"
    fi
    if [[ $line_count -lt 5 ]]; then
        echo "  • Changes look minimal and focused - good TDD practice"
    fi
    echo "  • Consider adding tests for any new functionality"
}

# Fallback commit message generation
generate_commit_message() {
    local phase="$1"
    local criteria="$2"
    local criteria_text="$3"
    local issue="$4"
    local issue_title="$5"
    
    echo "Co-Authored-By: WorkFlo-TDD <noreply@workflo.dev>"
}

# Fallback PR content generation
generate_pr_content() {
    local issue="$1"
    local issue_title="$2"
    
    echo "🤖 Generated with WorkFlo TDD automation"
}

# Export functions for use by main script
export -f ai_review
export -f generate_commit_message
export -f generate_pr_content
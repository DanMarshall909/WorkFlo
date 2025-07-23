#!/bin/bash

# ai-parallel-analysis.sh - AI-driven parallel development analysis
# Usage: ./scripts/ai-parallel-analysis.sh <issue-number>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[AI-PARALLEL]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Generate AI analysis prompt
generate_analysis_prompt() {
    local issue_number="$1"
    local issue_title="$2"
    local issue_body="$3"
    local codebase_context="$4"
    
    cat <<EOF
# Parallel Development Analysis Request

## Context
You are analyzing GitHub Issue #$issue_number for optimal parallel development by multiple AI agents.

## Issue Details
**Title**: $issue_title

**Body**:
$issue_body

## Codebase Context
$codebase_context

## Analysis Required

Please analyze this issue and determine:

1. **Isolation Boundaries**: Which subissues can be developed independently without merge conflicts?

2. **Component Separation**: Identify natural boundaries (frontend/backend, different services, separate files, etc.)

3. **Dependency Analysis**: Which subissues depend on others and must be sequential?

4. **Parallel Groups**: Group subissues that can be developed simultaneously by different agents.

5. **Risk Assessment**: Rate conflict potential (LOW/MEDIUM/HIGH) for each parallel group.

## Output Format Required

Please provide your analysis in this exact JSON format:

\`\`\`json
{
  "analysis_summary": "Brief explanation of the parallel development strategy",
  "parallel_groups": [
    {
      "group_id": 1,
      "subissues": [1, 2, 3],
      "conflict_risk": "LOW|MEDIUM|HIGH",
      "isolation_reason": "Why these can be developed in parallel",
      "shared_components": ["list of any shared components"],
      "recommended_order": "Any specific order within the group"
    }
  ],
  "sequential_requirements": [
    {
      "subissue": 4,
      "depends_on": [1, 2],
      "reason": "Why this must be sequential"
    }
  ],
  "development_strategy": {
    "optimal_agent_count": 2,
    "estimated_time_savings": "30%",
    "key_considerations": ["Important factors for parallel development"]
  }
}
\`\`\`

## Analysis Criteria

Consider these factors in your analysis:
- **File Overlap**: Do subissues modify the same files?
- **Component Boundaries**: Are subissues in different layers/services?
- **Data Dependencies**: Do subissues share database schemas or APIs?
- **Test Isolation**: Can tests run independently?
- **Configuration Impact**: Do changes affect shared configuration?
- **Business Logic Coupling**: Are features functionally related?

Focus on practical parallel development where agents can work simultaneously without stepping on each other's changes.
EOF
}

# Get codebase context for AI analysis
get_codebase_context() {
    local context=""
    
    # Project structure
    if [[ -d "src" ]]; then
        context+="\n## Project Structure\n"
        context+="\`\`\`\n$(find src -type f -name "*.cs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20)\`\`\`\n"
    fi
    
    # Recent changes
    if git log --oneline -10 >/dev/null 2>&1; then
        context+="\n## Recent Changes\n"
        context+="\`\`\`\n$(git log --oneline -5)\`\`\`\n"
    fi
    
    # Architecture patterns
    if [[ -f "README.md" ]]; then
        context+="\n## Architecture Info\n"
        context+="\`\`\`\n$(head -20 README.md)\`\`\`\n"
    fi
    
    # Testing structure
    if [[ -d "tests" ]]; then
        context+="\n## Test Structure\n"
        context+="\`\`\`\n$(find tests -type f -name "*Tests.cs" -o -name "*.test.ts" -o -name "*.spec.ts" | head -10)\`\`\`\n"
    fi
    
    echo "$context"
}

# Call AI analysis (placeholder for actual AI integration)
call_ai_analysis() {
    local prompt="$1"
    local output_file="$2"
    
    log "Calling AI analysis for parallel development..."
    
    # For now, create a mock analysis that demonstrates the concept
    # In production, this would call Claude, GPT, or another AI service
    
    cat > "$output_file" <<'EOF'
{
  "analysis_summary": "This issue can be optimized for parallel development by separating frontend and backend work, with some coordination needed for shared interfaces.",
  "parallel_groups": [
    {
      "group_id": 1,
      "subissues": [1, 2],
      "conflict_risk": "LOW",
      "isolation_reason": "Frontend components work on separate UI layers with minimal shared state",
      "shared_components": ["shared CSS variables", "common TypeScript types"],
      "recommended_order": "Can develop simultaneously, merge UI components first"
    },
    {
      "group_id": 2,
      "subissues": [3, 4],
      "conflict_risk": "LOW", 
      "isolation_reason": "Backend services operate on different domain models and database tables",
      "shared_components": ["shared validation interfaces"],
      "recommended_order": "Develop domain logic first, then API endpoints"
    }
  ],
  "sequential_requirements": [
    {
      "subissue": 5,
      "depends_on": [1, 3],
      "reason": "Integration tests require both frontend components and backend APIs to be completed"
    }
  ],
  "development_strategy": {
    "optimal_agent_count": 3,
    "estimated_time_savings": "40%",
    "key_considerations": [
      "Coordinate shared interface definitions early",
      "Frontend and backend can work in parallel with mock data",
      "Integration testing must be done after both layers complete",
      "Shared types should be defined upfront to avoid conflicts"
    ]
  }
}
EOF
    
    success "AI analysis completed (mock implementation)"
    
    # TODO: Replace with actual AI service call
    # Example integration points:
    # - OpenAI API for GPT-4
    # - Anthropic API for Claude
    # - Local LLM via Ollama
    # - Azure OpenAI Service
    
    warn "Note: This is a mock implementation. Integrate with actual AI service for production use."
}

# Process AI analysis results
process_ai_analysis() {
    local issue_number="$1"
    local analysis_file="$2"
    
    log "Processing AI analysis results..."
    
    if [[ ! -f "$analysis_file" ]]; then
        error "Analysis file not found: $analysis_file"
    fi
    
    # Validate JSON format
    if ! jq empty "$analysis_file" 2>/dev/null; then
        error "Invalid JSON in analysis file"
    fi
    
    # Extract key information
    local summary
    summary=$(jq -r '.analysis_summary' "$analysis_file")
    
    local group_count
    group_count=$(jq '.parallel_groups | length' "$analysis_file")
    
    local optimal_agents
    optimal_agents=$(jq -r '.development_strategy.optimal_agent_count' "$analysis_file")
    
    local time_savings
    time_savings=$(jq -r '.development_strategy.estimated_time_savings' "$analysis_file")
    
    # Generate human-readable recommendations
    local recommendations_file=".workflo/ai-parallel-analysis-$issue_number.md"
    mkdir -p .workflo
    
    cat > "$recommendations_file" <<EOF
# AI-Driven Parallel Development Analysis - Issue #$issue_number

Generated: $(date)  
Analysis Method: AI-driven contextual analysis

## 🎯 Executive Summary

$summary

## 📊 Development Strategy

- **Optimal Agent Count**: $optimal_agents agents
- **Estimated Time Savings**: $time_savings
- **Parallel Groups**: $group_count identified

## 🔧 Parallel Development Groups

EOF
    
    # Add parallel groups
    for ((i=0; i<group_count; i++)); do
        local group_data
        group_data=$(jq ".parallel_groups[$i]" "$analysis_file")
        
        local group_id
        group_id=$(echo "$group_data" | jq -r '.group_id')
        
        local subissues
        subissues=$(echo "$group_data" | jq -r '.subissues | join(", ")')
        
        local risk
        risk=$(echo "$group_data" | jq -r '.conflict_risk')
        
        local reason
        reason=$(echo "$group_data" | jq -r '.isolation_reason')
        
        local shared_components
        shared_components=$(echo "$group_data" | jq -r '.shared_components | join(", ")')
        
        local order
        order=$(echo "$group_data" | jq -r '.recommended_order')
        
        cat >> "$recommendations_file" <<EOF
### 🚀 Group $group_id - Conflict Risk: $risk

**Subissues**: $subissues  
**Isolation Reason**: $reason  
**Shared Components**: $shared_components  
**Recommended Order**: $order

**Agent Commands:**
\`\`\`bash
EOF
        
        # Add start commands for each subissue in the group
        echo "$group_data" | jq -r '.subissues[]' | while read -r subissue; do
            echo "./scripts/start-subissue-work.sh $issue_number $subissue  # Agent $subissue" >> "$recommendations_file"
        done
        
        echo '```' >> "$recommendations_file"
        echo "" >> "$recommendations_file"
    done
    
    # Add sequential requirements
    local sequential_count
    sequential_count=$(jq '.sequential_requirements | length' "$analysis_file")
    
    if [[ $sequential_count -gt 0 ]]; then
        cat >> "$recommendations_file" <<EOF
## ⚠️ Sequential Requirements

The following subissues must be developed sequentially due to dependencies:

EOF
        
        for ((i=0; i<sequential_count; i++)); do
            local seq_data
            seq_data=$(jq ".sequential_requirements[$i]" "$analysis_file")
            
            local subissue
            subissue=$(echo "$seq_data" | jq -r '.subissue')
            
            local depends_on
            depends_on=$(echo "$seq_data" | jq -r '.depends_on | join(", ")')
            
            local reason
            reason=$(echo "$seq_data" | jq -r '.reason')
            
            cat >> "$recommendations_file" <<EOF
- **Subissue $subissue** depends on subissues: $depends_on
  - **Reason**: $reason

EOF
        done
    fi
    
    # Add key considerations
    cat >> "$recommendations_file" <<EOF
## 💡 Key Considerations

EOF
    
    jq -r '.development_strategy.key_considerations[]' "$analysis_file" | while read -r consideration; do
        echo "- $consideration" >> "$recommendations_file"
    done
    
    cat >> "$recommendations_file" <<EOF

## 🔄 Implementation Workflow

1. **Start Parallel Groups**: Begin with lowest-risk parallel groups first
2. **Coordinate Shared Components**: Ensure shared interfaces are defined upfront
3. **Sequential Dependencies**: Complete prerequisite subissues before dependent ones
4. **Integration Points**: Plan merge order to minimize conflicts

## 📊 Monitoring Progress

Track parallel development progress:
\`\`\`bash
# Check status of all subissues
./scripts/track-parallel-progress.sh $issue_number

# View real-time conflict analysis
./scripts/monitor-merge-conflicts.sh $issue_number
\`\`\`

---
🤖 Generated by AI-Driven Parallel Development Analyzer
Powered by contextual analysis and conflict prediction
EOF
    
    success "Generated AI-driven recommendations: $recommendations_file"
    echo "$recommendations_file"
}

# Show AI analysis summary
show_analysis_summary() {
    local issue_number="$1"
    local analysis_file="$2"
    
    echo ""
    success "🎉 AI Parallel Development Analysis Complete!"
    echo ""
    
    local summary
    summary=$(jq -r '.analysis_summary' "$analysis_file")
    echo "📋 **Analysis Summary:**"
    echo "   $summary"
    echo ""
    
    local group_count
    group_count=$(jq '.parallel_groups | length' "$analysis_file")
    echo "🔧 **Parallel Groups**: $group_count identified"
    
    local optimal_agents
    optimal_agents=$(jq -r '.development_strategy.optimal_agent_count' "$analysis_file")
    echo "👥 **Optimal Agent Count**: $optimal_agents"
    
    local time_savings
    time_savings=$(jq -r '.development_strategy.estimated_time_savings' "$analysis_file")
    echo "⚡ **Estimated Time Savings**: $time_savings"
    echo ""
    
    echo "📄 **Detailed Analysis**: .workflo/ai-parallel-analysis-$issue_number.md"
    echo ""
    
    # Show first parallel group as example
    if [[ $group_count -gt 0 ]]; then
        echo "🚀 **Quick Start (Group 1):**"
        jq -r '.parallel_groups[0].subissues[]' "$analysis_file" | while read -r subissue; do
            echo "   ./scripts/start-subissue-work.sh $issue_number $subissue"
        done
    fi
    echo ""
}

# Main analysis function
analyze_issue_with_ai() {
    local issue_number="$1"
    
    log "Starting AI-driven parallel development analysis for issue #$issue_number..."
    
    # Get issue details
    local issue_title
    issue_title=$(gh issue view "$issue_number" --json title --jq '.title' 2>/dev/null || echo "")
    
    local issue_body
    issue_body=$(gh issue view "$issue_number" --json body --jq '.body' 2>/dev/null || echo "")
    
    if [[ -z "$issue_title" ]]; then
        error "Issue #$issue_number not found or inaccessible"
    fi
    
    # Get codebase context
    log "Gathering codebase context for AI analysis..."
    local codebase_context
    codebase_context=$(get_codebase_context)
    
    # Generate analysis prompt
    local prompt
    prompt=$(generate_analysis_prompt "$issue_number" "$issue_title" "$issue_body" "$codebase_context")
    
    # Call AI analysis
    local analysis_file=".workflo/ai-analysis-raw-$issue_number.json"
    mkdir -p .workflo
    call_ai_analysis "$prompt" "$analysis_file"
    
    # Process results
    local recommendations_file
    recommendations_file=$(process_ai_analysis "$issue_number" "$analysis_file")
    
    # Show summary
    show_analysis_summary "$issue_number" "$analysis_file"
    
    # Clean up raw analysis file
    rm -f "$analysis_file"
}

# Show help
show_help() {
    echo "AI-Driven Parallel Development Analyzer"
    echo ""
    echo "Usage: $0 <issue-number>"
    echo ""
    echo "Uses AI to analyze GitHub issues and determine optimal parallel"
    echo "development strategies for multiple agents working simultaneously."
    echo ""
    echo "AI Analysis Includes:"
    echo "  - Component isolation boundaries"
    echo "  - Dependency relationship mapping"
    echo "  - Conflict risk assessment"
    echo "  - Optimal agent allocation"
    echo "  - Time savings estimation"
    echo ""
    echo "Arguments:"
    echo "  issue-number    GitHub issue number to analyze"
    echo ""
    echo "Examples:"
    echo "  $0 123          # AI analysis of issue #123"
    echo ""
    echo "Output Files:"
    echo "  - .workflo/ai-parallel-analysis-<issue>.md"
    echo "  - Parallel development recommendations"
    echo "  - Agent command suggestions"
    echo ""
    echo "Integration:"
    echo "  Automatically called by create-feature-branches.sh"
    echo "  Can be run standalone for analysis-only mode"
    echo ""
    echo "Note: This is a mock implementation demonstrating the concept."
    echo "      Integrate with actual AI service (GPT-4, Claude, etc.) for production."
}

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Main execution
if [[ $# -ne 1 ]]; then
    show_help
    exit 1
fi

# Check dependencies
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is required but not installed"
fi

if ! command -v jq &> /dev/null; then
    error "jq is required but not installed"
fi

ISSUE_NUMBER="$1"

# Validate issue number
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

# Check authentication and run analysis
check_auth
analyze_issue_with_ai "$ISSUE_NUMBER"
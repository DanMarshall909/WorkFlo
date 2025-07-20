#!/bin/bash

# analyze-parallel-development.sh - Analyze subissues for parallel development potential
# Usage: ./scripts/analyze-parallel-development.sh <issue-number>

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
    echo -e "${BLUE}[PARALLEL-ANALYSIS]${NC} $1"
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

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Extract file paths mentioned in issue
extract_file_paths() {
    local issue_body="$1"
    local file_paths=()
    
    # Look for common file path patterns
    while IFS= read -r line; do
        # Match patterns like src/path/to/file.ext, tests/path/file.test.ext
        if [[ "$line" =~ (src/[a-zA-Z0-9/_.-]+\.[a-zA-Z]+|tests/[a-zA-Z0-9/_.-]+\.[a-zA-Z]+|\./[a-zA-Z0-9/_.-]+\.[a-zA-Z]+) ]]; then
            local file_path="${BASH_REMATCH[1]}"
            file_paths+=("$file_path")
        fi
        
        # Match markdown code blocks with file references
        if [[ "$line" =~ ^\s*-\s+\`([^`]+\.[a-zA-Z]+)\` ]]; then
            local file_path="${BASH_REMATCH[1]}"
            file_paths+=("$file_path")
        fi
    done <<< "$issue_body"
    
    # Remove duplicates and output
    printf '%s\n' "${file_paths[@]}" | sort -u
}

# Analyze component dependencies
analyze_component_dependencies() {
    local test_specs=("$@")
    local dependencies=()
    
    log "Analyzing component dependencies..."
    
    for spec in "${test_specs[@]}"; do
        IFS=':' read -r test_type test_desc short_name <<< "$spec"
        
        # Analyze test description for component mentions
        local components=()
        
        # Common component patterns
        if [[ "$test_desc" =~ (Service|Controller|Repository|Handler|Command|Query|Endpoint) ]]; then
            components+=("${BASH_REMATCH[1]}")
        fi
        
        # Database-related tests
        if [[ "$test_desc" =~ (database|sql|entity|migration|schema) ]]; then
            components+=("Database")
        fi
        
        # API-related tests
        if [[ "$test_desc" =~ (api|endpoint|http|request|response) ]]; then
            components+=("API")
        fi
        
        # UI-related tests
        if [[ "$test_desc" =~ (ui|component|page|form|button) ]]; then
            components+=("UI")
        fi
        
        # Configuration-related tests
        if [[ "$test_desc" =~ (config|setting|environment|variable) ]]; then
            components+=("Configuration")
        fi
        
        # Authentication-related tests
        if [[ "$test_desc" =~ (auth|login|token|jwt|oauth) ]]; then
            components+=("Authentication")
        fi
        
        dependencies+=("$test_type-$test_desc:$(IFS=','; echo "${components[*]}")")
    done
    
    printf '%s\n' "${dependencies[@]}"
}

# Calculate conflict potential between subissues
calculate_conflict_potential() {
    local dependencies=("$@")
    local conflict_matrix=()
    
    log "Calculating conflict potential between subissues..."
    
    # Compare each pair of subissues
    for ((i=0; i<${#dependencies[@]}; i++)); do
        for ((j=i+1; j<${#dependencies[@]}; j++)); do
            IFS=':' read -r desc1 components1 <<< "${dependencies[i]}"
            IFS=':' read -r desc2 components2 <<< "${dependencies[j]}"
            
            # Calculate overlap in components
            local overlap=0
            local total_components=0
            
            if [[ -n "$components1" && -n "$components2" ]]; then
                IFS=',' read -ra comp1_array <<< "$components1"
                IFS=',' read -ra comp2_array <<< "$components2"
                
                # Count overlapping components
                for comp1 in "${comp1_array[@]}"; do
                    for comp2 in "${comp2_array[@]}"; do
                        if [[ "$comp1" == "$comp2" ]]; then
                            ((overlap++))
                        fi
                    done
                done
                
                total_components=$((${#comp1_array[@]} + ${#comp2_array[@]}))
            fi
            
            # Calculate conflict score (0-100)
            local conflict_score=0
            if [[ $total_components -gt 0 ]]; then
                conflict_score=$(( (overlap * 200) / total_components ))
            fi
            
            conflict_matrix+=("$((i+1)):$((j+1)):$conflict_score:$desc1:$desc2")
        done
    done
    
    printf '%s\n' "${conflict_matrix[@]}"
}

# Group subissues into parallel development sets
group_parallel_subissues() {
    local conflict_matrix=("$@")
    local parallel_groups=()
    local assigned_subissues=()
    
    log "Grouping subissues for parallel development..."
    
    # Find total number of subissues
    local max_subissue=0
    for conflict in "${conflict_matrix[@]}"; do
        IFS=':' read -r sub1 sub2 score desc1 desc2 <<< "$conflict"
        if [[ $sub1 -gt $max_subissue ]]; then max_subissue=$sub1; fi
        if [[ $sub2 -gt $max_subissue ]]; then max_subissue=$sub2; fi
    done
    
    # Group subissues with low conflict potential
    for ((group=1; group<=max_subissue; group++)); do
        local current_group=()
        
        # Start with unassigned subissue
        for ((sub=1; sub<=max_subissue; sub++)); do
            local is_assigned=false
            for assigned in "${assigned_subissues[@]}"; do
                if [[ "$assigned" == "$sub" ]]; then
                    is_assigned=true
                    break
                fi
            done
            
            if [[ "$is_assigned" == "false" ]]; then
                current_group+=("$sub")
                assigned_subissues+=("$sub")
                break
            fi
        done
        
        # Add compatible subissues to current group
        for ((sub=1; sub<=max_subissue; sub++)); do
            local is_assigned=false
            for assigned in "${assigned_subissues[@]}"; do
                if [[ "$assigned" == "$sub" ]]; then
                    is_assigned=true
                    break
                fi
            done
            
            if [[ "$is_assigned" == "false" ]]; then
                local can_add=true
                
                # Check conflict with all subissues in current group
                for group_sub in "${current_group[@]}"; do
                    for conflict in "${conflict_matrix[@]}"; do
                        IFS=':' read -r sub1 sub2 score desc1 desc2 <<< "$conflict"
                        
                        # Check if this pair has high conflict
                        if [[ (("$sub1" == "$group_sub" && "$sub2" == "$sub")) || (("$sub1" == "$sub" && "$sub2" == "$group_sub")) ]]; then
                            if [[ $score -gt 30 ]]; then  # High conflict threshold
                                can_add=false
                                break
                            fi
                        fi
                    done
                    
                    if [[ "$can_add" == "false" ]]; then
                        break
                    fi
                done
                
                if [[ "$can_add" == "true" ]]; then
                    current_group+=("$sub")
                    assigned_subissues+=("$sub")
                fi
            fi
        done
        
        # Add group if it has subissues
        if [[ ${#current_group[@]} -gt 0 ]]; then
            parallel_groups+=("$(IFS=','; echo "${current_group[*]}")")
        fi
        
        # Stop if all subissues are assigned
        if [[ ${#assigned_subissues[@]} -eq $max_subissue ]]; then
            break
        fi
    done
    
    printf '%s\n' "${parallel_groups[@]}"
}

# Generate parallel development recommendations
generate_recommendations() {
    local issue_number="$1"
    local parallel_groups=("$@:2")
    local test_specs=("${TEST_SPECS[@]}")
    
    log "Generating parallel development recommendations..."
    
    local recommendations_file=".workflo/parallel-development-$issue_number.md"
    mkdir -p .workflo
    
    cat > "$recommendations_file" <<EOF
# Parallel Development Analysis - Issue #$issue_number

Generated: $(date)

## 🎯 Parallel Development Groups

The following subissues can be developed in parallel by different agents with minimal merge conflicts:

EOF
    
    local group_num=1
    for group in "${parallel_groups[@]}"; do
        echo "### 🔧 Parallel Group $group_num" >> "$recommendations_file"
        echo "" >> "$recommendations_file"
        echo "**Subissues that can be developed simultaneously:**" >> "$recommendations_file"
        echo "" >> "$recommendations_file"
        
        IFS=',' read -ra subissues <<< "$group"
        for subissue in "${subissues[@]}"; do
            # Find test description for this subissue
            local test_desc="Subissue $subissue"
            if [[ $subissue -le ${#test_specs[@]} ]]; then
                IFS=':' read -r test_type desc short_name <<< "${test_specs[$((subissue-1))]}"
                test_desc="$desc"
            fi
            
            echo "- **Subissue $subissue**: $test_desc" >> "$recommendations_file"
            echo "  - Branch: \`test/$issue_number-$subissue-...\`" >> "$recommendations_file"
            echo "  - Agent Command: \`./scripts/start-subissue-work.sh $issue_number $subissue\`" >> "$recommendations_file"
            echo "" >> "$recommendations_file"
        done
        
        if [[ ${#subissues[@]} -gt 1 ]]; then
            echo "✅ **Low Conflict Risk**: These subissues can be developed simultaneously by different agents." >> "$recommendations_file"
        else
            echo "⚠️ **Sequential Development**: This subissue has dependencies that require sequential development." >> "$recommendations_file"
        fi
        
        echo "" >> "$recommendations_file"
        ((group_num++))
    done
    
    cat >> "$recommendations_file" <<EOF

## 🚀 Development Strategy

### Parallel Development Workflow:
1. **Assign agents to groups**: Each parallel group can have multiple agents working simultaneously
2. **Start subissue work**: Each agent runs \`./scripts/start-subissue-work.sh $issue_number <subissue-number>\`
3. **Independent development**: Agents work on their test branches without conflicts
4. **Sequential merging**: Complete subissues one at a time using \`./scripts/complete-subissue.sh\`

### Benefits:
- **Faster Development**: Multiple agents can work simultaneously
- **Reduced Conflicts**: Intelligent grouping minimizes merge conflicts
- **Clear Isolation**: Each agent works on independent components
- **Scalable Workflow**: Can handle complex features with many subissues

## 📊 Conflict Analysis

The conflict analysis considers:
- **Component Dependencies**: Which services/classes are affected
- **File Path Overlap**: Shared files between subissues
- **Functional Coupling**: Related business logic
- **Test Dependencies**: Shared test infrastructure

## 🔧 Agent Commands

### Start Parallel Development:
\`\`\`bash
# Group 1 agents can start simultaneously:
$(for group in "${parallel_groups[@]}"; do
    IFS=',' read -ra subissues <<< "$group"
    if [[ ${#subissues[@]} -gt 1 ]]; then
        for subissue in "${subissues[@]}"; do
            echo "./scripts/start-subissue-work.sh $issue_number $subissue  # Agent $subissue"
        done
        break
    fi
done)
\`\`\`

### Complete in Order:
\`\`\`bash
$(for group in "${parallel_groups[@]}"; do
    IFS=',' read -ra subissues <<< "$group"
    for subissue in "${subissues[@]}"; do
        echo "./scripts/complete-subissue.sh $issue_number $subissue"
    done
done)
\`\`\`

---
🤖 Generated by WorkFlo Parallel Development Analyzer
EOF
    
    success "Recommendations saved to: $recommendations_file"
    echo "$recommendations_file"
}

# Main analysis function
analyze_issue_for_parallel_development() {
    local issue_number="$1"
    
    log "Analyzing issue #$issue_number for parallel development opportunities..."
    
    # Get issue details
    local issue_body
    issue_body=$(gh issue view "$issue_number" --json body --jq '.body' 2>/dev/null || echo "")
    
    if [[ -z "$issue_body" ]]; then
        error "Issue #$issue_number not found or has no body content"
    fi
    
    # Extract test specifications
    local test_specs=()
    while IFS= read -r line; do
        if [[ "$line" =~ ^\s*-\s*\[\s*\]\s*\*\*Test\ ([0-9]+)\*\*:\ (.+)$ ]]; then
            local test_num="${BASH_REMATCH[1]}"
            local test_desc="${BASH_REMATCH[2]}"
            local short_name
            short_name=$(echo "$test_desc" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-15)
            test_specs+=("unit-$test_num:$test_desc:$short_name")
        fi
    done <<< "$issue_body"
    
    if [[ ${#test_specs[@]} -eq 0 ]]; then
        warn "No test specifications found in issue #$issue_number"
        return 0
    fi
    
    info "Found ${#test_specs[@]} test specifications to analyze"
    
    # Store test specs globally for use in other functions
    TEST_SPECS=("${test_specs[@]}")
    
    # Analyze dependencies
    local dependencies
    dependencies=($(analyze_component_dependencies "${test_specs[@]}"))
    
    # Calculate conflict potential
    local conflict_matrix
    conflict_matrix=($(calculate_conflict_potential "${dependencies[@]}"))
    
    # Group for parallel development
    local parallel_groups
    parallel_groups=($(group_parallel_subissues "${conflict_matrix[@]}"))
    
    # Generate recommendations
    local recommendations_file
    recommendations_file=$(generate_recommendations "$issue_number" "${parallel_groups[@]}")
    
    # Display summary
    echo ""
    success "🎉 Parallel Development Analysis Complete!"
    echo ""
    echo "📊 **Analysis Results:**"
    echo "  - Total Subissues: ${#test_specs[@]}"
    echo "  - Parallel Groups: ${#parallel_groups[@]}"
    echo "  - Recommendations: $recommendations_file"
    echo ""
    
    echo "🚀 **Quick Start:**"
    local group_num=1
    for group in "${parallel_groups[@]}"; do
        IFS=',' read -ra subissues <<< "$group"
        if [[ ${#subissues[@]} -gt 1 ]]; then
            echo "  Group $group_num (${#subissues[@]} agents can work simultaneously):"
            for subissue in "${subissues[@]}"; do
                echo "    ./scripts/start-subissue-work.sh $issue_number $subissue"
            done
        else
            echo "  Group $group_num (sequential development required):"
            echo "    ./scripts/start-subissue-work.sh $issue_number ${subissues[0]}"
        fi
        ((group_num++))
    done
    echo ""
}

# Show help
show_help() {
    echo "Parallel Development Analyzer"
    echo ""
    echo "Usage: $0 <issue-number>"
    echo ""
    echo "Analyzes a GitHub issue to determine which subissues can be developed"
    echo "in parallel by different agents without merge conflicts."
    echo ""
    echo "Analysis includes:"
    echo "  - Component dependency mapping"
    echo "  - File path conflict detection" 
    echo "  - Functional coupling analysis"
    echo "  - Parallel development grouping"
    echo ""
    echo "Arguments:"
    echo "  issue-number    GitHub issue number to analyze"
    echo ""
    echo "Examples:"
    echo "  $0 123          # Analyze issue #123 for parallel development"
    echo ""
    echo "Output:"
    echo "  - Generates .workflo/parallel-development-<issue>.md"
    echo "  - Provides agent commands for simultaneous development"
    echo "  - Shows conflict risk assessment"
    echo ""
    echo "Integration:"
    echo "  Use before running create-feature-branches.sh to optimize"
    echo "  for multi-agent parallel development."
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

ISSUE_NUMBER="$1"

# Validate issue number
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

# Check authentication and run analysis
check_auth
analyze_issue_for_parallel_development "$ISSUE_NUMBER"
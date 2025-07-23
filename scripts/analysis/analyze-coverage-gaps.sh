#!/bin/bash

# analyze-coverage-gaps.sh - Automated coverage gap analysis with spike development
# Usage: ./scripts/analyze-coverage-gaps.sh <issue-number> [--auto-create-spikes]

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
    echo -e "${BLUE}[COVERAGE-GAPS]${NC} $1"
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

# Configuration
AUTO_CREATE_SPIKES="false"
COVERAGE_THRESHOLD=95
SPIKE_BRANCH_PREFIX="spike"

# Generate coverage report
generate_coverage_report() {
    local issue_number="$1"
    
    log "Generating comprehensive coverage report..."
    
    # Run tests with coverage collection
    dotnet test --collect:"XPlat Code Coverage" --verbosity quiet --logger "console;verbosity=minimal"
    
    # Find the most recent coverage file
    local coverage_file
    coverage_file=$(find . -name "coverage.cobertura.xml" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- || echo "")
    
    if [[ -z "$coverage_file" ]]; then
        error "No coverage report found. Ensure tests run successfully with coverage collection."
    fi
    
    success "Coverage report generated: $coverage_file"
    echo "$coverage_file"
}

# Analyze coverage gaps from report
analyze_coverage_gaps() {
    local coverage_file="$1"
    local issue_number="$2"
    
    log "Analyzing coverage gaps..."
    
    # Extract uncovered lines using XML parsing
    local gaps_file=".workflo/coverage-gaps-$issue_number.json"
    mkdir -p .workflo
    
    # Generate gap analysis using xmllint or similar tools
    python3 -c "
import xml.etree.ElementTree as ET
import json
import sys

try:
    tree = ET.parse('$coverage_file')
    root = tree.getroot()
    
    gaps = []
    
    # Find packages/classes with low coverage
    for pkg in root.findall('.//package'):
        pkg_name = pkg.get('name', 'unknown')
        
        for cls in pkg.findall('classes/class'):
            cls_name = cls.get('name', 'unknown')
            filename = cls.get('filename', 'unknown')
            
            # Get line coverage
            lines = cls.find('lines')
            if lines is not None:
                total_lines = 0
                covered_lines = 0
                uncovered_ranges = []
                
                for line in lines.findall('line'):
                    line_num = int(line.get('number', 0))
                    hits = int(line.get('hits', 0))
                    total_lines += 1
                    
                    if hits > 0:
                        covered_lines += 1
                    else:
                        uncovered_ranges.append(line_num)
                
                if total_lines > 0:
                    coverage_percent = (covered_lines / total_lines) * 100
                    
                    if coverage_percent < $COVERAGE_THRESHOLD:
                        # Group consecutive uncovered lines into ranges
                        ranges = []
                        if uncovered_ranges:
                            start = uncovered_ranges[0]
                            end = start
                            
                            for line_num in uncovered_ranges[1:]:
                                if line_num == end + 1:
                                    end = line_num
                                else:
                                    ranges.append({'start': start, 'end': end})
                                    start = line_num
                                    end = start
                            ranges.append({'start': start, 'end': end})
                        
                        gaps.append({
                            'package': pkg_name,
                            'class': cls_name,
                            'filename': filename,
                            'coverage_percent': round(coverage_percent, 2),
                            'total_lines': total_lines,
                            'covered_lines': covered_lines,
                            'uncovered_ranges': ranges,
                            'gap_severity': 'high' if coverage_percent < 70 else 'medium' if coverage_percent < 85 else 'low'
                        })
    
    with open('$gaps_file', 'w') as f:
        json.dump({'gaps': gaps, 'analysis_timestamp': '$(date -Iseconds)'}, f, indent=2)
    
    print(f'Found {len(gaps)} classes with coverage below $COVERAGE_THRESHOLD%')
    
except Exception as e:
    print(f'Error analyzing coverage: {e}', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null || {
        # Fallback if Python is not available
        warn "Python not available for detailed analysis. Using basic grep analysis."
        
        # Basic analysis using grep and awk
        local uncovered_count
        uncovered_count=$(grep -o 'hits="0"' "$coverage_file" | wc -l)
        local total_count
        total_count=$(grep -o 'hits="[0-9]*"' "$coverage_file" | wc -l)
        
        if [[ $total_count -gt 0 ]]; then
            local coverage_percent
            coverage_percent=$(awk "BEGIN {printf \"%.2f\", (($total_count - $uncovered_count) / $total_count) * 100}")
            
            cat > "$gaps_file" <<EOF
{
  "gaps": [{
    "package": "unknown",
    "class": "overall",
    "filename": "multiple",
    "coverage_percent": $coverage_percent,
    "total_lines": $total_count,
    "covered_lines": $(($total_count - $uncovered_count)),
    "uncovered_ranges": [],
    "gap_severity": "medium"
  }],
  "analysis_timestamp": "$(date -Iseconds)"
}
EOF
        fi
    }
    
    if [[ -f "$gaps_file" ]]; then
        success "Coverage gap analysis completed: $gaps_file"
        echo "$gaps_file"
    else
        error "Failed to generate coverage gap analysis"
    fi
}

# Categorize gaps by business context
categorize_coverage_gaps() {
    local gaps_file="$1"
    local issue_number="$2"
    
    log "Categorizing coverage gaps by business context..."
    
    if [[ ! -f "$gaps_file" ]]; then
        error "Gaps file not found: $gaps_file"
    fi
    
    # Analyze gaps and categorize them
    local categorized_file=".workflo/coverage-gaps-categorized-$issue_number.json"
    
    python3 -c "
import json
import re

with open('$gaps_file', 'r') as f:
    data = json.load(f)

gaps = data.get('gaps', [])
categorized = {
    'security_critical': [],
    'business_logic': [],
    'error_handling': [],
    'edge_cases': [],
    'integration_points': [],
    'performance_critical': [],
    'user_interface': [],
    'configuration': []
}

# Categorization rules based on file names and class names
for gap in gaps:
    filename = gap.get('filename', '').lower()
    classname = gap.get('class', '').lower()
    
    # Security-related
    if any(keyword in filename or keyword in classname for keyword in 
           ['auth', 'security', 'token', 'password', 'crypto', 'hash', 'jwt', 'oauth']):
        categorized['security_critical'].append(gap)
    
    # Business logic
    elif any(keyword in filename or keyword in classname for keyword in 
             ['service', 'manager', 'processor', 'handler', 'command', 'query']):
        categorized['business_logic'].append(gap)
    
    # Error handling
    elif any(keyword in filename or keyword in classname for keyword in 
             ['exception', 'error', 'validation', 'validator']):
        categorized['error_handling'].append(gap)
    
    # Integration points
    elif any(keyword in filename or keyword in classname for keyword in 
             ['api', 'endpoint', 'controller', 'client', 'proxy']):
        categorized['integration_points'].append(gap)
    
    # User interface
    elif any(keyword in filename or keyword in classname for keyword in 
             ['ui', 'view', 'component', 'page', 'form']):
        categorized['user_interface'].append(gap)
    
    # Configuration
    elif any(keyword in filename or keyword in classname for keyword in 
             ['config', 'setting', 'option', 'parameter']):
        categorized['configuration'].append(gap)
    
    # Performance critical
    elif any(keyword in filename or keyword in classname for keyword in 
             ['cache', 'performance', 'optimization', 'batch']):
        categorized['performance_critical'].append(gap)
    
    # Default to edge cases
    else:
        categorized['edge_cases'].append(gap)

# Calculate priorities based on severity and category
priorities = {}
for category, gaps_list in categorized.items():
    if not gaps_list:
        continue
        
    # Priority scoring: security > business_logic > error_handling > others
    base_priority = {
        'security_critical': 100,
        'business_logic': 80, 
        'error_handling': 70,
        'integration_points': 60,
        'performance_critical': 50,
        'edge_cases': 40,
        'user_interface': 30,
        'configuration': 20
    }.get(category, 10)
    
    category_priority = 0
    for gap in gaps_list:
        severity_multiplier = {'high': 1.5, 'medium': 1.0, 'low': 0.5}.get(gap['gap_severity'], 1.0)
        coverage_penalty = (100 - gap['coverage_percent']) / 100
        category_priority += base_priority * severity_multiplier * coverage_penalty
    
    priorities[category] = round(category_priority, 2)

result = {
    'categorized_gaps': categorized,
    'priorities': priorities,
    'total_gaps': len(gaps),
    'analysis_timestamp': data.get('analysis_timestamp')
}

with open('$categorized_file', 'w') as f:
    json.dump(result, f, indent=2)

print(f'Categorized {len(gaps)} gaps into {len([c for c in categorized.values() if c])} categories')
" 2>/dev/null || warn "Could not categorize gaps - Python required for advanced analysis"
    
    if [[ -f "$categorized_file" ]]; then
        success "Coverage gaps categorized: $categorized_file"
        echo "$categorized_file"
    else
        echo "$gaps_file"  # Return original file if categorization failed
    fi
}

# Create spike branches for coverage gaps
create_coverage_spike_branches() {
    local categorized_file="$1"
    local issue_number="$2"
    
    log "Creating spike branches for coverage gap development..."
    
    if [[ ! -f "$categorized_file" ]]; then
        error "Categorized gaps file not found: $categorized_file"
    fi
    
    # Create main spike branch
    local spike_branch="$SPIKE_BRANCH_PREFIX/$issue_number-coverage-gaps"
    
    # Ensure we're on the feature branch
    local feature_branch
    if [[ -f ".workflo/branch-tracking.json" ]]; then
        feature_branch=$(jq -r --arg issue "$issue_number" '.[$issue].feature_branch // empty' .workflo/branch-tracking.json)
    fi
    
    if [[ -z "$feature_branch" ]]; then
        warn "Feature branch not found in tracking. Using current branch as base."
        feature_branch=$(git branch --show-current)
    fi
    
    log "Creating spike branch from: $feature_branch"
    git checkout "$feature_branch" >/dev/null 2>&1 || warn "Could not checkout feature branch"
    
    # Create spike branch
    git checkout -b "$spike_branch" >/dev/null 2>&1 || warn "Spike branch may already exist"
    git push -u origin "$spike_branch" >/dev/null 2>&1 || warn "Could not push spike branch"
    
    success "Created spike branch: $spike_branch"
    echo "$spike_branch"
}

# Generate GitHub spike issue
create_coverage_gap_issue() {
    local categorized_file="$1"
    local issue_number="$2"
    local spike_branch="$3"
    
    log "Creating GitHub issue for coverage gap analysis..."
    
    # Read gap data
    local gap_summary
    if command -v python3 >/dev/null 2>&1 && [[ -f "$categorized_file" ]]; then
        gap_summary=$(python3 -c "
import json
with open('$categorized_file', 'r') as f:
    data = json.load(f)

total_gaps = data.get('total_gaps', 0)
priorities = data.get('priorities', {})
categorized = data.get('categorized_gaps', {})

print(f'Found {total_gaps} coverage gaps across {len([c for c in categorized.values() if c])} categories')

for category, priority in sorted(priorities.items(), key=lambda x: x[1], reverse=True):
    if categorized.get(category):
        gap_count = len(categorized[category])
        print(f'- {category.replace(\"_\", \" \").title()}: {gap_count} gaps (priority: {priority})')
")
    else
        gap_summary="Coverage analysis completed. Manual review required."
    fi
    
    # Create issue body
    local issue_body
    issue_body=$(cat <<EOF
## 🎯 Coverage Gap Analysis - Issue #$issue_number

**Parent Issue**: #$issue_number  
**Spike Branch**: \`$spike_branch\`  
**Analysis Date**: $(date)

## 📊 Coverage Gap Summary

$gap_summary

## 🔍 Gap Categories & Priorities

This analysis identified coverage gaps that may indicate missing tests or business scenarios not covered by the current test suite.

### 🚨 High Priority Areas
- **Security Critical**: Authentication, authorization, token handling
- **Business Logic**: Core service functionality and workflows  
- **Error Handling**: Exception paths and validation logic

### 📋 Medium Priority Areas
- **Integration Points**: API endpoints and external service interactions
- **Performance Critical**: Caching and optimization code paths
- **Edge Cases**: Boundary conditions and unusual scenarios

### 💡 Lower Priority Areas
- **User Interface**: UI components and presentation logic
- **Configuration**: Settings and parameter handling

## 🔧 Spike Development Plan

### Scope Validation Questions:
- [ ] Are these gaps testing actual business requirements?
- [ ] Do these tests protect against real failure scenarios?  
- [ ] Should these be included in current feature or future enhancement?

### Implementation Approach:
1. **Review Each Gap**: Analyze if coverage gap represents missing business logic
2. **Create Targeted Tests**: Write specific tests for identified scenarios
3. **Validate Business Value**: Ensure tests address real user needs, not just coverage metrics
4. **Document Rationale**: Explain why each test is necessary or why gap is acceptable

## ✅ Definition of Done
- [ ] All significant coverage gaps reviewed for business relevance
- [ ] Additional tests created for genuine business scenarios
- [ ] Coverage gaps documented with rationale (include vs exclude)
- [ ] Spike ready for review and potential merge to feature branch

## 🔗 Integration Process

**If Approved**:
- Merge spike branch to feature branch
- Update main issue with additional test coverage
- Document enhanced test scenarios

**If Rejected**:
- Close spike issue with rationale
- Document why gaps are out of scope
- Clean up spike branch

## 📁 Spike Branch Details

**Branch**: \`$spike_branch\`  
**Base**: Feature branch for issue #$issue_number  
**Analysis Files**: 
- \`.workflo/coverage-gaps-$issue_number.json\`
- \`.workflo/coverage-gaps-categorized-$issue_number.json\`

---
🤖 Auto-generated coverage gap analysis  
Parent: #$issue_number
EOF
)
    
    # Create the spike issue
    local spike_issue_id
    spike_issue_id=$(gh issue create \
        --title "Coverage Gap Analysis: Issue #$issue_number" \
        --body "$issue_body" \
        --label "spike,coverage,analysis,enhancement" \
        --json number \
        --jq '.number' 2>/dev/null || echo "")
    
    if [[ -n "$spike_issue_id" ]]; then
        success "Created coverage gap issue #$spike_issue_id"
        
        # Link to parent issue
        gh issue comment "$issue_number" --body "🔍 Created coverage gap analysis: #$spike_issue_id

This spike analyzes potential test coverage improvements and will be reviewed for business relevance." 2>/dev/null || warn "Could not comment on parent issue"
        
        echo "$spike_issue_id"
    else
        warn "Could not create GitHub issue for coverage gaps"
        echo ""
    fi
}

# Generate development recommendations
generate_spike_recommendations() {
    local categorized_file="$1"
    local issue_number="$2"
    local spike_issue_id="$3"
    
    log "Generating spike development recommendations..."
    
    local recommendations_file=".workflo/coverage-spike-recommendations-$issue_number.md"
    
    cat > "$recommendations_file" <<EOF
# Coverage Gap Spike Recommendations - Issue #$issue_number

**Spike Issue**: #$spike_issue_id  
**Generated**: $(date)

## 🎯 Development Strategy

### Scope Validation First
Before implementing any tests, validate that coverage gaps represent genuine business requirements:

1. **Business Relevance Check**: Does this gap test actual user scenarios?
2. **Risk Assessment**: What happens if this code path fails in production?
3. **Maintenance Cost**: Is the test worth the ongoing maintenance burden?

### Implementation Guidelines

#### ✅ **Implement Tests For:**
- **Security vulnerabilities**: Authentication bypasses, data exposure
- **Critical business logic**: Payment processing, user data handling
- **Error recovery**: How system handles failures gracefully
- **Integration boundaries**: External service failures, database issues

#### ❌ **Skip Tests For:**
- **Trivial getters/setters**: Simple property access
- **Framework code**: Code generated by frameworks
- **Impossible scenarios**: Conditions that cannot occur in practice
- **Pure UI presentation**: Non-interactive display logic

## 🔧 Spike Development Commands

### Start Spike Development:
\`\`\`bash
# Switch to spike branch
git checkout spike/$issue_number-coverage-gaps

# Create test files for highest priority gaps
EOF
    
    if command -v python3 >/dev/null 2>&1 && [[ -f "$categorized_file" ]]; then
        python3 -c "
import json
with open('$categorized_file', 'r') as f:
    data = json.load(f)

categorized = data.get('categorized_gaps', {})
priorities = data.get('priorities', {})

# Show top priority categories
for category, priority in sorted(priorities.items(), key=lambda x: x[1], reverse=True)[:3]:
    if categorized.get(category):
        gaps = categorized[category][:2]  # Top 2 gaps in category
        for gap in gaps:
            filename = gap.get('filename', 'unknown')
            coverage = gap.get('coverage_percent', 0)
            print(f'# Add tests for {filename} (current coverage: {coverage}%)')
            print(f'# Focus on uncovered ranges: {gap.get(\"uncovered_ranges\", [])}')
" >> "$recommendations_file" 2>/dev/null
    fi
    
    cat >> "$recommendations_file" <<'EOF'
```

### Test Implementation Pattern:
```csharp
[Fact]
public void coverage_gap_scenario_description()
{
    // Arrange: Set up scenario that hits uncovered code path
    
    // Act: Execute the uncovered code path
    
    // Assert: Verify expected behavior (not just code execution)
    // Focus on business outcome, not just code coverage
}
```

## 📊 Gap Analysis Results

EOF
    
    if command -v python3 >/dev/null 2>&1 && [[ -f "$categorized_file" ]]; then
        python3 -c "
import json
with open('$categorized_file', 'r') as f:
    data = json.load(f)

categorized = data.get('categorized_gaps', {})
priorities = data.get('priorities', {})

for category, gaps_list in categorized.items():
    if not gaps_list:
        continue
    
    priority = priorities.get(category, 0)
    print(f'### {category.replace(\"_\", \" \").title()} (Priority: {priority})')
    print()
    
    for gap in gaps_list[:3]:  # Show top 3 gaps per category
        filename = gap.get('filename', 'unknown').split('/')[-1]  # Just filename
        coverage = gap.get('coverage_percent', 0)
        severity = gap.get('gap_severity', 'unknown')
        
        print(f'- **{filename}**: {coverage}% coverage ({severity} severity)')
        ranges = gap.get('uncovered_ranges', [])
        if ranges:
            range_strs = [f'{r[\"start\"]}-{r[\"end\"]}' if r[\"start\"] != r[\"end\"] else str(r[\"start\"]) for r in ranges[:3]]
            print(f'  - Uncovered lines: {', '.join(range_strs)}')
        print()
" >> "$recommendations_file" 2>/dev/null
    fi
    
    cat >> "$recommendations_file" <<EOF

## 🔄 Review Process

### Spike Review Checklist:
- [ ] **Business Justification**: Each new test addresses real business scenario
- [ ] **Test Quality**: Tests verify behavior, not just execute code
- [ ] **Maintenance Impact**: Tests are maintainable and valuable long-term
- [ ] **Coverage Improvement**: Meaningful increase in protection against failures

### Decision Matrix:
| Gap Type | Business Impact | Implementation Cost | Recommendation |
|----------|----------------|-------------------|----------------|
| Security Critical | High | Low-Medium | ✅ Implement |
| Business Logic | High | Low | ✅ Implement |
| Error Handling | Medium | Low | ✅ Implement |
| Integration Points | Medium | Medium | 🤔 Consider |
| Edge Cases | Low | Medium | ❌ Skip unless critical |
| UI Presentation | Low | High | ❌ Skip |

## 🎯 Success Criteria

**Spike is successful if:**
- Coverage gaps are either filled with valuable tests OR documented as acceptable
- All new tests protect against real failure scenarios
- Business value justifies implementation and maintenance cost
- Feature is more robust without unnecessary test bloat

---
🤖 Generated by Coverage Gap Analysis System
EOF
    
    success "Generated spike recommendations: $recommendations_file"
    echo "$recommendations_file"
}

# Main coverage gap analysis
analyze_coverage_gaps_main() {
    local issue_number="$1"
    
    log "Starting comprehensive coverage gap analysis for issue #$issue_number..."
    
    # Generate coverage report
    local coverage_file
    coverage_file=$(generate_coverage_report "$issue_number")
    
    # Analyze gaps
    local gaps_file
    gaps_file=$(analyze_coverage_gaps "$coverage_file" "$issue_number")
    
    # Categorize gaps
    local categorized_file
    categorized_file=$(categorize_coverage_gaps "$gaps_file" "$issue_number")
    
    # Create spike branches and issues if requested
    local spike_branch=""
    local spike_issue_id=""
    
    if [[ "$AUTO_CREATE_SPIKES" == "true" ]]; then
        spike_branch=$(create_coverage_spike_branches "$categorized_file" "$issue_number")
        spike_issue_id=$(create_coverage_gap_issue "$categorized_file" "$issue_number" "$spike_branch")
    fi
    
    # Generate recommendations
    local recommendations_file
    recommendations_file=$(generate_spike_recommendations "$categorized_file" "$issue_number" "$spike_issue_id")
    
    # Show summary
    echo ""
    success "🎉 Coverage Gap Analysis Complete!"
    echo ""
    
    if command -v python3 >/dev/null 2>&1 && [[ -f "$categorized_file" ]]; then
        local gap_count
        gap_count=$(python3 -c "
import json
with open('$categorized_file', 'r') as f:
    data = json.load(f)
print(data.get('total_gaps', 0))
" 2>/dev/null || echo "unknown")
        
        echo "📊 **Analysis Results:**"
        echo "  - Coverage gaps found: $gap_count"
        echo "  - Analysis file: $categorized_file"
        echo "  - Recommendations: $recommendations_file"
        
        if [[ -n "$spike_issue_id" ]]; then
            echo "  - Spike issue: #$spike_issue_id"
            echo "  - Spike branch: $spike_branch"
        fi
    fi
    
    echo ""
    echo "🔍 **Next Steps:**"
    if [[ "$AUTO_CREATE_SPIKES" == "true" ]]; then
        echo "  1. Review spike issue #$spike_issue_id for business relevance"
        echo "  2. Develop additional tests in spike branch: $spike_branch"
        echo "  3. Decide whether to merge spike or document gaps as acceptable"
    else
        echo "  1. Review analysis in: $recommendations_file"
        echo "  2. Run with --auto-create-spikes to create spike branch and issue"
        echo "  3. Implement additional tests for business-critical gaps only"
    fi
    echo ""
}

# Show help
show_help() {
    echo "Automated Coverage Gap Analysis with Spike Development"
    echo ""
    echo "Usage: $0 <issue-number> [--auto-create-spikes]"
    echo ""
    echo "Analyzes test coverage gaps and provides intelligent recommendations"
    echo "for additional test development based on business relevance."
    echo ""
    echo "Arguments:"
    echo "  issue-number           GitHub issue number for context"
    echo "  --auto-create-spikes   Automatically create spike branch and GitHub issue"
    echo ""
    echo "Examples:"
    echo "  $0 123                     # Analyze gaps, generate recommendations"
    echo "  $0 123 --auto-create-spikes # Full analysis with spike development setup"
    echo ""
    echo "Coverage Analysis Includes:"
    echo "  - Detailed gap identification by file and line range"
    echo "  - Business context categorization (security, logic, UI, etc.)"
    echo "  - Priority scoring based on severity and category"
    echo "  - Spike development recommendations"
    echo "  - Business relevance validation guidelines"
    echo ""
    echo "Output Files:"
    echo "  - .workflo/coverage-gaps-<issue>.json"
    echo "  - .workflo/coverage-gaps-categorized-<issue>.json"
    echo "  - .workflo/coverage-spike-recommendations-<issue>.md"
    echo ""
    echo "Integration:"
    echo "  Called automatically during COVER phase of TDD workflow"
    echo "  Can be run standalone for detailed coverage analysis"
}

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Main execution
if [[ $# -lt 1 ]]; then
    show_help
    exit 1
fi

# Check dependencies
if ! command -v dotnet &> /dev/null; then
    error "dotnet CLI is required but not installed"
fi

if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is required but not installed"
fi

ISSUE_NUMBER="$1"
shift

# Parse additional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-create-spikes)
            AUTO_CREATE_SPIKES="true"
            shift
            ;;
        --coverage-threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate issue number
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

# Check authentication if auto-creating spikes
if [[ "$AUTO_CREATE_SPIKES" == "true" ]]; then
    check_auth
fi

# Run analysis
analyze_coverage_gaps_main "$ISSUE_NUMBER"
#!/bin/bash
# Test: Legacy system analysis produces migration recommendations
# Business scenario: Developer analyzing legacy system needs clear migration guidance

set -e

# Colors for test output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

test_legacy_analysis_identifies_migration_features() {
    echo "Test: Legacy analysis identifies high-value migration features"
    
    # Given: A legacy system with various scripts and capabilities
    if [[ ! -d "legacy/scripts" ]]; then
        echo -e "${RED}FAIL: Legacy system directory not found${NC}"
        return 1
    fi
    
    # When: Analysis is performed on legacy system
    local analysis_output
    analysis_output=$(find legacy/scripts -name "*.sh" | head -5)
    
    if [[ -z "$analysis_output" ]]; then
        echo -e "${RED}FAIL: No legacy scripts found for analysis${NC}"
        return 1
    fi
    
    # Then: Analysis should identify key migration-worthy features
    # This test should validate that we have a proper analysis function that categorizes features
    # Currently failing because we don't have the analysis function implemented yet
    
    if [[ ! -f "legacy_migration_analysis.json" ]]; then
        echo -e "${RED}FAIL: Migration analysis report not found${NC}"
        return 1
    fi
    
    # Check if analysis contains required migration categories
    required_categories=("high_priority" "medium_priority" "quality_gates" "shared_utilities")
    local missing_categories=0
    
    for category in "${required_categories[@]}"; do
        if ! grep -q "$category" legacy_migration_analysis.json 2>/dev/null; then
            ((missing_categories++))
        fi
    done
    
    if [[ $missing_categories -gt 0 ]]; then
        echo -e "${RED}FAIL: Migration analysis missing $missing_categories required categories${NC}"
        return 1
    fi
    
    echo -e "${GREEN}PASS: Legacy analysis identifies $found_features migration-worthy features${NC}"
    return 0
}

# Run the test
echo "Running legacy system analysis test..."
if test_legacy_analysis_identifies_migration_features; then
    echo -e "${GREEN}✓ Test passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Test failed${NC}"
    exit 1
fi
#!/bin/bash
# Generate test script with embedded issue number for easy lookup
# Usage: ./generate-test-script.sh <issue_number> <test_name> <description>

set -e

ISSUE_NUMBER="$1"
TEST_NAME="$2"
DESCRIPTION="${3:-Test script for issue #$ISSUE_NUMBER}"

if [[ -z "$ISSUE_NUMBER" || -z "$TEST_NAME" ]]; then
    echo "Usage: $0 <issue_number> <test_name> [description]"
    echo "Example: $0 168 test-refactor-phase 'Test REFACTOR phase functionality'"
    exit 1
fi

# Sanitize test name
TEST_FILE="$(echo "$TEST_NAME" | sed 's/[^a-zA-Z0-9-]//g' | tr '[:upper:]' '[:lower:]').sh"

# Get issue title from GitHub
ISSUE_TITLE=""
if command -v gh >/dev/null 2>&1; then
    ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title --jq '.title' 2>/dev/null || echo "")
fi

# Generate test script with embedded issue number
cat > "$TEST_FILE" << EOF
#!/bin/bash
# ${DESCRIPTION}
# Related to issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

set -e

# Load test assertion library
source "\$(dirname "\$0")/lib/test-assertions.sh" 2>/dev/null || {
    echo "⚠️ Test assertion library not found, using basic assertions"
    assert_true() { [ "\$1" = true ] || { echo "❌ FAIL: \$2"; return 1; }; }
    assert_false() { [ "\$1" = false ] || { echo "❌ FAIL: \$2"; return 1; }; }
    assert_equals() { [ "\$1" = "\$2" ] || { echo "❌ FAIL: \$3"; return 1; }; }
    test_summary() { echo "📊 Test completed"; }
}

echo "🧪 Testing: ${DESCRIPTION}..."
echo "📋 Issue: #${ISSUE_NUMBER} - ${ISSUE_TITLE}"
echo ""

# TODO: Add your test implementation here
# Example:
# test_functionality=true
# assert_true "\$test_functionality" "Functionality should work correctly"

echo "✅ Test completed successfully"
test_summary
EOF

chmod +x "$TEST_FILE"

echo "✅ Generated test script: $TEST_FILE"
echo "📋 Issue: #$ISSUE_NUMBER - $ISSUE_TITLE"
echo "🔍 Issue lookup: grep -r '#$ISSUE_NUMBER' test-*.sh"
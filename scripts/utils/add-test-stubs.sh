#!/bin/bash

# add-test-stubs.sh - Generate test stubs for missing tests
# Usage: ./scripts/add-test-stubs.sh <test-file> "<test1>" "<test2>" ...

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if at least 2 arguments provided
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <test-file> \"<test-description-1>\" \"<test-description-2>\" ...${NC}"
    echo -e "${YELLOW}Example: $0 tests/WorkFlo.Cli.Tests/Commands/ServeCommandTests.cs \"server starts successfully on default port\" \"server handles port conflicts gracefully\"${NC}"
    exit 1
fi

TEST_FILE="$1"
shift

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Error: Test file '$TEST_FILE' not found${NC}"
    exit 1
fi

# Detect test framework and language
if [[ "$TEST_FILE" == *.cs ]]; then
    LANGUAGE="csharp"
    FRAMEWORK="xunit"
elif [[ "$TEST_FILE" == *test.ts || "$TEST_FILE" == *test.tsx || "$TEST_FILE" == *spec.ts || "$TEST_FILE" == *spec.tsx ]]; then
    LANGUAGE="typescript"
    FRAMEWORK="jest"
else
    echo -e "${RED}Error: Unsupported file type. Only .cs and .ts/.tsx files are supported${NC}"
    exit 1
fi

echo -e "${GREEN}Generating test stubs for $TEST_FILE${NC}"
echo -e "${YELLOW}Language: $LANGUAGE, Framework: $FRAMEWORK${NC}"

# Function to convert test description to method name
convert_to_method_name() {
    local description="$1"
    # Replace spaces with underscores and remove special characters
    echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9 ]//g' | tr ' ' '_'
}

# Function to generate C# test stub
generate_csharp_test() {
    local description="$1"
    local method_name=$(convert_to_method_name "$description")
    
    cat <<EOF

    [Fact]
    public void ${method_name}()
    {
        // To be implemented
        true.Should().BeFalse("To be implemented");
    }
EOF
}

# Function to generate TypeScript test stub
generate_typescript_test() {
    local description="$1"
    
    cat <<EOF

  it('${description}', () => {
    // To be implemented
    expect(true).toBe(false); // To be implemented
  });
EOF
}

# Create temporary file for new content
TEMP_FILE=$(mktemp)

# Find the last closing brace or appropriate insertion point
if [ "$LANGUAGE" == "csharp" ]; then
    # For C#, find the last closing brace of the test class
    # Get all content except the last closing brace
    head -n -1 "$TEST_FILE" > "$TEMP_FILE"
    
    # Add new test stubs
    for description in "$@"; do
        echo -e "${GREEN}Adding test stub: $description${NC}"
        generate_csharp_test "$description" >> "$TEMP_FILE"
    done
    
    # Add the closing brace back
    echo "}" >> "$TEMP_FILE"
    
elif [ "$LANGUAGE" == "typescript" ]; then
    # For TypeScript, find the last test or describe block
    # This is more complex, so we'll append before the last closing })
    
    # Count the number of lines
    total_lines=$(wc -l < "$TEST_FILE")
    
    # Find the line number of the last });
    last_closing_line=$(grep -n "^});" "$TEST_FILE" | tail -1 | cut -d: -f1)
    
    if [ -z "$last_closing_line" ]; then
        # If no }); found, look for });$ (end of line)
        last_closing_line=$(grep -n "});$" "$TEST_FILE" | tail -1 | cut -d: -f1)
    fi
    
    if [ -z "$last_closing_line" ]; then
        echo -e "${RED}Error: Could not find appropriate insertion point in TypeScript file${NC}"
        rm "$TEMP_FILE"
        exit 1
    fi
    
    # Copy everything up to (but not including) the last closing
    head -n $((last_closing_line - 1)) "$TEST_FILE" > "$TEMP_FILE"
    
    # Add new test stubs
    for description in "$@"; do
        echo -e "${GREEN}Adding test stub: $description${NC}"
        generate_typescript_test "$description" >> "$TEMP_FILE"
    done
    
    # Add everything from the last closing to the end
    tail -n $((total_lines - last_closing_line + 1)) "$TEST_FILE" >> "$TEMP_FILE"
fi

# Replace the original file with the new content
mv "$TEMP_FILE" "$TEST_FILE"

echo -e "${GREEN}Successfully added ${#@} test stub(s) to $TEST_FILE${NC}"
echo -e "${YELLOW}Remember to implement these tests to make them pass!${NC}"
#!/bin/bash
# WorkFlo Windows Release Builder (Linux/macOS version)
# This script builds Windows release binaries from Linux/macOS using cross-compilation

set -e

# Default values
OUTPUT_PATH="build/windows"
SKIP_TESTS=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-path)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            echo "WorkFlo Windows Release Builder"
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --output-path PATH    Output directory (default: build/windows)"
            echo "  --skip-tests          Skip running tests"
            echo "  --clean               Clean previous build"
            echo "  --help                Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "WorkFlo Windows Release Builder"
echo "=============================="

# Check prerequisites
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK not found. Please install .NET 9 SDK."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: Node.js/npm not found. Please install Node.js 18+."
    exit 1
fi

# Clean previous build if requested
if [ "$CLEAN" = true ] && [ -d "$OUTPUT_PATH" ]; then
    echo "Cleaning previous build..."
    rm -rf "$OUTPUT_PATH"
fi

# Create output directory
echo "Creating output directory: $OUTPUT_PATH"
mkdir -p "$OUTPUT_PATH"

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
    echo "Running tests..."
    if ! dotnet test --configuration Release --verbosity minimal; then
        echo "Tests failed. Use --skip-tests to build anyway."
        exit 1
    fi
    echo "All tests passed!"
fi

# Build CLI
echo "Building WorkFlo CLI for Windows x64..."
dotnet publish src/WorkFlo.Cli/WorkFlo.Cli.csproj \
    -c Release \
    -r win-x64 \
    --self-contained \
    -o "$OUTPUT_PATH/cli" \
    --verbosity minimal

# Build API
echo "Building WorkFlo API for Windows x64..."
dotnet publish src/WorkFlo.Api/WorkFlo.Api.csproj \
    -c Release \
    -r win-x64 \
    --self-contained \
    -o "$OUTPUT_PATH/api" \
    --verbosity minimal

# Build Frontend
echo "Building WorkFlo Web frontend..."
cd src/web
npm install --silent
npm run build
# Copy frontend build
cp -r .next "../../$OUTPUT_PATH/web"
cd ../..

# Copy installation scripts and documentation
echo "Copying installation scripts and documentation..."
cp scripts/windows/install.ps1 "$OUTPUT_PATH/"
cp scripts/windows/install.bat "$OUTPUT_PATH/"
cp scripts/windows/README.md "$OUTPUT_PATH/"
cp scripts/windows/TROUBLESHOOTING.md "$OUTPUT_PATH/"

# Create version info file
echo "Creating version info..."
cat > "$OUTPUT_PATH/VERSION.json" << EOF
{
  "Version": "0.1.0",
  "BuildDate": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "Platform": "Windows x64",
  "DotNetVersion": "$(dotnet --version)",
  "Components": {
    "CLI": "WorkFlo.Cli.exe",
    "API": "WorkFlo.Api.exe",
    "Web": "Next.js production build"
  }
}
EOF

# Calculate sizes
CLI_SIZE=$(du -sm "$OUTPUT_PATH/cli" | cut -f1)
API_SIZE=$(du -sm "$OUTPUT_PATH/api" | cut -f1)
WEB_SIZE=$(du -sm "$OUTPUT_PATH/web" | cut -f1)
TOTAL_SIZE=$((CLI_SIZE + API_SIZE + WEB_SIZE))

echo ""
echo "Build completed successfully!"
echo "============================"
echo "Output Directory: $OUTPUT_PATH"
echo "CLI Size: ${CLI_SIZE}MB"
echo "API Size: ${API_SIZE}MB"
echo "Web Size: ${WEB_SIZE}MB"
echo "Total Size: ${TOTAL_SIZE}MB"
echo ""
echo "Installation files:"
echo "- install.ps1 (PowerShell installer)"
echo "- install.bat (Batch installer)"
echo "- README.md (Installation guide)"
echo "- TROUBLESHOOTING.md (Support guide)"
echo ""
echo "To test the build:"
echo "1. Run: $OUTPUT_PATH/cli/WorkFlo.Cli.exe --version (on Windows)"
echo "2. Run: $OUTPUT_PATH/api/WorkFlo.Api.exe (starts API server on Windows)"
echo ""
echo "To create installer package:"
echo "./scripts/windows/create-installer.sh --source-path $OUTPUT_PATH"
#!/bin/bash
# Fix VS Code Extension TypeScript compilation issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/../vscode-extension"

echo "🔧 Fixing WorkFlo VS Code Extension..."

cd "$EXTENSION_DIR"

# Backup current node_modules
if [ -d "node_modules" ]; then
    echo "📦 Backing up current node_modules..."
    mv node_modules node_modules.backup
fi

# Clean install dependencies
echo "📥 Clean installing dependencies..."
npm install

# Try to compile
echo "🔨 Compiling TypeScript..."
if npx tsc; then
    echo "✅ Compilation successful!"
    # Remove backup
    rm -rf node_modules.backup
else
    echo "❌ Compilation failed. Trying alternative fix..."
    
    # Install specific versions that are known to work together
    npm install --save-dev @types/node@16.x @types/vscode@1.74.0 typescript@4.9.5
    npm install --save @types/marked@5.0.2 marked@12.0.0
    
    # Try compiling again
    if npx tsc; then
        echo "✅ Compilation successful with alternative versions!"
        rm -rf node_modules.backup
    else
        echo "❌ Still failing. Restoring backup..."
        rm -rf node_modules
        mv node_modules.backup node_modules
        exit 1
    fi
fi

echo "🎉 Extension fix complete!"
echo ""
echo "To test the extension:"
echo "1. Open VS Code in the extension directory: code $EXTENSION_DIR"
echo "2. Press F5 to launch Extension Development Host"
echo "3. Check the Debug Console for any errors"
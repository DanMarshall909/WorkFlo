#!/bin/bash

# Anchor Development Progress Tracker Startup Script
# Automatically opens the progress tracker when starting Claude sessions
# Handles encrypted API key setup and management

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/dan/code/Anchor"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
PROGRESS_HTML="$PROJECT_DIR/progress.html"
PROGRESS_MD="$PROJECT_DIR/PROGRESS.md"
KEY_MANAGER="$SCRIPTS_DIR/key-manager.js"
GH_API_SERVER="$PROJECT_DIR/gh-api-server.js"

echo -e "${BLUE}🚀 Starting Anchor Development Environment...${NC}"

# Check if we're in the right directory
if [ ! -f "$PROGRESS_HTML" ]; then
    echo -e "${YELLOW}⚠️  Progress tracker not found. Make sure you're in the Anchor project directory.${NC}"
    exit 1
fi

# Step 1: Check and setup encrypted API keys
echo -e "${BLUE}🔐 Checking encrypted API keys...${NC}"

if [ ! -f "$KEY_MANAGER" ]; then
    echo -e "${RED}❌ Key manager not found at $KEY_MANAGER${NC}"
    exit 1
fi

# Check if encrypted keys exist
if [ ! -f "$SCRIPTS_DIR/.encrypted-keys" ]; then
    echo -e "${YELLOW}🔑 No encrypted keys found. Setting up API keys...${NC}"
    node "$KEY_MANAGER" setup
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Key setup failed. Cannot continue without API keys.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Encrypted keys found${NC}"
fi

# Step 2: Load and export API keys as environment variables
echo -e "${BLUE}🌍 Loading API keys into environment...${NC}"

# Create a temporary script to load keys and start services
TEMP_SCRIPT="$PROJECT_DIR/.temp-key-loader.js"
cat > "$TEMP_SCRIPT" << EOF
const SecureKeyManager = require('$SCRIPTS_DIR/key-manager.js');

async function loadKeysAndStart() {
    const keyManager = new SecureKeyManager();
    
    try {
        console.log('🔓 Loading encrypted keys...');
        const keys = await keyManager.loadExistingKeys();
        
        if (!keys) {
            console.log('❌ Could not load keys');
            process.exit(1);
        }
        
        // Export keys as environment variables
        Object.entries(keys).forEach(([key, value]) => {
            process.env[key] = value;
        });
        
        console.log('✅ API keys loaded successfully');
        
        // Start the GitHub CLI API server if needed
        if (keys.CLAUDE_API_KEY) {
            console.log('🔧 Starting GitHub CLI API server...');
            const { spawn } = require('child_process');
            
            const ghServer = spawn('node', ['$GH_API_SERVER'], {
                stdio: 'pipe',
                env: { ...process.env, ...keys },
                detached: true
            });
            
            ghServer.unref();
            
            // Save PID for cleanup
            require('fs').writeFileSync('.gh-api-server.pid', ghServer.pid.toString());
            
            console.log(\`✅ GitHub CLI API server started (PID: \${ghServer.pid})\`);
        }
        
    } catch (error) {
        console.error('❌ Error loading keys:', error.message);
        process.exit(1);
    }
}

loadKeysAndStart();
EOF

# Run the key loading script
cd "$PROJECT_DIR"
node "$TEMP_SCRIPT"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to load API keys${NC}"
    rm -f "$TEMP_SCRIPT"
    exit 1
fi

# Clean up temporary script
rm -f "$TEMP_SCRIPT"

# Step 3: Update the last updated timestamp in PROGRESS.md
if [ -f "$PROGRESS_MD" ]; then
    CURRENT_TIME=$(date -u '+%Y-%m-%d %H:%M UTC')
    sed -i "s/\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: $CURRENT_TIME/" "$PROGRESS_MD"
    echo -e "${GREEN}📝 Updated PROGRESS.md timestamp${NC}"
fi

# Step 4: Start the progress tracker HTTP server
echo -e "${BLUE}🌐 Starting progress tracker HTTP server on port 3001...${NC}"

# Kill any existing servers
pkill -f "python3 -m http.server 3001" 2>/dev/null || true
pkill -f "node.*gh-api-server" 2>/dev/null || true

# Start new HTTP server in background
nohup python3 -m http.server 3001 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Step 5: Open the progress tracker in the default browser
PROGRESS_URL="http://localhost:3001/progress.html"
echo -e "${GREEN}🌟 Opening progress tracker at: $PROGRESS_URL${NC}"

# Try multiple ways to open the browser (cross-platform)
if command -v xdg-open > /dev/null; then
    xdg-open "$PROGRESS_URL" 2>/dev/null &
elif command -v open > /dev/null; then
    open "$PROGRESS_URL" 2>/dev/null &
elif command -v start > /dev/null; then
    start "$PROGRESS_URL" 2>/dev/null &
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser. Please manually open: $PROGRESS_URL${NC}"
fi

# Step 6: Start automatic progress updates
echo -e "${BLUE}🔄 Starting automatic progress updates...${NC}"
"$SCRIPTS_DIR/start-auto-progress.sh"

echo ""
echo -e "${GREEN}✅ Anchor Development Environment started successfully!${NC}"
echo -e "${BLUE}📊 Progress tracker: $PROGRESS_URL${NC}"
echo -e "${BLUE}🔧 GitHub CLI API: http://localhost:3002/health${NC}"
echo -e "${YELLOW}💡 The tracker will auto-refresh every 5 seconds${NC}"
echo -e "${YELLOW}🔄 Progress auto-updates every 2 minutes${NC}"
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo -e "   pkill -f 'python3 -m http.server 3001'"
echo -e "   pkill -f 'node.*gh-api-server'"
echo -e "   $SCRIPTS_DIR/stop-auto-progress.sh"

# Save the server PID for easy cleanup
echo "$SERVER_PID" > "$PROJECT_DIR/.progress-server.pid"
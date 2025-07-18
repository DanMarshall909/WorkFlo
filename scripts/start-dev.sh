#!/bin/bash

# Anchor Development Server Startup Script
# This script starts both the API server and web application in development mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to find next available port
find_available_port() {
    local base_port=$1
    local port=$base_port
    
    while check_port $port; do
        port=$((port + 1))
    done
    
    echo $port
}

# Function to cleanup background processes
cleanup() {
    print_status "Shutting down services..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        print_status "API server stopped"
    fi
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
        print_status "Web server stopped"
    fi
    
    # Stop Seq container if it was started by this script
    if command -v docker >/dev/null 2>&1; then
        if docker ps | grep -q "anchor-seq"; then
            print_status "Stopping Seq logging container..."
            docker stop anchor-seq >/dev/null 2>&1
        fi
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Starting Anchor Development Environment..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Start Seq logging container if Docker is available
if command -v docker >/dev/null 2>&1; then
    print_status "Starting Seq logging container..."
    
    # Check if Seq container is already running
    if ! docker ps | grep -q "anchor-seq"; then
        docker run -d \
            --name anchor-seq \
            --rm \
            -e ACCEPT_EULA=Y \
            -e SEQ_FIRSTRUN_ADMINPASSWORD=admin123! \
            -p 5341:5341 \
            -p 8080:80 \
            datalust/seq:latest >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Seq logging container started"
            print_status "Seq web interface: http://localhost:8080 (admin/admin123!)"
        else
            print_warning "Failed to start Seq container, continuing without centralized logging"
        fi
    else
        print_status "Seq container already running"
    fi
else
    print_warning "Docker not available, skipping Seq logging container"
fi

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/Anchor.sln" ]; then
    print_error "Could not find Anchor.sln. Make sure you're running this script from the project root or scripts directory."
    exit 1
fi

# Find available ports
API_PORT=$(find_available_port 5016)
WEB_PORT=$(find_available_port 3002)

if [ $API_PORT -ne 5016 ]; then
    print_warning "Port 5016 is in use, using port $API_PORT for API"
fi

if [ $WEB_PORT -ne 3002 ]; then
    print_warning "Port 3002 is in use, using port $WEB_PORT for web app"
fi

# Start API server
print_status "Starting API server on port $API_PORT..."
cd "$PROJECT_ROOT/src/Anchor.Api"

if [ ! -f "Anchor.Api.csproj" ]; then
    print_error "Could not find Anchor.Api.csproj in src/Anchor.Api/"
    exit 1
fi

dotnet run --urls "http://localhost:$API_PORT" > /tmp/anchor-api.log 2>&1 &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Check if API started successfully
if ! kill -0 $API_PID 2>/dev/null; then
    print_error "Failed to start API server. Check /tmp/anchor-api.log for details."
    exit 1
fi

print_success "API server started on http://localhost:$API_PORT"
print_status "Swagger UI available at http://localhost:$API_PORT/swagger"

# Start web application
print_status "Starting web application on port $WEB_PORT..."
cd "$PROJECT_ROOT/src/web"

if [ ! -f "package.json" ]; then
    print_error "Could not find package.json in src/web/"
    cleanup
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing web dependencies..."
    npm install
fi

# Set the port for Next.js
export PORT=$WEB_PORT

npm run dev > /tmp/anchor-web.log 2>&1 &
WEB_PID=$!

# Wait a moment for web app to start
sleep 5

# Check if web app started successfully
if ! kill -0 $WEB_PID 2>/dev/null; then
    print_error "Failed to start web application. Check /tmp/anchor-web.log for details."
    cleanup
    exit 1
fi

print_success "Web application started on http://localhost:$WEB_PORT"

# Display summary
echo ""
echo "======================================"
echo "🚀 Anchor Development Environment Ready"
echo "======================================"
echo ""
echo "📱 Web Application: http://localhost:$WEB_PORT"
echo "🔧 API Server:      http://localhost:$API_PORT"
echo "📚 Swagger UI:      http://localhost:$API_PORT/swagger"
if command -v docker >/dev/null 2>&1 && docker ps | grep -q "anchor-seq"; then
    echo "📊 Seq Logging:     http://localhost:8080 (admin/admin123!)"
fi
echo ""
echo "📋 Logs:"
echo "   API:  tail -f /tmp/anchor-api.log"
echo "   Web:  tail -f /tmp/anchor-web.log"
if command -v docker >/dev/null 2>&1 && docker ps | grep -q "anchor-seq"; then
    echo "   Seq:  http://localhost:8080"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo "======================================"

# Wait for user interrupt
while true; do
    sleep 1
done
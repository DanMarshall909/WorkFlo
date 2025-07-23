#!/bin/bash

# Start WorkFlo Web App for Windows Access
# This script helps Windows users access the app from WSL

echo "🚀 Starting WorkFlo Web App for Windows access..."
echo ""

# Get WSL IP address
WSL_IP=$(hostname -I | awk '{print $1}')

echo "📱 Access the app from Windows using any of these URLs:"
echo "   • http://localhost:3000/tasks (preferred)"
echo "   • http://127.0.0.1:3000/tasks"
echo "   • http://$WSL_IP:3000/tasks"
echo ""
echo "🎨 The app includes these earth tone themes:"
echo "   • Earth (terracotta & sage)"
echo "   • Forest (pine green & earth brown)"
echo "   • Desert (sunset orange & cactus green)"
echo "   • Stone (slate gray & warm stone)"
echo ""
echo "💡 Theme selector is available on the tasks page"
echo "🔄 Starting server..."
echo ""

# Start the development server
npm run dev:windows
#!/usr/bin/env bash
# ========================================================
# cPanel 1-Click Live Server Setup (Linux / Ubuntu / Debian)
# ========================================================

set -e

echo "========================================================"
echo "🚀 Initializing cPanel Setup on Live Server..."
echo "========================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Run setup wizard
node setup.js "$@"


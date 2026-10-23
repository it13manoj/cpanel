#!/usr/bin/env bash
# ========================================================
# Parakshtech cPanel 1-Click Live Server Setup (Linux / Ubuntu / Debian)
# ========================================================

set -e

echo "========================================================"
echo "🚀 Initializing Parakshtech cPanel Setup on Live Server..."
echo "========================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# Always install npm dependencies first if missing
if [ ! -d "node_modules" ] || [ ! -d "node_modules/mysql2" ]; then
    echo "📦 Installing project dependencies (npm install)..."
    npm install --no-audit
fi

# Run setup wizard
node setup.js "$@"

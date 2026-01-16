#!/bin/bash
# =====================================================
# Web Notes - Development Server
# Run from anywhere: webnotes-dev
# Hot reload enabled - changes appear instantly
# =====================================================

DEV_DIR="$HOME/Desktop/Web Notes"

echo "🔧 Starting Web Notes Development Server..."
echo ""
echo "📍 URL: http://100.121.166.123:8889/"
echo "📍 Local: http://localhost:8889/"
echo ""
echo "🔄 Hot reload enabled - changes appear instantly!"
echo "   Press Ctrl+C to stop"
echo ""

cd "$DEV_DIR"

# Ensure venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install fastapi uvicorn[standard] --quiet
fi

# Run with hot reload
./venv/bin/python -m uvicorn backend.app:app --host 0.0.0.0 --port 8889 --reload --reload-dir backend --reload-dir scripts --reload-dir styles

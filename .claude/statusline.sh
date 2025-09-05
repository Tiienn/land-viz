#!/bin/bash

# Land Visualizer Status Line
# Shows current project status, dev server, and key metrics

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="🏞️ Land Visualizer"
VERSION=$(node -p "require('./app/package.json').version" 2>/dev/null || echo "unknown")

# Check if dev server is running
DEV_SERVER_STATUS="❌ Stopped"
DEV_SERVER_URL=""
if netstat -an 2>/dev/null | grep -q ":5173.*LISTEN" || netstat -an 2>/dev/null | grep -q ":5174.*LISTEN"; then
    if netstat -an 2>/dev/null | grep -q ":5173.*LISTEN"; then
        DEV_SERVER_STATUS="✅ Running"
        DEV_SERVER_URL="http://localhost:5173"
    elif netstat -an 2>/dev/null | grep -q ":5174.*LISTEN"; then
        DEV_SERVER_STATUS="✅ Running"
        DEV_SERVER_URL="http://localhost:5174"
    fi
fi

# Git status
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_STATUS=""
if git status --porcelain 2>/dev/null | grep -q .; then
    MODIFIED_FILES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    GIT_STATUS="📝 ${MODIFIED_FILES} modified"
else
    GIT_STATUS="✅ Clean"
fi

# Check if tests exist and can run
TEST_STATUS="❓ Unknown"
if [ -f "app/package.json" ]; then
    if grep -q "\"test\":" app/package.json; then
        TEST_STATUS="📋 Available"
    else
        TEST_STATUS="❌ No tests"
    fi
fi

# Node.js and npm versions
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
NPM_VERSION=$(npm --version 2>/dev/null || echo "not found")

# Project statistics
TOTAL_FILES=$(find app/src -name "*.tsx" -o -name "*.ts" | wc -l | tr -d ' ')
COMPONENT_FILES=$(find app/src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
SERVICES_FILES=$(find app/src/services -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')

# Current implementation phase
CURRENT_PHASE="Phase 1: 3D Visualization MVP"
PROGRESS="🎯 ~75% Complete"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    $PROJECT_NAME v$VERSION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Development Status
echo -e "${PURPLE}🚀 Development Status${NC}"
echo -e "   Phase: ${CYAN}$CURRENT_PHASE${NC}"
echo -e "   Progress: ${GREEN}$PROGRESS${NC}"
echo -e "   Dev Server: ${GREEN}$DEV_SERVER_STATUS${NC} ${DEV_SERVER_URL}"
echo ""

# Git Information  
echo -e "${PURPLE}📦 Repository Status${NC}"
echo -e "   Branch: ${CYAN}$GIT_BRANCH${NC}"
echo -e "   Working Dir: ${GREEN}$GIT_STATUS${NC}"
echo ""

# Project Structure
echo -e "${PURPLE}📁 Project Structure${NC}"
echo -e "   Total Files: ${CYAN}$TOTAL_FILES${NC} TS/TSX files"
echo -e "   Components: ${CYAN}$COMPONENT_FILES${NC} React components"
echo -e "   Services: ${CYAN}$SERVICES_FILES${NC} service modules"
echo ""

# Environment
echo -e "${PURPLE}⚙️  Environment${NC}"
echo -e "   Node.js: ${CYAN}$NODE_VERSION${NC}"
echo -e "   npm: ${CYAN}$NPM_VERSION${NC}"
echo -e "   Tests: ${CYAN}$TEST_STATUS${NC}"
echo ""

# Quick Actions
echo -e "${PURPLE}⚡ Quick Actions${NC}"
echo -e "   ${YELLOW}cd app && npm run dev${NC}     - Start development server"
echo -e "   ${YELLOW}cd app && npm test${NC}        - Run test suite"
echo -e "   ${YELLOW}cd app && npm run build${NC}   - Build for production"
echo -e "   ${YELLOW}git status${NC}                - Check git status"
echo ""

# Current Focus Areas
echo -e "${PURPLE}🎯 Current Focus Areas${NC}"
echo -e "   • Export functionality (Excel, DXF, PDF, GeoJSON)"
echo -e "   • Layer management system"
echo -e "   • Mobile responsiveness optimization"
echo -e "   • Chili3D integration preparation"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
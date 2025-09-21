#!/bin/bash

# Get directory name
DIR_NAME=$(basename "$PWD")

# Get git branch
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
else
    BRANCH="no git"
fi

# Get current time
TIMESTAMP=$(date +"%H:%M:%S")

# Get model from input (passed via stdin)
MODEL_NAME="Claude"
if command -v jq > /dev/null 2>&1; then
    MODEL_NAME=$(echo "$1" | jq -r '.model // "Claude"' 2>/dev/null || echo "Claude")
fi

# Output statusline with dimmed colors
echo -e "\033[2m${DIR_NAME} | ${BRANCH} | ${MODEL_NAME} | ${TIMESTAMP}\033[0m"
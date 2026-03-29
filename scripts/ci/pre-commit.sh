#!/bin/bash

# Pre-commit Hook Script
# Runs before every git commit to ensure code quality
# Mirrors GitHub Actions CI/CD pipeline checks

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start timing
START_TIME=$(date +%s)

echo -e "${BLUE}🔍 PRE-COMMIT CHECKS (CI/CD Pipeline Mirror)${NC}"
echo "=============================================="

# Function to print colored status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Track overall status
OVERALL_STATUS=0

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}ℹ️  No TypeScript/JavaScript files to check${NC}"
    echo ""
    echo -e "${GREEN}✅ Pre-commit checks passed (no files to check)${NC}"
    exit 0
fi

echo -e "\n${BLUE}📁 Checking staged files:${NC}"
echo "$STAGED_FILES" | sed 's/^/  • /'

# ==========================================
# JOB 1: Lint and Type Check (mirrors ci-cd.yml job)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 JOB 1: LINT & TYPE CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1.1. Run ESLint
echo ""
echo -e "${BLUE}🧹 Running ESLint...${NC}"
if npm run lint; then
    print_status 0 "ESLint passed"
else
    print_status 1 "ESLint failed"
    OVERALL_STATUS=1
fi

# 1.2. Run TypeScript type checking
echo ""
echo -e "${BLUE}🔧 Running TypeScript type check...${NC}"
if NODE_OPTIONS='--max-old-space-size=4096' npx tsc --noEmit; then
    print_status 0 "TypeScript types are valid"
else
    print_status 1 "TypeScript type errors found"
    OVERALL_STATUS=1
fi

# ==========================================
# JOB 2: Unit & Integration Tests (mirrors ci-cd.yml job)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 JOB 2: UNIT & INTEGRATION TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 2.1. Run tests (CI mode - coverage temporarily disabled)
echo ""
echo -e "${BLUE}🧪 Running tests...${NC}"
if npm run test:ci; then
    print_status 0 "Tests passed"
    
    # 2.2. Check coverage thresholds (TEMPORARILY DISABLED)
    if [ -f "coverage/coverage-summary.json" ]; then
        echo ""
        echo -e "${BLUE}📊 Checking coverage thresholds (advisory only)...${NC}"
        
        STATEMENTS=$(jq '.total.statements.pct' coverage/coverage-summary.json)
        BRANCHES=$(jq '.total.branches.pct' coverage/coverage-summary.json)
        FUNCTIONS=$(jq '.total.functions.pct' coverage/coverage-summary.json)
        LINES=$(jq '.total.lines.pct' coverage/coverage-summary.json)
        
        echo "Coverage: Statements=${STATEMENTS}%, Branches=${BRANCHES}%, Functions=${FUNCTIONS}%, Lines=${LINES}%"
        
        # Check if any metric is below 70%
        BELOW_THRESHOLD=0
        if (( $(echo "$STATEMENTS < 70" | bc -l) )); then BELOW_THRESHOLD=1; fi
        if (( $(echo "$BRANCHES < 70" | bc -l) )); then BELOW_THRESHOLD=1; fi
        if (( $(echo "$FUNCTIONS < 70" | bc -l) )); then BELOW_THRESHOLD=1; fi
        if (( $(echo "$LINES < 70" | bc -l) )); then BELOW_THRESHOLD=1; fi
        
        if [ $BELOW_THRESHOLD -eq 1 ]; then
            echo -e "${YELLOW}⚠️  Coverage below 70% threshold (advisory only - not blocking)${NC}"
            # OVERALL_STATUS=1  # Temporarily disabled
        else
            print_status 0 "Coverage meets thresholds"
        fi
    else
        echo -e "${YELLOW}⚠️  Coverage summary not found (non-blocking)${NC}"
        # OVERALL_STATUS=1  # Temporarily disabled
    fi
else
    print_status 1 "Tests failed"
    OVERALL_STATUS=1
fi

# ==========================================
# JOB 3: Build Application (mirrors ci-cd.yml job)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏗️  JOB 3: BUILD APPLICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${BLUE}🏗️  Building Next.js application...${NC}"
if npm run build; then
    print_status 0 "Build successful"
    
    # Check build output
    if [ ! -d ".next" ]; then
        print_status 1 "Build failed - .next directory not found"
        OVERALL_STATUS=1
    else
        print_status 0 "Build output verified"
    fi
else
    print_status 1 "Build failed"
    OVERALL_STATUS=1
fi

# ==========================================
# JOB 4: Database Quality Check (mirrors ci-cd.yml job)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🗄️  JOB 4: DATABASE QUALITY CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${BLUE}🗄️  Running database quality checks...${NC}"

# Check if Supabase is running
if supabase status > /dev/null 2>&1; then
    # Run database quality check script
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/../database/check-db-quality.sh" ]; then
        if "$SCRIPT_DIR/../database/check-db-quality.sh"; then
            print_status 0 "Database quality check passed"
        else
            print_status 1 "Database quality issues found"
            OVERALL_STATUS=1
        fi
    else
        echo -e "${YELLOW}⚠️  Database quality script not found (skipping)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase not running (skipping database checks)${NC}"
    echo "   To run database checks: npm run setup:db"
fi

# ==========================================
# JOB 5: Security Audit (mirrors ci-cd.yml job)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 JOB 5: SECURITY AUDIT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 5.1. Check for hardcoded secrets
echo ""
echo -e "${BLUE}🔒 Checking for hardcoded secrets...${NC}"
VIOLATIONS=0

# Check for hardcoded secrets in staged files
if echo "$STAGED_FILES" | xargs grep -E "(password|secret|api_key|private_key)\s*=\s*['\"][^'\"]{20,}['\"]" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Found potential hardcoded secrets (review manually)${NC}"
    # Don't fail, just warn
else
    print_status 0 "No hardcoded secrets found"
fi

# 5.2. Check for forbidden patterns
echo ""
echo -e "${BLUE}🚫 Checking for forbidden patterns...${NC}"
FORBIDDEN_PATTERNS=(
    "console\.log"
    "debugger"
    "\.only\("
    "\.skip\("
)

# Filter out scripts and test files from pattern checks
APP_FILES=$(echo "$STAGED_FILES" | grep -v "^scripts/" | grep -v "\.test\." | grep -v "__tests__/" || true)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if [ -n "$APP_FILES" ]; then
        # For console.log, only match uncommented ones (not starting with //)
        if [ "$pattern" = "console\.log" ]; then
            MATCHES=$(echo "$APP_FILES" | xargs grep -n "$pattern" 2>/dev/null | grep -v "^\s*//" | grep -v "//.*console\.log" || true)
            if [ -n "$MATCHES" ]; then
                echo -e "${RED}❌ Found forbidden pattern: $pattern${NC}"
                echo "$MATCHES" | head -5
                VIOLATIONS=$((VIOLATIONS + 1))
            fi
        else
            # For other patterns, check normally
            if echo "$APP_FILES" | xargs grep -l "$pattern" 2>/dev/null; then
                echo -e "${RED}❌ Found forbidden pattern: $pattern${NC}"
                echo "$APP_FILES" | xargs grep -n "$pattern" 2>/dev/null | head -5
                VIOLATIONS=$((VIOLATIONS + 1))
            fi
        fi
    fi
done

if [ $VIOLATIONS -gt 0 ]; then
    print_status 1 "Found $VIOLATIONS forbidden patterns"
    OVERALL_STATUS=1
else
    print_status 0 "No forbidden patterns found"
fi

# 5.3. Run npm audit (non-blocking like CI)
echo ""
echo -e "${BLUE}🔍 Running npm audit...${NC}"
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    print_status 0 "No security vulnerabilities found"
else
    echo -e "${YELLOW}⚠️  Security vulnerabilities found (non-blocking)${NC}"
    echo "   Run: npm audit fix"
fi

# ==========================================
# Additional Checks
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📝 ADDITIONAL CHECKS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check for TODO/FIXME comments (advisory)
echo ""
echo -e "${BLUE}📝 Checking for TODO/FIXME comments...${NC}"
TODO_COUNT=$(echo "$STAGED_FILES" | xargs grep -i "TODO\|FIXME" 2>/dev/null | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $TODO_COUNT TODO/FIXME comments in staged files${NC}"
    echo "$STAGED_FILES" | xargs grep -in "TODO\|FIXME" 2>/dev/null | head -5
else
    print_status 0 "No TODO/FIXME comments in staged files"
fi

# Check commit message format (if provided)
COMMIT_MSG_FILE="$1"
if [ -n "$COMMIT_MSG_FILE" ] && [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
    
    echo ""
    echo -e "${BLUE}📝 Checking commit message format...${NC}"
    if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
        echo -e "${YELLOW}⚠️  Commit message doesn't follow conventional commits format${NC}"
        echo "Expected format: type(scope): description"
        echo "Examples:"
        echo "  feat: add user authentication"
        echo "  fix(database): resolve connection timeout"
        echo "  docs: update API documentation"
        echo ""
        echo "Types: feat, fix, docs, style, refactor, test, chore"
    else
        print_status 0 "Commit message follows conventional commits format"
    fi
fi

# ==========================================
# Summary
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 QUALITY GATE SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Duration: ${DURATION}s"
echo ""

# Final verdict
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL PRE-COMMIT CHECKS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Your code is ready to be committed and will pass CI/CD pipeline."
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ PRE-COMMIT CHECKS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please fix the issues above before committing."
    echo ""
    echo -e "${YELLOW}To temporarily bypass this check, use: git commit --no-verify${NC}"
    echo -e "${YELLOW}(Not recommended - CI/CD pipeline will still fail)${NC}"
    exit 1
fi
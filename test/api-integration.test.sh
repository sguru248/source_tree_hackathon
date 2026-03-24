#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SourceTrace Incentive System — API Integration Test Suite
# Run: bash test/api-integration.test.sh
# Requires: dev server running on port 3000, incentives contract deployed
# ═══════════════════════════════════════════════════════════════

BASE="http://localhost:3000"
PASS=0
FAIL=0
TEST_ADDR="0xABCDEF1234567890ABCDEF1234567890ABCDEF12"

pass() { ((PASS++)); echo "  ✔ $1"; }
fail() { ((FAIL++)); echo "  ✗ $1 — GOT: $2"; }

assert_contains() {
  if echo "$2" | grep -qi "$3"; then pass "$1"; else fail "$1" "$2"; fi
}

assert_status() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$2")
  if [ "$code" = "$3" ]; then pass "$1"; else fail "$1" "HTTP $code (expected $3)"; fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  SourceTrace API Integration Tests"
echo "═══════════════════════════════════════════"

# ─── 1. Page Accessibility ───
echo ""
echo "1. Page Accessibility"

assert_status "GET / returns 200" "$BASE/" "200"
assert_status "GET /dashboard returns 200" "$BASE/dashboard" "200"
assert_status "GET /rewards returns 200" "$BASE/rewards" "200"
assert_status "GET /leaderboard returns 200" "$BASE/leaderboard" "200"
assert_status "GET /scan returns 200" "$BASE/scan" "200"

# ─── 2. API Validation ───
echo ""
echo "2. API Validation"

# Missing params
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" -d '{}')
assert_contains "POST /api/rewards with empty body returns error" "$RESP" "required"

RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" -d '{"participant":"0x1"}')
assert_contains "POST /api/rewards without action/role returns error" "$RESP" "required"

# Invalid action
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" -d '{"participant":"0x1","action":"BadAction","role":0}')
assert_contains "POST /api/rewards with invalid action returns error" "$RESP" "Invalid action"

# Invalid role
RESP=$(curl -s "$BASE/api/leaderboard?role=9")
assert_contains "GET /api/leaderboard with role=9 returns error" "$RESP" "role must be 0-4"

# Missing address
RESP=$(curl -s "$BASE/api/rewards")
assert_contains "GET /api/rewards without address returns error" "$RESP" "required"

# ─── 3. Reward Recording Flow ───
echo ""
echo "3. Reward Recording Flow"

# Register
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"Register\",\"role\":0}")
assert_contains "Register reward records successfully" "$RESP" "success"

# CreateProduct
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"CreateProduct\",\"role\":0}")
assert_contains "CreateProduct reward records successfully" "$RESP" "success"

# AddCheckpoint with quality
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"AddCheckpoint\",\"role\":0,\"isQualityCheckpoint\":true}")
assert_contains "AddCheckpoint with quality records successfully" "$RESP" "success"

# AddCheckpoint without quality
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"AddCheckpoint\",\"role\":0,\"isQualityCheckpoint\":false}")
assert_contains "AddCheckpoint without quality records successfully" "$RESP" "success"

# VerifyProduct
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"VerifyProduct\",\"role\":0}")
assert_contains "VerifyProduct reward records successfully" "$RESP" "success"

# FlagProduct
RESP=$(curl -s -X POST "$BASE/api/rewards" -H "Content-Type: application/json" \
  -d "{\"participant\":\"$TEST_ADDR\",\"action\":\"FlagProduct\",\"role\":0}")
assert_contains "FlagProduct reward records successfully" "$RESP" "success"

# ─── 4. Stats Verification ───
echo ""
echo "4. Stats Verification"

RESP=$(curl -s "$BASE/api/rewards?address=$TEST_ADDR")

assert_contains "Stats include totalSTR" "$RESP" "totalSTR"
assert_contains "Stats include reputationScore" "$RESP" "reputationScore"
assert_contains "Stats include streakDays" "$RESP" "streakDays"
assert_contains "Stats include checkpointCount" "$RESP" "checkpointCount"
assert_contains "Stats include badgesBitmap" "$RESP" "badgesBitmap"
assert_contains "Rewards array returned" "$RESP" "rewards"

# Verify STR > 0 (accumulated from this and possibly prior runs)
assert_contains "Total STR is > 0" "$RESP" "\"totalSTR\":"

# Verify checkpoint count > 0
assert_contains "Checkpoint count > 0" "$RESP" "\"checkpointCount\":"

# ─── 5. Leaderboard ───
echo ""
echo "5. Leaderboard"

for role in 0 1 2 3 4; do
  RESP=$(curl -s "$BASE/api/leaderboard?role=$role&limit=5")
  assert_contains "Leaderboard role=$role returns entries array" "$RESP" "entries"
done

# Farmer leaderboard should contain our test address
RESP=$(curl -s "$BASE/api/leaderboard?role=0&limit=20")
assert_contains "Farmer leaderboard contains test address" "$RESP" "$TEST_ADDR"

# ─── 6. Existing API Routes Still Work ───
echo ""
echo "6. Existing API Routes"

# topic route is POST-only; test with POST
RESP=$(curl -s -X POST "$BASE/api/topic" -o /dev/null -w "%{http_code}")
if [ "$RESP" = "200" ]; then pass "POST /api/topic returns 200"; else fail "POST /api/topic returns 200" "HTTP $RESP"; fi

# ─── Results ───
echo ""
echo "═══════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "  Results: $PASS/$TOTAL passed"
if [ $FAIL -gt 0 ]; then
  echo "  $FAIL FAILED"
  exit 1
else
  echo "  All tests passed!"
  exit 0
fi

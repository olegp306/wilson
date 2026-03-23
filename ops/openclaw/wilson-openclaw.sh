#!/usr/bin/env bash
set -euo pipefail

# Helper script to run Wilson as OpenClaw backend on Ubuntu.
# Commands: build | start | health | smoke | all
#
# Usage examples:
#   bash ops/openclaw/wilson-openclaw.sh all --repo /opt/wilson
#   bash ops/openclaw/wilson-openclaw.sh smoke --repo /opt/wilson --tenant-id ... --employee-id ...

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/opt/wilson"
CMD="${1:-all}"
shift || true

TENANT_ID="${OPENCLAW_TENANT_ID:-11111111-1111-4111-8111-1111111111a1}"
EMPLOYEE_ID="${OPENCLAW_EMPLOYEE_ID:-22222222-2222-4222-8222-2222222222a2}"
ORCH_URL="${ORCHESTRATOR_URL:-http://127.0.0.1:3020}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_ROOT="$2"
      shift 2
      ;;
    --tenant-id)
      TENANT_ID="$2"
      shift 2
      ;;
    --employee-id)
      EMPLOYEE_ID="$2"
      shift 2
      ;;
    --orchestrator-url)
      ORCH_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

log() {
  echo "==> $*"
}

run_build() {
  log "Build Wilson (repo: $REPO_ROOT)"
  cd "$REPO_ROOT"
  pnpm install --frozen-lockfile
  pnpm run build
  pnpm prisma:migrate:deploy
}

run_start() {
  log "Start Wilson services"
  cd "$REPO_ROOT"
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | rg -q '^wilson\.target'; then
    sudo systemctl daemon-reload
    sudo systemctl start wilson.target
  else
    pnpm run prod:start
  fi
}

run_health() {
  log "Health check"
  cd "$REPO_ROOT"
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | rg -q '^wilson\.target'; then
    sudo systemctl is-active wilson.target >/dev/null
  fi
  pnpm run prod:health
}

run_smoke() {
  log "Dispatch smoke test via orchestrator"
  local dispatch_url="${ORCH_URL%/}/dispatch"
  curl -fsS -X POST "$dispatch_url" \
    -H "content-type: application/json" \
    -d "{
      \"type\": \"GET_MY_TASKS\",
      \"tenantId\": \"$TENANT_ID\",
      \"employeeId\": \"$EMPLOYEE_ID\"
    }"
  echo
}

main() {
  need pnpm
  need curl
  need rg

  case "$CMD" in
    build)
      run_build
      ;;
    start)
      run_start
      ;;
    health)
      run_health
      ;;
    smoke)
      run_smoke
      ;;
    all)
      run_build
      run_start
      run_health
      run_smoke
      ;;
    *)
      echo "Unknown command: $CMD" >&2
      echo "Use: build | start | health | smoke | all" >&2
      exit 1
      ;;
  esac

  log "Done"
}

main "$@"

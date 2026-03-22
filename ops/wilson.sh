#!/usr/bin/env bash
# Wilson production-style lifecycle: start | stop | restart | status | health
# Usage: from repo root — bash ops/wilson.sh <command>
# Env: WILSON_REPO_ROOT (set by wrapper), WILSON_RUN_DIR, WILSON_LOG_DIR (optional)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export WILSON_REPO_ROOT="${WILSON_REPO_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# shellcheck source=ops/lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<'EOF'
Wilson ops — run from repository root on Linux (Ubuntu).

  bash ops/wilson.sh start     Start all services (skips if already running)
  bash ops/wilson.sh stop      Stop all services (graceful SIGTERM, then SIGKILL)
  bash ops/wilson.sh restart   stop then start
  bash ops/wilson.sh status    Show pid files and running state
  bash ops/wilson.sh health    HTTP checks on default ports (curl)

Environment: load .env from repo root. Logs: .wilson/logs/*.log  PIDs: .wilson/run/*.pid

Apps (order): task-agent → calendar-agent → mail-agent → orchestrator → admin-api → telegram-bot
EOF
}

start_one() {
  local name=$1
  local app_subdir=$2
  local port=$3
  local main_js="$WILSON_REPO_ROOT/$app_subdir/dist/main.js"
  local pidfile="$RUN_DIR/${name}.pid"
  local logfile="$LOG_DIR/${name}.log"

  ensure_built "$main_js" || return 1

  if pid_file_running "$pidfile"; then
    echo "[$name] already running (pid $(cat "$pidfile"))"
    return 0
  fi
  rm -f "$pidfile"

  if port_in_use "$port"; then
    echo "[$name] ERROR: port $port already in use (not this pid file). Stop the other process or run: pnpm run prod:stop" >&2
    return 1
  fi

  cd "$WILSON_REPO_ROOT/$app_subdir"
  load_env
  export NODE_ENV="${NODE_ENV:-production}"
  nohup node dist/main.js >>"$logfile" 2>&1 &
  local npid=$!
  write_pid "$pidfile" "$npid"
  echo "[$name] started pid $npid (log: ${logfile#$WILSON_REPO_ROOT/})"
}

start_telegram() {
  local name="telegram-bot"
  local app_subdir="apps/telegram-bot"
  local main_js="$WILSON_REPO_ROOT/$app_subdir/dist/main.js"
  local pidfile="$RUN_DIR/${name}.pid"
  local logfile="$LOG_DIR/${name}.log"

  ensure_built "$main_js" || return 1

  if pid_file_running "$pidfile"; then
    echo "[$name] already running (pid $(cat "$pidfile"))"
    return 0
  fi
  rm -f "$pidfile"

  load_env
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    if port_in_use 3030; then
      echo "[$name] ERROR: port 3030 in use (dev simulation mode). Run: pnpm run prod:stop" >&2
      return 1
    fi
  fi

  cd "$WILSON_REPO_ROOT/$app_subdir"
  load_env
  export NODE_ENV="${NODE_ENV:-production}"
  nohup node dist/main.js >>"$logfile" 2>&1 &
  local npid=$!
  write_pid "$pidfile" "$npid"
  echo "[$name] started pid $npid (log: ${logfile#$WILSON_REPO_ROOT/})"
}

cmd_start() {
  load_env
  echo "Wilson: starting services (RUN_DIR=$RUN_DIR)"
  start_one "task-agent" "apps/task-agent" 3011
  start_one "calendar-agent" "apps/calendar-agent" 3012
  start_one "mail-agent" "apps/mail-agent" 3013
  start_one "orchestrator" "apps/orchestrator" 3020
  start_one "admin-api" "apps/admin-api" 3000
  start_telegram
  echo "Wilson: start complete."
}

cmd_stop() {
  echo "Wilson: stopping services"
  stop_pidfile "telegram-bot" "$RUN_DIR/telegram-bot.pid"
  stop_pidfile "admin-api" "$RUN_DIR/admin-api.pid"
  stop_pidfile "orchestrator" "$RUN_DIR/orchestrator.pid"
  stop_pidfile "mail-agent" "$RUN_DIR/mail-agent.pid"
  stop_pidfile "calendar-agent" "$RUN_DIR/calendar-agent.pid"
  stop_pidfile "task-agent" "$RUN_DIR/task-agent.pid"
  echo "Wilson: stop complete."
}

cmd_status() {
  local s
  for s in task-agent calendar-agent mail-agent orchestrator admin-api telegram-bot; do
    local pf="$RUN_DIR/${s}.pid"
    if [[ -f "$pf" ]]; then
      local pid
      pid="$(cat "$pf")"
      if kill -0 "$pid" 2>/dev/null; then
        echo "[$s] running pid $pid"
      else
        echo "[$s] stale pid file (pid $pid not running)"
      fi
    else
      echo "[$s] stopped"
    fi
  done
}

cmd_health() {
  load_env
  local failed=0
  local admin_port="${ADMIN_API_PORT:-3000}"
  local orch_port="${ORCHESTRATOR_PORT:-3020}"

  check_http() {
    local url=$1
    local label=$2
    if curl -sf --connect-timeout 2 --max-time 5 "$url" >/dev/null; then
      echo "OK  $label  $url"
    else
      echo "FAIL $label  $url" >&2
      failed=1
    fi
  }

  check_http "http://127.0.0.1:3011/health" "task-agent"
  check_http "http://127.0.0.1:3012/health" "calendar-agent"
  check_http "http://127.0.0.1:3013/health" "mail-agent"
  check_http "http://127.0.0.1:${orch_port}/api/health" "orchestrator"
  check_http "http://127.0.0.1:${admin_port}/api/health" "admin-api"

  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    local tb_port="${TELEGRAM_BOT_DEV_PORT:-3030}"
    check_http "http://127.0.0.1:${tb_port}/health" "telegram-bot (dev simulator)"
  else
    echo "SKIP telegram-bot HTTP (polling mode — no HTTP server); use: pnpm run prod:status"
  fi

  if [[ "$failed" -ne 0 ]]; then
    exit 1
  fi
  echo "Wilson: health check passed."
}

cmd_restart() {
  cmd_stop
  cmd_start
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    status) cmd_status ;;
    health) cmd_health ;;
    -h | --help | help) usage ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"

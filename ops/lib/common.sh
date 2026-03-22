#!/usr/bin/env bash
# Shared helpers for Wilson ops scripts (Ubuntu / bash 4+).
# shellcheck shell=bash

: "${WILSON_REPO_ROOT:?}"

RUN_DIR="${WILSON_RUN_DIR:-$WILSON_REPO_ROOT/.wilson/run}"
LOG_DIR="${WILSON_LOG_DIR:-$WILSON_REPO_ROOT/.wilson/logs}"

mkdir -p "$RUN_DIR" "$LOG_DIR"

load_env() {
  if [[ -f "$WILSON_REPO_ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$WILSON_REPO_ROOT/.env"
    set +a
  fi
}

# True if something is listening on TCP port (requires `ss` from iproute2 on Ubuntu).
port_in_use() {
  local port=$1
  ss -tln 2>/dev/null | awk 'NR > 1 { print $4 }' | grep -qE ":${port}$"
}

pid_file_running() {
  local pidfile=$1
  [[ -f "$pidfile" ]] || return 1
  local pid
  pid="$(cat "$pidfile")"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

write_pid() {
  local pidfile=$1
  local pid=$2
  echo "$pid" >"$pidfile"
}

stop_pidfile() {
  local name=$1
  local pidfile=$2
  if [[ ! -f "$pidfile" ]]; then
    echo "[$name] not running (no pid file)"
    return 0
  fi
  local pid
  pid="$(cat "$pidfile")"
  if [[ -z "$pid" ]]; then
    rm -f "$pidfile"
    echo "[$name] removed empty pid file"
    return 0
  fi
  if kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
    local i
    for i in $(seq 1 30); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    if kill -0 "$pid" 2>/dev/null; then
      echo "[$name] sending SIGKILL to $pid"
      kill -KILL "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$pidfile"
  echo "[$name] stopped"
}

ensure_built() {
  local main=$1
  if [[ ! -f "$main" ]]; then
    echo "wilson: missing $main — run: pnpm run prod:build (or pnpm run build)" >&2
    return 1
  fi
}

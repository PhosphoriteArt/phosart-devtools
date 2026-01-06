#!/usr/bin/env bash

set -euo pipefail

read -r CMD || true
read -r HANDLE || true
VALUE_B64=""
if [[ "${CMD:-}" == "WRITE" ]]; then
  read -r VALUE_B64 || VALUE_B64=""
fi

SERVICE="com.phosart.devtool.secrets"

two_lines() { printf "%s\n%s\n" "$1" "$2"; }

valid_handle() {
  [[ "$HANDLE" =~ ^[A-Za-z0-9._-]{1,128}$ ]]
}

if ! valid_handle; then
  two_lines "ERROR" "invalid handle"
  exit 0
fi

if ! command -v secret-tool >/dev/null 2>&1; then
  two_lines "NOT_SUPPORTED" "null"
  exit 0
fi

read_existing() {
  # secret-tool lookup returns 0 with value, or 1 if not found.
  secret-tool lookup service "$SERVICE" account "$HANDLE" 2>/dev/null
}

case "${CMD:-}" in
  READ)
    if out="$(read_existing)"; then
      two_lines "OK" "$out"
    else
      two_lines "MISSING" "null"
    fi
    ;;

  WRITE)
    old="null"
    if out="$(read_existing)"; then old="$out"; fi

    # store (replace)
    printf "%s" "$VALUE_B64" | secret-tool store --label="YourApp secret $HANDLE" service "$SERVICE" account "$HANDLE" >/dev/null

    two_lines "OK" "$old"
    ;;

  DELETE)
    if out="$(read_existing)"; then
      secret-tool clear service "$SERVICE" account "$HANDLE" >/dev/null || true
      two_lines "OK" "$out"
    else
      two_lines "MISSING" "null"
    fi
    ;;

  *)
    two_lines "ERROR" "unknown command"
    ;;
esac

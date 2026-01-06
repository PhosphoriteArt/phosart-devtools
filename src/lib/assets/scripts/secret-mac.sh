#!/usr/bin/env bash
# mac-secret.sh

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

read_existing() {
  # Prints existing secret to stdout, or returns nonzero if not found.
  security find-generic-password -a "$HANDLE" -s "$SERVICE" -w 2>/dev/null
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

    # Add or update
    security add-generic-password -a "$HANDLE" -s "$SERVICE" -w "$VALUE_B64" -U >/dev/null 2>&1

    two_lines "OK" "$old"
    ;;

  DELETE)
    if out="$(read_existing)"; then
      security delete-generic-password -a "$HANDLE" -s "$SERVICE" >/dev/null 2>&1 || true
      two_lines "OK" "$out"
    else
      two_lines "MISSING" "null"
    fi
    ;;

  *)
    two_lines "ERROR" "unknown command"
    ;;
esac

#!/bin/sh
# Daily logical backup of the Jarvis database, run by the `postgres-backup`
# compose service. Connection comes from the PG* env vars set in compose.yml.
#
# Layout of $BACKUP_DIR:
#   daily/jarvis-<UTC timestamp>.dump   kept for 7 days
#   weekly/jarvis-<UTC timestamp>.dump  copy taken on Sundays, kept for 28 days
#
# Restore (see docs/DEPLOYMENT.md): pg_restore --clean --if-exists --no-owner
#   -d jarvis <file>. The dumps never leave the VPS: copy them off-site.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_DAYS=28

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"

run_backup() {
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  target="$BACKUP_DIR/daily/jarvis-$stamp.dump"

  # Write to a temp file first so a failed dump never looks like a backup.
  if pg_dump --format=custom --no-owner --file="$target.partial"; then
    mv "$target.partial" "$target"
    echo "[backup] wrote $target"
  else
    rm -f "$target.partial"
    echo "[backup] pg_dump failed" >&2
    return 1
  fi

  if [ "$(date -u +%u)" = "7" ]; then
    cp "$target" "$BACKUP_DIR/weekly/"
    echo "[backup] weekly copy saved"
  fi

  find "$BACKUP_DIR/daily" -name 'jarvis-*.dump' -mtime +"$DAILY_RETENTION_DAYS" -delete
  find "$BACKUP_DIR/weekly" -name 'jarvis-*.dump' -mtime +"$WEEKLY_RETENTION_DAYS" -delete
}

while true; do
  run_backup || true
  sleep "$INTERVAL_SECONDS"
done

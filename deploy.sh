#!/bin/bash
LOG_FILE="/var/log/open-studio-deploy.log"
SITE_DIR="/opt/open-studio"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Deploy triggered ==="
cd "$SITE_DIR" || { log "ERROR: cannot cd to $SITE_DIR"; exit 1; }

OUTPUT=$(git pull origin main 2>&1)
STATUS=$?
log "$OUTPUT"

if [ $STATUS -eq 0 ]; then
    log "Deploy SUCCESS"
else
    log "Deploy FAILED (exit code $STATUS)"
fi

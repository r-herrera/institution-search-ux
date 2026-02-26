#!/bin/bash
# =============================================================================
# Export institution data from Option 1 PostgreSQL databases to JSON
# =============================================================================
# Prerequisites:
#   - Option 1 Docker containers running (docker compose -f option_1/docker-compose.option1.yml up -d)
#   - psql client installed
#   - jq installed
#
# Usage:
#   cd search-ui-static
#   bash scripts/export-data.sh
#
# Output:
#   data/institutions.json  (~80MB, ~416K records)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/data"
OUTPUT_FILE="$OUTPUT_DIR/institutions.json"
TEMP_DIR=$(mktemp -d)

# Database connection defaults (Option 1 ports)
US_PORT="${US_PORT:-5441}"
EU_PORT="${EU_PORT:-5442}"
CN_PORT="${CN_PORT:-5443}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-postgres}"
DB_NAME="${DB_NAME:-institutions_db}"

export PGPASSWORD="$DB_PASS"

# Fields to export (only what the UI needs)
FIELDS="id, organisation_name, city, country, region, street_1, street_2, website"

echo "========================================"
echo "Institution Data Export"
echo "========================================"
echo "Output: $OUTPUT_FILE"
echo ""

mkdir -p "$OUTPUT_DIR"

# Export function
export_region() {
  local region_name="$1"
  local port="$2"
  local output="$3"

  echo "  Exporting $region_name (port $port)..."

  psql -h "$DB_HOST" -p "$port" -U "$DB_USER" -d "$DB_NAME" -t -A -c "
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT $FIELDS
      FROM institutions
      ORDER BY id
    ) t
  " > "$output" 2>/dev/null

  local count
  count=$(jq 'length' "$output" 2>/dev/null || echo "0")
  echo "    -> $count records"
}

# Export each region
echo "Exporting from Option 1 databases..."
echo ""

export_region "US"    "$US_PORT" "$TEMP_DIR/us.json"
export_region "EU"    "$EU_PORT" "$TEMP_DIR/eu.json"
export_region "China" "$CN_PORT" "$TEMP_DIR/cn.json"

echo ""
echo "Merging regions..."

# Merge all three JSON arrays into one
jq -s 'add' "$TEMP_DIR/us.json" "$TEMP_DIR/eu.json" "$TEMP_DIR/cn.json" > "$OUTPUT_FILE"

TOTAL=$(jq 'length' "$OUTPUT_FILE")
SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)

echo ""
echo "========================================"
echo "Export complete!"
echo "  Records: $TOTAL"
echo "  File:    $OUTPUT_FILE"
echo "  Size:    $SIZE"
echo "========================================"

# Cleanup
rm -rf "$TEMP_DIR"
unset PGPASSWORD

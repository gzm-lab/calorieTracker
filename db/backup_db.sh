#!/bin/bash

# Répertoire de sauvegarde (modifiable si besoin)
BACKUP_DIR="/home/pi/backups"
CSV_FILE="$BACKUP_DIR/calorietrack_backup.csv"
TABLE="meals"  # Table principale à exporter
DB_NAME="calorietrack"
DB_USER="postgres"
CONTAINER="db"

mkdir -p "$BACKUP_DIR"

echo "Export de la table $TABLE en CSV..."
docker exec -t $CONTAINER psql -U $DB_USER -d $DB_NAME -c "\copy $TABLE TO STDOUT WITH CSV HEADER" > "$CSV_FILE"
echo "Backup terminé : $CSV_FILE" 
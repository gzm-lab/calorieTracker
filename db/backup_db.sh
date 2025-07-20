#!/bin/bash

# Charger les variables d'environnement du projet
set -a
source /home/gzi/Desktop/calorie/calorieTracker/.env
set +a

BACKUP_DIR="/home/gzi/Desktop/calorie/backup"
CSV_FILE="$BACKUP_DIR/calorietrack_backup.csv"
TABLE="meal"

mkdir -p "$BACKUP_DIR"

echo "Export de la table $TABLE en CSV..."
docker exec -t "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\copy $TABLE TO STDOUT WITH CSV HEADER" > "$CSV_FILE"
echo "Backup terminé : $CSV_FILE" 

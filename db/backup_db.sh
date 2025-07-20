#!/bin/bash

# Charger les variables d'environnement du projet
set -a
source /home/gzi/Desktop/calorie/calorieTracker/.env
set +a

BACKUP_DIR="/home/gzi/Desktop/calorie/backup"
CSV_FILE="$BACKUP_DIR/calorietrack_backup.csv"
TABLE="meals"
CONTAINER="A_REMPLACER_PAR_LE_NOM_DU_CONTENEUR"  # À remplacer par le nom exact de ton conteneur PostgreSQL

mkdir -p "$BACKUP_DIR"

echo "Export de la table $TABLE en CSV..."
docker exec -t $CONTAINER psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\copy $TABLE TO STDOUT WITH CSV HEADER" > "$CSV_FILE"
echo "Backup terminé : $CSV_FILE" 
#!/bin/bash
# ============================================
# AhorraPY - Script de Cron para Scraping
# ============================================
# 
# Para configurar el scraping automático:
#
# 1. Sube esta carpeta a tu servidor/VPS
# 2. Ejecuta: chmod +x cron-setup.sh
# 3. Ejecuta: ./cron-setup.sh
#
# O manualmente agrega estas líneas a tu crontab:
# crontab -e
#
# Scraping diario a las 6 AM:
# 0 6 * * * cd /ruta/a/ahorrapy/scraper && /usr/bin/npx tsx scheduler.ts >> /var/log/ahorrapy-scrape.log 2>&1
#
# Scraping cada 12 horas:
# 0 */12 * * * cd /ruta/a/ahorrapy/scraper && /usr/bin/npx tsx scheduler.ts >> /var/log/ahorrapy-scrape.log 2>&1
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ahorrapy-scrape.log"
NODE_PATH=$(which node)
NPX_PATH=$(which npx)

echo "🔧 AhorraPY Cron Setup"
echo "======================"
echo ""
echo "Directorio del scraper: $SCRIPT_DIR"
echo ""

# Create log file
touch "$LOG_FILE" 2>/dev/null || {
    LOG_FILE="$SCRIPT_DIR/scraper.log"
    touch "$LOG_FILE"
    echo "📝 Using local log file: $LOG_FILE"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instala con: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Check if dependencies are installed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Instalando dependencias..."
    cd "$SCRIPT_DIR" && npm install
fi

echo ""
echo "=========================================="
echo "  OPCIONES DE CRON DISPONIBLES"
echo "=========================================="
echo ""
echo "1) Scraping diario (6 AM)"
echo "2) Scraping cada 12 horas"
echo "3) Scraping cada 6 horas"
echo "4) Scraping personalizado"
echo "5) Ejecutar ahora (una vez)"
echo "6) Salir"
echo ""
read -p "Selecciona una opción [1-6]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 6 * * *"
        DESC="diario a las 6 AM"
        ;;
    2)
        CRON_SCHEDULE="0 */12 * * *"
        DESC="cada 12 horas"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESC="cada 6 horas"
        ;;
    4)
        echo ""
        echo "Formato de cron: minuto hora día_del_mes mes día_de_la_semana"
        echo "Ejemplo: '30 2 * * *' = 2:30 AM todos los días"
        read -p "Ingresa el schedule de cron: " CRON_SCHEDULE
        DESC="personalizado"
        ;;
    5)
        echo ""
        echo "🚀 Ejecutando scraper..."
        cd "$SCRIPT_DIR" && npx tsx scheduler.ts
        exit 0
        ;;
    6)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "📝 Configurando cron: $DESC"
echo "   Schedule: $CRON_SCHEDULE"
echo ""

# Create cron entry
CRON_CMD="$CRON_SCHEDULE cd $SCRIPT_DIR && $NPX_PATH tsx scheduler.ts >> $LOG_FILE 2>&1"

# Check if cron entry already exists
(crontab -l 2>/dev/null | grep -v "ahorrapy" ; echo "$CRON_CMD") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron configurado exitosamente!"
    echo ""
    echo "📋 Tu crontab actual:"
    crontab -l | grep ahorrapy
    echo ""
    echo "📝 Logs en: $LOG_FILE"
    echo ""
    echo "Para ver los logs: tail -f $LOG_FILE"
    echo "Para eliminar el cron: crontab -e (y borra la línea)"
else
    echo "❌ Error al configurar cron"
    exit 1
fi

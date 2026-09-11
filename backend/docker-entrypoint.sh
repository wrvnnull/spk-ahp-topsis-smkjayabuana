#!/bin/sh
# =============================================================================
# Backend Docker Entrypoint - SPK AHP-TOPSIS
# =============================================================================
# Script ini dijalankan setiap kali container backend dimulai.
# Urutan:
#   1. Tunggu PostgreSQL siap (pg_isready)
#   2. Jalankan Prisma migration (deploy)
#   3. Jalankan seed jika diperlukan (hanya jika tabel criteria kosong)
#   4. Start aplikasi NestJS
#
# Environment variable yang dibutuhkan:
#   DATABASE_URL       - URL koneksi PostgreSQL
#   SEED_ADMIN_PASSWORD
#   SEED_GURU_PASSWORD
#   SEED_KEPSK_PASSWORD
#   (opsional) WAIT_FOR_DB_TIMEOUT - max detik tunggu DB (default: 60)
# =============================================================================

set -e

echo "[ entrypoint] Memulai backend initialization..."

# -----------------------------------------------------------------------------
# 1. Tunggu PostgreSQL siap
# -----------------------------------------------------------------------------
WAIT_TIMEOUT="${WAIT_FOR_DB_TIMEOUT:-60}"
echo "[ entrypoint] Menunggu database siap (maksimal ${WAIT_TIMEOUT}s)..."

for i in $(seq 1 $WAIT_TIMEOUT); do
  if pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-spk_admin}" -d "${DB_NAME:-spk_ahp_topsis}" > /dev/null 2>&1; then
    echo "[ entrypoint] Database siap setelah ${i} detik."
    break
  fi
  if [ "$i" -eq "$WAIT_TIMEOUT" ]; then
    echo "[ entrypoint] Gagal tersambung ke database setelah ${WAIT_TIMEOUT} detik."
    exit 1
  fi
  sleep 1
done

# -----------------------------------------------------------------------------
# 2. Jalankan Prisma migration (deployment)
# -----------------------------------------------------------------------------
echo "[ entrypoint] Menjalankan Prisma migrate deploy..."
npx prisma migrate deploy
echo "[ entrypoint] Migration selesai."

# -----------------------------------------------------------------------------
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# 3. Jalankan seed (file seed.js yang di-compile di build stage)
#    Menggunakan PrismaClient yang sudah ter-generate di production image
#    Tanpa memerlukan ts-node (devDependency)
# -----------------------------------------------------------------------------
echo "[ entrypoint] Menjalankan seed..."
node prisma/seed.js
echo "[ entrypoint] Seed selesai."

# -----------------------------------------------------------------------------
# 4. Start aplikasi
# -----------------------------------------------------------------------------
echo "[ entrypoint] Memulai aplikasi NestJS..."
exec node dist/main

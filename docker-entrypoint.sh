#!/bin/sh
set -e

echo "==> [SIGESUB] Sincronizando esquema Prisma con PostgreSQL..."
./node_modules/.bin/prisma db push --skip-generate

if [ "$AUTO_SEED" = "true" ]; then
  echo "==> [SIGESUB] Verificando carga inicial de datos (Seed si BD vacía)..."
  ./node_modules/.bin/tsx prisma/seed.ts --if-empty || echo "Aviso: Seed omitido."
fi

echo "==> [SIGESUB] Iniciando servidor Next.js 15 en puerto ${PORT:-3000}..."
exec node server.js

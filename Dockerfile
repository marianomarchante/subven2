FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 1. Instalar dependencias y generar cliente Prisma (100% cacheado si no cambia package.json ni schema.prisma)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install && npx prisma generate

# 2. Copiar código fuente y compilar producción
COPY . .
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh
RUN npm run build && cp -r .next/static .next/standalone/.next/static

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

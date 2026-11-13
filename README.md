# SIGESUB · Sistema Institucional de Gestión y Trazabilidad de Subvenciones Públicas

Aplicación web full-stack desarrollada con **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Shadcn/UI**, **`@dnd-kit`** y **Prisma ORM** sobre **PostgreSQL**, diseñada para la gestión, control presupuestario y trazabilidad de subvenciones concedidas, proyectos y expedientes vinculados (`Expediente Administrativo` y `Expediente de Modificación Presupuestaria`).

---

## 1. Estructura del Proyecto

```text
Subven2/
├── prisma/
│   ├── schema.prisma                   # Esquema relacional PostgreSQL (Grant, Project, ProjectGrant, Note)
│   └── seed.ts                         # Datos realistas de la Administración Pública española (PRTR, FEDER, POS, ENS)
├── src/
│   ├── actions/
│   │   └── subvenciones.ts             # Server Actions: CRUD completo, validaciones presupuestarias y orden Drag & Drop
│   ├── app/
│   │   ├── globals.css                 # Estilos base Tailwind CSS y scrollbars institucionales
│   │   ├── layout.tsx                  # Root Layout en español
│   │   └── page.tsx                    # Server Component principal que hidrata el Dashboard
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardClient.tsx     # Coordinador de estado optimista y layout h-screen de 3 columnas
│   │   │   ├── HeaderGlobal.tsx        # Cabecera con doble buscador rápido, atajo Cmd+K y acciones rápidas
│   │   │   ├── GrantsColumn.tsx        # Columna izquierda (30%) con Drag & Drop (@dnd-kit/sortable)
│   │   │   ├── ProjectsColumn.tsx      # Columna central (45%) con desglose N:M y badges de expedientes
│   │   │   └── NotesColumn.tsx         # Columna derecha (25%) con bloc contextual y autoguardado (debounce 1s)
│   │   ├── modals/
│   │   │   ├── GrantModal.tsx          # Modal de creación/edición de subvenciones
│   │   │   ├── DeleteGrantDialog.tsx   # Control de seguridad en borrado con advertencia de proyectos vinculados
│   │   │   ├── ProjectModal.tsx        # Modal de proyectos con control presupuestario en tiempo real
│   │   │   └── CommandSearchModal.tsx  # Buscador global instantáneo (Ctrl+K / Cmd+K)
│   │   └── ui/                         # Componentes UI estilo Shadcn (Button, Badge, Input, Textarea, Modal, Progress)
│   ├── lib/
│   │   ├── prisma.ts                   # Singleton de PrismaClient
│   │   ├── utils.ts                    # Formateadores de moneda (EUR), fechas y cálculo de vencimientos
│   │   └── fallback-data.ts            # Datos iniciales de respaldo si PostgreSQL aún no está conectado
│   └── types/
│       └── domain.ts                   # Tipado estricto de DTOs y contratos de Server Actions
├── Dockerfile                          # Imagen multi-etapa (Node 20 Alpine, modo standalone, usuario no-root)
├── docker-compose.yml                  # Orquestación lista para producción (PostgreSQL 16 + App + Healthcheck)
├── docker-entrypoint.sh                # Script de arranque: aplica esquema Prisma y seed inicial si la BD está vacía
├── desplegar.bat                       # Script automatizado para Windows (Docker Compose o Desarrollo Local)
├── .dockerignore
├── .env.example                        # Plantilla de variables de entorno
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Ejecución Automatizada en Windows (`desplegar.bat`)

Puede iniciar o desplegar el sistema completo ejecutando el script por lotes incluido en la raíz del proyecto:

```cmd
.\desplegar.bat
```

También admite ejecución directa por parámetro sin menú interactivo:
* `desplegar.bat docker` → Genera `.env` (si no existe), compila y levanta PostgreSQL 16 + Next.js 15 en producción con `docker compose up -d --build` y abre `http://localhost:3000`.
* `desplegar.bat local` → Ejecuta `npm install`, `npx prisma generate`, `npx prisma db push`, `npm run db:seed` e inicia `npm run dev`.
* `desplegar.bat stop` → Detiene los contenedores de producción (`docker compose down`).

---

## 3. Despliegue en Producción con Docker y Docker Compose

El proyecto incluye un [Dockerfile](file:///c:/Users/mariano/Documents/AntiG/Subven2/Dockerfile) multi-etapa optimizado con salida `standalone` de Next.js 15 y un [docker-compose.yml](file:///c:/Users/mariano/Documents/AntiG/Subven2/docker-compose.yml) que levanta PostgreSQL 16 con volumen persistente y healthcheck:

```bash
# 1. Crear archivo .env a partir de la plantilla
cp .env.example .env

# 2. Construir y levantar la infraestructura completa en segundo plano
docker compose up -d --build

# 3. Consultar logs de inicialización (migración automática + seed inicial)
docker compose logs -f app
```

---

## 4. Configuración Manual de PostgreSQL (`DATABASE_URL`) y Migraciones

Si desea ejecutar la aplicación directamente sobre el sistema anfitrión sin contenedores:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar DATABASE_URL en .env
cp .env.example .env

# 3. Ejecutar las migraciones de Prisma y poblar datos iniciales (seed.ts)
npx prisma migrate dev --name init_subvenciones_schema
npm run db:seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

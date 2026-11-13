import { PrismaClient, GrantStatus, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const onlyIfEmpty = process.argv.includes("--if-empty");
  if (onlyIfEmpty) {
    const existingCount = await prisma.grant.count();
    if (existingCount > 0) {
      console.log(
        `Base de datos ya inicializada (${existingCount} subvenciones registradas). Omitiendo seed automático.`
      );
      return;
    }
  }

  console.log("Iniciando volcado de datos iniciales (Seed) para Administración Pública...");

  // Limpiar registros previos en orden seguro
  await prisma.note.deleteMany();
  await prisma.projectGrant.deleteMany();
  await prisma.project.deleteMany();
  await prisma.grant.deleteMany();

  // 1. Crear Subvenciones (Grants) realistas de la Administración Pública Española
  const grantPRTR = await prisma.grant.create({
    data: {
      title: "PRTR Componente 11 - Modernización y Digitalización de las AA.PP.",
      grantingBody: "Ministerio para la Transformación Digital y de la Función Pública (Fondos NextGenerationEU)",
      totalAmount: 450000.0,
      resolutionDate: new Date("2025-03-15T00:00:00.000Z"),
      justificationDeadline: new Date("2027-06-30T00:00:00.000Z"),
      status: GrantStatus.EN_EJECUCION,
      displayOrder: 0,
    },
  });

  const grantFEDER = await prisma.grant.create({
    data: {
      title: "Programa Operativo FEDER - Rehabilitación Energética de Edificios Municipales",
      grantingBody: "Unión Europea / Consejería de Economía, Hacienda y Fondos Europeos",
      totalAmount: 620000.0,
      resolutionDate: new Date("2025-01-20T00:00:00.000Z"),
      justificationDeadline: new Date("2026-12-31T00:00:00.000Z"),
      status: GrantStatus.EN_EJECUCION,
      displayOrder: 1,
    },
  });

  const grantDiputacion = await prisma.grant.create({
    data: {
      title: "Plan Provincial de Cooperación a las Obras y Servicios de Competencia Municipal (POS)",
      grantingBody: "Diputación Provincial - Área de Cohesión Territorial",
      totalAmount: 185000.0,
      resolutionDate: new Date("2025-05-10T00:00:00.000Z"),
      justificationDeadline: new Date("2026-11-30T00:00:00.000Z"),
      status: GrantStatus.CONCEDIDA,
      displayOrder: 2,
    },
  });

  const grantCiberseguridad = await prisma.grant.create({
    data: {
      title: "Subvención CCN-CERT para Adecuación al Esquema Nacional de Seguridad (ENS)",
      grantingBody: "Centro Criptológico Nacional / Administración General del Estado",
      totalAmount: 95000.0,
      resolutionDate: new Date("2024-09-01T00:00:00.000Z"),
      justificationDeadline: new Date("2026-03-31T00:00:00.000Z"),
      status: GrantStatus.JUSTIFICADA,
      displayOrder: 3,
    },
  });

  // 2. Crear Proyectos y sus asignaciones N:M (ProjectGrant) cuadrando presupuestos
  const projectSede = await prisma.project.create({
    data: {
      name: "Renovación Integral de Sede Electrónica y Carpeta Ciudadana 360",
      description:
        "Implantación de nueva arquitectura de tramitación electrónica, firma biométrica en tableta, interoperabilidad con Plataforma de Intermediación de Datos (PID) y pasarela de pagos TPV municipal.",
      totalBudget: 260000.0,
      ownFundsAmount: 30000.0,
      adminFileNumber: "EXP-2025/00412-CONT",
      budgetModFileNumber: "MC-2025/00019-INT",
      status: ProjectStatus.EN_CURSO,
      projectGrants: {
        create: [
          {
            grantId: grantPRTR.id,
            allocatedAmount: 230000.0,
          },
        ],
      },
    },
  });

  const projectSOC = await prisma.project.create({
    data: {
      name: "Centro de Operaciones de Ciberseguridad (SOC) y Auditoría ENS Nivel Alto",
      description:
        "Despliegue de sondas EDR/XDR, correlación SIEM conectada a la Red Nacional de SOC y certificación de conformidad con el Esquema Nacional de Seguridad (RD 311/2022).",
      totalBudget: 195000.0,
      ownFundsAmount: 15000.0,
      adminFileNumber: "EXP-2024/01894-SERV",
      budgetModFileNumber: "GC-2024/00087-INT",
      status: ProjectStatus.FINALIZADO,
      projectGrants: {
        create: [
          {
            grantId: grantCiberseguridad.id,
            allocatedAmount: 95000.0,
          },
          {
            grantId: grantPRTR.id,
            allocatedAmount: 85000.0,
          },
        ],
      },
    },
  });

  const projectClimatizacion = await prisma.project.create({
    data: {
      name: "Instalación Fotovoltaica de Autoconsumo y Aerotermia en Casa Consistorial",
      description:
        "Sustitución de calderas térmicas por bombas de calor de alta eficiencia, envolvente térmica en cubierta y planta solar fotovoltaica de 120 kWp con monitorización energética.",
      totalBudget: 540000.0,
      ownFundsAmount: 65000.0,
      adminFileNumber: "EXP-2025/00108-OBR",
      budgetModFileNumber: "SC-2025/00004-INT",
      status: ProjectStatus.EN_CURSO,
      projectGrants: {
        create: [
          {
            grantId: grantFEDER.id,
            allocatedAmount: 420000.0,
          },
          {
            grantId: grantDiputacion.id,
            allocatedAmount: 55000.0,
          },
        ],
      },
    },
  });

  const projectPadrón = await prisma.project.create({
    data: {
      name: "Modernización del Padrón Municipal e Intercambio en Tiempo Real con el INE",
      description:
        "Migración del sistema de gestión poblacional al nuevo modelo de datos del INE (Web Services) y depuración automatizada del callejero georreferenciado.",
      totalBudget: 135000.0,
      ownFundsAmount: 0.0,
      adminFileNumber: "EXP-2025/00781-SUM",
      budgetModFileNumber: "GC-2025/00031-INT",
      status: ProjectStatus.PLANIFICADO,
      projectGrants: {
        create: [
          {
            grantId: grantPRTR.id,
            allocatedAmount: 135000.0,
          },
        ],
      },
    },
  });

  // 3. Crear Notas (Generales y contextuales por Subvención / Proyecto)
  await prisma.note.createMany({
    data: [
      {
        content:
          "📌 BLOC DE NOTAS GENERAL - INTERVENCIÓN Y SECRETARÍA GENERAL\n\n- Recordatorio trimestral: Remitir información de ejecución de fondos europeos a través de la plataforma COFFEE-MRR antes del día 15 del mes siguiente al cierre del trimestre.\n- Verificar que todos los pliegos de cláusulas administrativas particulares (PCAP) financiados con PRTR incorporen el Plan de Medidas Antifraude y los principios DNSH (Do No Significant Harm).\n- Próxima comisión de seguimiento de subvenciones: Jueves a las 10:30h en Sala de Juntas.",
        grantId: null,
        projectId: null,
      },
      {
        content:
          "Seguimiento PRTR Componente 11:\n- Hito CID #168 cumplido en plazo.\n- El 100% del crédito concedido (450.000,00 €) se encuentra ya asignado entre los 3 proyectos tecnológicos aprobados en Junta de Gobierno.\n- Pendiente recabar las Declaraciones de Ausencia de Conflicto de Intereses (DACI) firmadas por los miembros de la mesa de contratación del expediente EXP-2025/00781-SUM.",
        grantId: grantPRTR.id,
        projectId: null,
      },
      {
        content:
          "Subvención FEDER Rehabilitación Energética:\n- Quedan 200.000,00 € de remanente pendiente de asignar a la Fase II (Centro Cívico Norte).\n- La certificación de obra nº 3 fue fiscalizada de conformidad por Intervención el 12/10/2026.",
        grantId: grantFEDER.id,
        projectId: null,
      },
      {
        content:
          "Notas del Expediente EXP-2025/00412-CONT (Sede Electrónica):\n- Adjudicatario: UTE Administración Digital S.L.\n- Acta de inicio de los trabajos firmada.\n- El expediente de modificación presupuestaria MC-2025/00019-INT incorpora los 30.000 € de aportación municipal obligatoria (IVA no elegible en subvención).",
        grantId: null,
        projectId: projectSede.id,
      },
      {
        content:
          "Notas del Expediente EXP-2025/00108-OBR (Fotovoltaica y Aerotermia):\n- Cofinanciado entre Fondos FEDER (420.000 €), Plan Provincial de Diputación (55.000 €) y Fondos Propios (65.000 €).\n- Coordinar visita de comprobación material de la inversión con el técnico designado por Diputación.",
        grantId: null,
        projectId: projectClimatizacion.id,
      },
    ],
  });

  console.log("Seed completado con éxito:", {
    grants: 4,
    projects: [projectSede.name, projectSOC.name, projectClimatizacion.name, projectPadrón.name].length,
  });
}

main()
  .catch((e) => {
    console.error("Error ejecutando el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

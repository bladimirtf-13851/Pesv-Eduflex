/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PESVStep, Driver, Vehicle, Incident, PESVIndicatorRecord } from './types';

export const PESV_STEPS: PESVStep[] = [
  // FASE 1: Planificación (Pasos 1 al 8)
  {
    id: 1,
    title: 'Líder del diseño e implementación del PESV',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Designar formalmente al responsable del diseño, implementación, ejecución, seguimiento y mejora del PESV con idoneidad y formación en SST.',
    automationSummary: 'Asignación digital de roles, generación de acta de designación parametrizada y cargue de licencia de SST.',
    completed: true
  },
  {
    id: 2,
    title: 'Comité de seguridad vial',
    phase: 1,
    levels: ['ESTÁNDAR', 'AVANZADO'],
    description: 'Conformar el Comité de Seguridad Vial para coordinar, planificar, ejecutar y hacer seguimiento continuo a las acciones del PESV.',
    automationSummary: 'Registro de integrantes, periodicidad de reuniones, actas oficiales de sesión en PDF tamaño Carta y compromisos.',
    completed: true
  },
  {
    id: 3,
    title: 'Política de Seguridad Vial de la Organización',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Establecer el compromiso documentado y firmado por la alta dirección para prevenir siniestros viales y promover la mejora continua.',
    automationSummary: 'Generador de política institucional conforme a la Res. 40595 de 2022 con firma digital y exportación en Carta.',
    completed: true
  },
  {
    id: 4,
    title: 'Liderazgo, compromiso y corresponsabilidad del nivel directivo',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Evidenciar la asignación explícita de recursos presupuestales, humanos, técnicos y la corresponsabilidad de la Gerencia General.',
    automationSummary: 'Checklist de liderazgo gerencial, asignación de rubros presupuestales y certificación juramentada de compromiso.',
    completed: true
  },
  {
    id: 5,
    title: 'Diagnóstico',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Recopilar información de la organización (flota, rutas, colaboradores, perfiles viales) para establecer la línea base.',
    automationSummary: 'Cuestionario de autodiagnóstico dinámico, caracterización de flota y cálculo automático de brechas de cumplimiento.',
    completed: true
  },
  {
    id: 6,
    title: 'Caracterización, evaluación y control de riesgos',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Identificar peligros, evaluar y valorar los riesgos viales para definir los controles operacionales preventivos.',
    automationSummary: 'Matriz IPER de riesgos viales interactiva con clasificación de severidad y medidas de mitigación.',
    completed: false
  },
  {
    id: 7,
    title: 'Objetivos y metas del PESV',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Definir objetivos medibles y metas claras coherentes con la política y orientadas a la disminución de la siniestralidad.',
    automationSummary: 'Dashboard analítico con metas porcentuales de reducción de siniestros y seguimiento histórico multianual.',
    completed: false
  },
  {
    id: 8,
    title: 'Programas de gestión de riesgos críticos y factores de desempeño',
    phase: 1,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Diseñar e implementar programas específicos para riesgos críticos (velocidad, fatiga, distracción, EPP, alcohol y sustancias).',
    automationSummary: 'Gestión de programas de prevención vial, metas de cumplimiento de actividades y porcentaje de avance.',
    completed: false
  },

  // FASE 2: Implementación y Ejecución (Pasos 9 al 19)
  {
    id: 9,
    title: 'Plan anual de trabajo',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Documentar el cronograma detallado de actividades, fechas, responsables y recursos asignados para la vigencia anual.',
    automationSummary: 'Cronograma interactivo de actividades, monitoreo de cumplimiento y generador de informe oficial en PDF Carta.',
    completed: true
  },
  {
    id: 10,
    title: 'Competencia y plan anual de formación',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Definir perfiles de conductores, competencias requeridas, capacitaciones obligatorias y plan de entrenamiento continuo.',
    automationSummary: 'Registro de cursos aprobados, evaluación de competencias y alertas de vencimiento de certificaciones.',
    completed: true
  },
  {
    id: 11,
    title: 'Responsabilidad y comportamiento seguro',
    phase: 2,
    levels: ['AVANZADO'],
    description: 'Evaluar los hábitos de conducción, conductas en la vía y establecer mecanismos de incentivos y corrección de comportamientos.',
    automationSummary: 'Evaluación periódica de hábitos seguros de conductores con ponderación y retroalimentación personalizada.',
    completed: true
  },
  {
    id: 12,
    title: 'Plan de preparación y respuesta ante emergencias viales',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Elaborar e implementar protocolos de actuación inmediata ante siniestros viales, emergencias médicas y fallas mecánicas.',
    automationSummary: 'Directorio de emergencias, cadena de llamadas y protocolos descargables de primeros auxilios y aseguramiento.',
    completed: false
  },
  {
    id: 13,
    title: 'Investigación interna de siniestros viales',
    phase: 2,
    levels: ['ESTÁNDAR', 'AVANZADO'],
    description: 'Investigar todos los siniestros viales aplicando metodologías técnicas para identificar causas inmediatas, básicas y lecciones aprendidas.',
    automationSummary: 'Formulario de investigación de colisiones con árbol de causas y plan de acción PHVA correctivo.',
    completed: false
  },
  {
    id: 14,
    title: 'Vías seguras administradas por la organización',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Inspeccionar y mantener en condiciones seguras las vías internas, parqueaderos, accesos y zonas de cargue y descargue.',
    automationSummary: 'Lista de verificación de señalización vial interna, demarcación de pasos peatonales y límites de velocidad.',
    completed: false
  },
  {
    id: 15,
    title: 'Planificación de desplazamientos laborales',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Planificar itinerarios, rutogramas, horarios de viaje y estimación de tiempos para evitar el exceso de velocidad y fatiga.',
    automationSummary: 'Diseño de rutogramas por corredor vial con identificación de puntos ciegos, peajes y zonas críticas.',
    completed: false
  },
  {
    id: 16,
    title: 'Inspección de vehículos y equipos',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Realizar y documentar diariamente la inspección preoperacional técnico-mecánica de los vehículos antes de iniciar ruta.',
    automationSummary: 'Conectado a Aplicativo Externo de Inspección y Mantenimiento para validación preoperacional diaria de sistemas críticos.',
    completed: true
  },
  {
    id: 17,
    title: 'Mantenimiento y control de vehículos seguros y equipos',
    phase: 2,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Ejecutar el plan de mantenimiento preventivo y correctivo de la flota vehicular según fichas técnicas de los fabricantes.',
    automationSummary: 'Conectado a Aplicativo Externo de Inspección y Mantenimiento para hojas de vida de flota y control de OTs preventivas/correctivas.',
    completed: true
  },
  {
    id: 18,
    title: 'Gestión del cambio y gestión de contratistas',
    phase: 2,
    levels: ['ESTÁNDAR', 'AVANZADO'],
    description: 'Evaluar el impacto de cambios en la operación y exigir el cumplimiento de los estándares de seguridad vial a contratistas y terceros.',
    automationSummary: 'Formato oficial de reporte de Gestión del Cambio (CHG) con análisis de impacto/riesgo, plan de acción, autorización y PDF.',
    completed: true
  },
  {
    id: 19,
    title: 'Archivo y retención documental',
    phase: 2,
    levels: ['ESTÁNDAR', 'AVANZADO'],
    description: 'Garantizar la custodia, retención mínima de 5 años y disponibilidad digital de todos los registros y evidencias del PESV.',
    automationSummary: 'Bóveda digital de expedientes con almacenamiento estructurado por carpetas y trazabilidad de registros.',
    completed: true
  },

  // FASE 3: Seguimiento por la Organización (Pasos 20 al 22)
  {
    id: 20,
    title: 'Indicadores y reporte de autogestión PESV',
    phase: 3,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Medir el impacto y desempeño del PESV a través de indicadores de resultado, actividad y reporte anual ante autoridades.',
    automationSummary: 'Cálculo de Tasa de Frecuencia y Severidad de siniestros viales con gráficas de evolución mensual.',
    completed: true
  },
  {
    id: 21,
    title: 'Registro y análisis estadístico de siniestros viales',
    phase: 3,
    levels: ['AVANZADO'],
    description: 'Consolidar el histórico estadístico de colisiones e incidentes viales para identificar tendencias, patrones y recurrencias.',
    automationSummary: 'Analítica avanzada de siniestralidad con cruce por tipo de vehículo, franja horaria y factor causal.',
    completed: false
  },
  {
    id: 22,
    title: 'Auditoría anual',
    phase: 3,
    levels: ['BÁSICO', 'ESTÁNDAR', 'AVANZADO'],
    description: 'Planificar y ejecutar por lo menos una auditoría anual interna o externa para verificar la eficacia y cumplimiento del PESV.',
    automationSummary: 'Módulo integral de auditoría con calificación por paso normativo, emisión de concepto oficial y acta en PDF.',
    completed: true
  }
];

// Drivers list (clean default for real company testing)
export const SEED_DRIVERS: Driver[] = [];

// Vehicles fleet (clean default for real company testing)
export const SEED_VEHICLES: Vehicle[] = [];

// Incidents list (clean default for real company testing)
export const SEED_INCIDENTS: Incident[] = [];

// Analytical Metrics representation representing clean baseline road safety variables for real company input (Semestre 1: Ene - Jun).
export const ROAD_SAFETY_METRICS = {
  tasasFrecuencia: [
    { mes: 'Ene', siniestros: 0, tasa: 0.0, meta: 2.0 },
    { mes: 'Feb', siniestros: 0, tasa: 0.0, meta: 2.0 },
    { mes: 'Mar', siniestros: 0, tasa: 0.0, meta: 2.0 },
    { mes: 'Abr', siniestros: 0, tasa: 0.0, meta: 2.0 },
    { mes: 'May', siniestros: 0, tasa: 0.0, meta: 2.0 },
    { mes: 'Jun', siniestros: 0, tasa: 0.0, meta: 2.0 }
  ],
  tasasSeveridad: [
    { mes: 'Ene', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 },
    { mes: 'Feb', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 },
    { mes: 'Mar', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 },
    { mes: 'Abr', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 },
    { mes: 'May', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 },
    { mes: 'Jun', diasIncapacidad: 0, tasa: 0.0, meta: 10.0 }
  ],
  avancePasosPorNivel: {
    BÁSICO: { completados: 0, totales: 16, porcentaje: 0.0 },
    ESTÁNDAR: { completados: 0, totales: 20, porcentaje: 0.0 },
    AVANZADO: { completados: 0, totales: 22, porcentaje: 0.0 }
  },
  cumplimientoMetasProgramas: [
    { programa: 'Gestión de Velocidad', cumplimiento: 0, meta: 95 },
    { programa: 'Control de Alcohol y Drogas', cumplimiento: 0, meta: 100 },
    { programa: 'Inspecciones Preoperacionales', cumplimiento: 0, meta: 90 },
    { programa: 'Mantenimiento Preventivo', cumplimiento: 0, meta: 95 },
    { programa: 'Plan de Formación Vial', cumplimiento: 0, meta: 85 }
  ],
  distribuciónTiposSiniestro: [
    { tipo: 'Choque Simple', cantidad: 0, color: '#3b82f6' },
    { tipo: 'Atropello', cantidad: 0, color: '#f59e0b' },
    { tipo: 'Volcamiento', cantidad: 0, color: '#ef4444' },
    { tipo: 'Falla Mecánica Grave', cantidad: 0, color: '#10b981' }
  ]
};

// Architecture Endpoints recommendations
export interface RecommendedEndpoint {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  sourceApp: string;
  targetApp: string;
  description: string;
  payloadExample: string;
  responseExample: string;
}

export const RECOMMENDED_ENDPOINTS: RecommendedEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/training/drivers/:cedula/courses',
    sourceApp: 'Aplicativo Plan de Formación (Preexistente)',
    targetApp: 'PESV Central',
    description: 'Consulta y hereda en tiempo real el historial de cursos ejecutados, horas acumuladas, fecha de certificación y calificación obtenida para un conductor.',
    payloadExample: '// Solicitud vía Parámetro URL\nGET /api/v1/training/drivers/CC-71345890/courses',
    responseExample: `{\n  "cedula": "CC 71.345.890",\n  "nombre": "Carlos Alberto Restrepo",\n  "cursos": [\n    {\n      "id_curso": "C_MD_01",\n      "nombre": "Manejo Defensivo Resol. 40595",\n      "fecha_ejecucion": "2026-02-15",\n      "horas": 16,\n      "calificacion": 4.8,\n      "estado": "Aprobado"\n    }\n  ]\n}`
  },
  {
    method: 'GET',
    path: '/api/v1/maintenance/vehicles/:plate/history',
    sourceApp: 'Aplicativo Plan de Mantenimiento (Preexistente)',
    targetApp: 'PESV Central',
    description: 'Sincroniza la hoja de vida digital del vehículo, el estado actual de las alertas mecánicas, la fecha del último mantenimiento preventivo ejecutado y el agendamiento del próximo servicio obligatorio.',
    payloadExample: '// Solicitud vía Parámetro URL\nGET /api/v1/maintenance/vehicles/SXT-420/history',
    responseExample: `{\n  "placa": "SXT-420",\n  "tipo": "Camión",\n  "ultimo_mantenimiento": "2026-04-10",\n  "proximo_mantenimiento": "2026-07-10",\n  "alerta_estado": "Próximo Servicio",\n  "vigencia_soat": "2026-11-20",\n  "vigencia_tecnomecanica": "2026-08-30"\n}`
  },
  {
    method: 'POST',
    path: '/api/v1/pesv/inspections/preoperational',
    sourceApp: 'PESV Central (Inspección Diaria Movil)',
    targetApp: 'Aplicativo Plan de Mantenimiento (Preexistente)',
    description: 'Envía en tiempo real el resultado de la inspección preoperacional diaria. Si se reporta una falla crítica en frenos, dirección o suspensión, el Aplicativo de Mantenimiento recibe una alerta de creación de OT correctiva y bloquea el estado operativo del camión.',
    payloadExample: `{\n  "placa": "WML-089",\n  "fecha": "2026-06-25",\n  "conductor_cedula": "CC 10.223.441",\n  "aprobado": false,\n  "fallas_criticas": ["frenos", "fluidos"],\n  "observaciones": "Desgaste severo en pastillas de freno delanteras."\n}`,
    responseExample: `{\n  "id_transaccion": "TX-INS-9871",\n  "estado": "Recibido",\n  "orden_trabajo_creada": true,\n  "id_orden_trabajo": "OT-2026-5542",\n  "mensaje": "Vehículo WML-089 bloqueado preventivamente en el taller."\n}`
  },
  {
    method: 'PUT',
    path: '/api/v1/pesv/incidents/:id/phva-sync',
    sourceApp: 'PESV Central',
    targetApp: 'Sistemas Integrados / ERP de la Organización',
    description: 'Registra y actualiza el plan de acción PHVA generado tras un accidente vial para que el ERP central de la empresa asigne tareas, controle presupuestos de reparación y haga seguimiento a los responsables corporativos.',
    payloadExample: `{\n  "incidente_id": "INC-2026-002",\n  "fase_actual": "Planear",\n  "acciones_phva": [\n    {\n      "id": "P2",\n      "fase": "Planear",\n      "accion": "Levantamiento de informe técnico vial",\n      "responsable": "Líder PESV (SST)",\n      "fecha_limite": "2026-06-24",\n      "estado": "Completado"\n    }\n  ]\n}`,
    responseExample: `{\n  "sincronizacion_exitosa": true,\n  "registros_actualizados": 1,\n  "ultimo_sync": "2026-06-25T08:20:45-07:00"\n}`
  }
];

// =======================================================================
// MATRIZ OFICIAL DE INDICADORES DE GESTIÓN DE SEGURIDAD VIAL (RESOLUCIÓN 40595 DE 2022)
// =======================================================================
export const PESV_OFFICIAL_INDICATORS: PESVIndicatorRecord[] = [
  {
    id: 1,
    code: 'TSV(n)',
    nombre: 'Tasa de Siniestros viales por nivel de pérdida',
    tipo: 'resultado',
    formula: 'TSV(n) = SV(tn) * K / Km(t)',
    formulaDescription: 'Número de siniestros viales por trimestre por nivel de pérdida * 1.000.000 / Km recorridos por la flota',
    frecuencia: 'Trimestral y acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'SV_tn', symbol: 'SV(tn)', name: 'Siniestros viales por trimestre', description: 'Número de siniestros por nivel de pérdida (fatalidades, heridos graves >30d, leves <=30d, choques simples)', unit: 'siniestros', defaultValue: 1 },
      { key: 'K', symbol: 'K', name: 'Constante kilométrica', description: 'Constante equivalente a 1.000.000 de kilómetros', unit: 'constante', defaultValue: 1000000 },
      { key: 'Km_t', symbol: 'Km(t)', name: 'Kilómetros recorridos por la flota', description: 'Número de kilómetros recorridos por trimestre por toda la flota de la organización', unit: 'km', defaultValue: 450000 }
    ],
    unidad: 'Siniestros / 1M Km',
    metaPredeterminada: 2.0,
    sentidoMeta: 'descendente',
    pasoRelacionado: 7,
    observaciones: 'Aplica para todos los niveles organizacionales (Básico, Estándar y Avanzado).',
    datosPeriodo: {
      'T1': { variables: { SV_tn: 1, K: 1000000, Km_t: 450000 }, resultado: 2.22, meta: 2.0, cumple: false, observacion: '1 choque simple reportado en vía urbana' },
      'T2': { variables: { SV_tn: 0, K: 1000000, Km_t: 510000 }, resultado: 0.00, meta: 2.0, cumple: true, observacion: 'Cero siniestralidad alcanzada' },
      'T3': { variables: { SV_tn: 1, K: 1000000, Km_t: 480000 }, resultado: 2.08, meta: 2.0, cumple: false, observacion: 'Choque leve sin heridos' },
      'T4': { variables: { SV_tn: 0, K: 1000000, Km_t: 530000 }, resultado: 0.00, meta: 2.0, cumple: true, observacion: 'Periodo de cierre sin novedades' }
    }
  },
  {
    id: 2,
    code: '$SV(n)',
    nombre: 'Costos Siniestros Viales por nivel de pérdida',
    tipo: 'resultado',
    formula: '$SV(n) = CDSV(tn) + CISV(tn)',
    formulaDescription: 'Costos directos de siniestros viales + Costos indirectos por trimestre por nivel de pérdida',
    frecuencia: 'Trimestral y acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: false,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'CDSV_tn', symbol: 'CDSV(tn)', name: 'Costos directos por siniestros', description: 'Costos directos de siniestros viales por trimestre por nivel de pérdida (reparaciones, deducibles, etc.)', unit: 'COP ($)', defaultValue: 3500000 },
      { key: 'CISV_tn', symbol: 'CISV(tn)', name: 'Costos indirectos por siniestros', description: 'Costos indirectos de siniestros viales por trimestre (lucro cesante, grúas, reemplazos, etc.)', unit: 'COP ($)', defaultValue: 1500000 }
    ],
    unidad: 'COP ($)',
    metaPredeterminada: 8000000,
    sentidoMeta: 'descendente',
    pasoRelacionado: 7,
    observaciones: 'El texto de la resolución trae la fórmula $SV(n) = CDSV(tn) + CDSV(tn), pero se considera una errata al no usar las dos variables definidas.',
    datosPeriodo: {
      'T1': { variables: { CDSV_tn: 3500000, CISV_tn: 1200000 }, resultado: 4700000, meta: 8000000, cumple: true, observacion: 'Costos de latonería y pintura cubiertos por aseguradora' },
      'T2': { variables: { CDSV_tn: 0, CISV_tn: 0 }, resultado: 0, meta: 8000000, cumple: true, observacion: 'Sin costos por siniestralidad' },
      'T3': { variables: { CDSV_tn: 2800000, CISV_tn: 950000 }, resultado: 3750000, meta: 8000000, cumple: true, observacion: 'Reparación de parachoques y peritaje' },
      'T4': { variables: { CDSV_tn: 0, CISV_tn: 0 }, resultado: 0, meta: 8000000, cumple: true, observacion: 'Sin costos en trimestre 4' }
    }
  },
  {
    id: 3,
    code: 'RSVI / GRV',
    nombre: 'Riesgos de Seguridad Vial Identificados y Gestión de Riesgos Viales',
    tipo: 'resultado',
    formula: 'RSVI = RI(fa) - RI(ia)  |  GRV = RVA(fa) - RVA(ia)',
    formulaDescription: 'RSVI: Variación neta de riesgos identificados. GRV: Variación de riesgos de nivel alto (debe tender a negativo o cero)',
    frecuencia: 'Anual',
    frecuenciaTipo: 'anual',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'RI_ia', symbol: 'RI(ia)', name: 'Riesgos identificados al inicio de año', description: 'Cantidad de riesgos identificados al inicio del año (total en matriz IPER)', unit: 'riesgos', defaultValue: 14 },
      { key: 'RI_fa', symbol: 'RI(fa)', name: 'Riesgos identificados al final de año', description: 'Cantidad de riesgos identificados al final del año (total en matriz IPER)', unit: 'riesgos', defaultValue: 18 },
      { key: 'RVA_ia', symbol: 'RVA(ia)', name: 'Riesgos con valoración alta inicio de año', description: 'Cantidad de riesgos con valoración alta o crítica al inicio del año', unit: 'riesgos altos', defaultValue: 6 },
      { key: 'RVA_fa', symbol: 'RVA(fa)', name: 'Riesgos con valoración alta final de año', description: 'Cantidad de riesgos con valoración alta o crítica al final del año', unit: 'riesgos altos', defaultValue: 2 }
    ],
    unidad: 'Variación de Riesgos',
    metaPredeterminada: 0,
    sentidoMeta: 'descendente',
    pasoRelacionado: 6,
    observaciones: 'Relacionado directamente con el Paso 6 (Caracterización, evaluación y control de riesgos vial).',
    datosPeriodo: {
      '2026': { variables: { RI_ia: 14, RI_fa: 18, RVA_ia: 6, RVA_fa: 2 }, resultado: -4, meta: 0, cumple: true, observacion: 'Reducción de 4 riesgos críticos (GRV = -4), ampliada la identificación a 18 (RSVI = +4)' }
    }
  },
  {
    id: 4,
    code: 'CM PESV',
    nombre: 'Cumplimiento Metas PESV',
    tipo: 'resultado',
    formula: 'CM PESV = (MA(t) / TM(t)) * 100',
    formulaDescription: '(Número de metas alcanzadas o logradas en el PESV / Número total de metas definidas) * 100',
    frecuencia: 'Trimestral y Acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'MA_t', symbol: 'MA(t)', name: 'Metas alcanzadas en el PESV', description: 'Número de metas alcanzadas o logradas en el PESV por trimestre (del Paso 7)', unit: 'metas', defaultValue: 4 },
      { key: 'TM_t', symbol: 'TM(t)', name: 'Total de metas definidas en el PESV', description: 'Número total de metas definidas del PESV por trimestre (del Paso 7)', unit: 'metas', defaultValue: 4 }
    ],
    unidad: '%',
    metaPredeterminada: 90.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 7,
    observaciones: 'Conexión directa obligatoria con el Paso 7 (Objetivos y metas del PESV). Alimenta el nivel de cumplimiento estratégico.',
    datosPeriodo: {
      'T1': { variables: { MA_t: 3, TM_t: 4 }, resultado: 75.0, meta: 90.0, cumple: false, observacion: '3 de 4 metas alcanzadas en T1' },
      'T2': { variables: { MA_t: 4, TM_t: 4 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: '100% de metas del trimestre alcanzadas' },
      'T3': { variables: { MA_t: 4, TM_t: 4 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Meta de inspecciones y capacitación en rango meta' },
      'T4': { variables: { MA_t: 4, TM_t: 4 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Cierre anual con metas cumplidas' }
    }
  },
  {
    id: 5,
    code: 'CPlan PESV',
    nombre: 'Cumplimiento de actividades plan anual PESV',
    tipo: 'actividad',
    formula: 'CPlan PESV = (AEPlan(t) / APPlan(t)) * 100',
    formulaDescription: '(Número de actividades ejecutadas del plan anual / Número total de actividades programadas) * 100',
    frecuencia: 'Trimestral y Acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'AEPlan_t', symbol: 'AEPlan(t)', name: 'Actividades ejecutadas del plan anual', description: 'Número de actividades ejecutadas del plan anual de trabajo PESV por trimestre', unit: 'actividades', defaultValue: 10 },
      { key: 'APPlan_t', symbol: 'APPlan(t)', name: 'Actividades programadas del plan anual', description: 'Número total de actividades programadas del plan anual de trabajo PESV por trimestre', unit: 'actividades', defaultValue: 12 }
    ],
    unidad: '%',
    metaPredeterminada: 85.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 9,
    observaciones: 'Conexión directa con el Paso 9 (Plan anual de trabajo). Mide la disciplina operativa en la ejecución del PESV.',
    datosPeriodo: {
      'T1': { variables: { AEPlan_t: 10, APPlan_t: 12 }, resultado: 83.33, meta: 85.0, cumple: false, observacion: '2 actividades reprogramadas para inicio de T2' },
      'T2': { variables: { AEPlan_t: 13, APPlan_t: 14 }, resultado: 92.86, meta: 85.0, cumple: true, observacion: 'Ejecución acelerada de campañas viales' },
      'T3': { variables: { AEPlan_t: 11, APPlan_t: 12 }, resultado: 91.67, meta: 85.0, cumple: true, observacion: 'Cumplimiento normativo satisfactorio' },
      'T4': { variables: { AEPlan_t: 12, APPlan_t: 12 }, resultado: 100.0, meta: 85.0, cumple: true, observacion: 'Cierre total de actividades anuales' }
    }
  },
  {
    id: 6,
    code: '%EJLC',
    nombre: '% Exceso Jornadas Laborales Conductores',
    tipo: 'actividad',
    formula: '%EJL = (#EJD / #SDT) * 100',
    formulaDescription: '(Número de excesos en jornada diaria de conductores / Sumatoria total de días trabajados) * 100',
    frecuencia: 'Mensual y Acumulado año',
    frecuenciaTipo: 'mensual',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'EJD', symbol: '#EJD', name: 'Excesos en jornada diaria de conductores', description: 'Número de eventos en los que los conductores han superado el tiempo máximo permitido en la legislación por mes', unit: 'eventos', defaultValue: 0 },
      { key: 'SDT', symbol: '#SDT', name: 'Sumatoria total de días trabajados', description: 'Sumatoria total de días trabajados por todos los conductores que realizan desplazamientos laborales en el mes', unit: 'días-hombre', defaultValue: 520 }
    ],
    unidad: '%',
    metaPredeterminada: 1.0,
    sentidoMeta: 'descendente',
    pasoRelacionado: 8,
    observaciones: 'Supervisión de fatiga y tiempos de descanso conforme a la legislación laboral y de transporte.',
    datosPeriodo: {
      'Ene': { variables: { EJD: 1, SDT: 510 }, resultado: 0.20, meta: 1.0, cumple: true },
      'Feb': { variables: { EJD: 0, SDT: 490 }, resultado: 0.00, meta: 1.0, cumple: true },
      'Mar': { variables: { EJD: 0, SDT: 525 }, resultado: 0.00, meta: 1.0, cumple: true },
      'Abr': { variables: { EJD: 2, SDT: 505 }, resultado: 0.40, meta: 1.0, cumple: true },
      'May': { variables: { EJD: 0, SDT: 530 }, resultado: 0.00, meta: 1.0, cumple: true },
      'Jun': { variables: { EJD: 0, SDT: 520 }, resultado: 0.00, meta: 1.0, cumple: true }
    }
  },
  {
    id: 7,
    code: 'GVE',
    nombre: 'Cobertura Programa de Gestión Velocidad Empresarial',
    tipo: 'actividad',
    formula: 'GVE = (#VIP / #VDL) * 100',
    formulaDescription: '(Vehículos incluidos en programa de gestión de velocidad / Vehículos utilizados para desplazamientos laborales) * 100',
    frecuencia: 'Mensual y Acumulado Año',
    frecuenciaTipo: 'mensual',
    aplicabilidad: {
      basico: false,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'VIP', symbol: '#VIP', name: 'Vehículos incluidos en programa de velocidad', description: 'Vehículos incluidos en el programa de velocidad (propios, contratistas y terceros) por mes', unit: 'vehículos', defaultValue: 28 },
      { key: 'VDL', symbol: '#VDL', name: 'Vehículos utilizados en desplazamientos', description: 'Número total de vehículos utilizados para desplazamientos laborales por mes', unit: 'vehículos', defaultValue: 30 }
    ],
    unidad: '%',
    metaPredeterminada: 95.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 8,
    observaciones: 'Aplica para organizaciones de nivel Estándar y Avanzado (Paso 8 Programa de Gestión de Velocidad).',
    datosPeriodo: {
      'Ene': { variables: { VIP: 28, VDL: 30 }, resultado: 93.33, meta: 95.0, cumple: false },
      'Feb': { variables: { VIP: 29, VDL: 30 }, resultado: 96.67, meta: 95.0, cumple: true },
      'Mar': { variables: { VIP: 30, VDL: 30 }, resultado: 100.0, meta: 95.0, cumple: true },
      'Abr': { variables: { VIP: 30, VDL: 30 }, resultado: 100.0, meta: 95.0, cumple: true },
      'May': { variables: { VIP: 30, VDL: 30 }, resultado: 100.0, meta: 95.0, cumple: true },
      'Jun': { variables: { VIP: 30, VDL: 30 }, resultado: 100.0, meta: 95.0, cumple: true }
    }
  },
  {
    id: 8,
    code: 'ELVL',
    nombre: 'Excesos Límite de Velocidad Laboral',
    tipo: 'actividad',
    formula: 'ELVL = (#DLEV / #TDL) * 100',
    formulaDescription: '(Número diario de desplazamientos laborales con exceso de velocidad / Número total de desplazamientos laborales) * 100',
    frecuencia: 'Acumulado Mes y Año',
    frecuenciaTipo: 'mensual',
    aplicabilidad: {
      basico: false,
      estandar: false,
      avanzado: true
    },
    variables: [
      { key: 'DLEV', symbol: '#DLEV', name: 'Desplazamientos con exceso de velocidad', description: 'Número diario de desplazamientos con exceso de velocidad superando el límite definido por la empresa', unit: 'viajes con exceso', defaultValue: 3 },
      { key: 'TDL', symbol: '#TDL', name: 'Total de desplazamientos laborales', description: 'Número total de desplazamientos laborales realizados en el mes', unit: 'viajes totales', defaultValue: 620 }
    ],
    unidad: '%',
    metaPredeterminada: 1.0,
    sentidoMeta: 'descendente',
    pasoRelacionado: 8,
    observaciones: 'Aplica exclusivamente para organizaciones en nivel Avanzado (monitoreo telemático/GPS continuo).',
    datosPeriodo: {
      'Ene': { variables: { DLEV: 3, TDL: 620 }, resultado: 0.48, meta: 1.0, cumple: true },
      'Feb': { variables: { DLEV: 2, TDL: 580 }, resultado: 0.34, meta: 1.0, cumple: true },
      'Mar': { variables: { DLEV: 4, TDL: 640 }, resultado: 0.63, meta: 1.0, cumple: true },
      'Abr': { variables: { DLEV: 1, TDL: 610 }, resultado: 0.16, meta: 1.0, cumple: true },
      'May': { variables: { DLEV: 2, TDL: 630 }, resultado: 0.32, meta: 1.0, cumple: true },
      'Jun': { variables: { DLEV: 1, TDL: 625 }, resultado: 0.16, meta: 1.0, cumple: true }
    }
  },
  {
    id: 9,
    code: 'IDP',
    nombre: 'Inspecciones Diarias Preoperacionales',
    tipo: 'actividad',
    formula: 'IDP = (#VID / #TV) * 100',
    formulaDescription: '(Número de vehículos inspeccionados diariamente / Número total de vehículos que trabajan diariamente) * 100',
    frecuencia: 'Acumulado Mes y Año',
    frecuenciaTipo: 'mensual',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'VID', symbol: '#VID', name: 'Vehículos inspeccionados diariamente', description: 'Número de vehículos inspeccionados diariamente con checklist preoperacional verificado', unit: 'vehículos inspeccionados', defaultValue: 28 },
      { key: 'TV', symbol: '#TV', name: 'Vehículos que trabajan diariamente', description: 'Número total de vehículos que laboran diariamente en la organización', unit: 'vehículos en servicio', defaultValue: 28 }
    ],
    unidad: '%',
    metaPredeterminada: 100.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 12,
    observaciones: 'Obligatorio en los niveles Básico, Estándar y Avanzado (Paso 12 Mantenimiento y control de vehículos).',
    datosPeriodo: {
      'Ene': { variables: { VID: 27, TV: 28 }, resultado: 96.43, meta: 100.0, cumple: false },
      'Feb': { variables: { VID: 28, TV: 28 }, resultado: 100.0, meta: 100.0, cumple: true },
      'Mar': { variables: { VID: 28, TV: 28 }, resultado: 100.0, meta: 100.0, cumple: true },
      'Abr': { variables: { VID: 28, TV: 28 }, resultado: 100.0, meta: 100.0, cumple: true },
      'May': { variables: { VID: 28, TV: 28 }, resultado: 100.0, meta: 100.0, cumple: true },
      'Jun': { variables: { VID: 28, TV: 28 }, resultado: 100.0, meta: 100.0, cumple: true }
    }
  },
  {
    id: 10,
    code: 'CPMVh',
    nombre: 'Cumplimiento plan mantenimiento preventivo de vehículos',
    tipo: 'actividad',
    formula: 'CPMVh = (MEVh(t) / MPVh(t)) * 100',
    formulaDescription: '(Número de actividades de mantenimiento preventivo ejecutadas / Número total programadas) * 100',
    frecuencia: 'Trimestral y Acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'MEVh_t', symbol: 'MEVh(t)', name: 'Mantenimientos preventivos ejecutados', description: 'Número de actividades de mantenimiento preventivo ejecutadas por trimestre', unit: 'mantenimientos', defaultValue: 18 },
      { key: 'MPVh_t', symbol: 'MPVh(t)', name: 'Mantenimientos preventivos programados', description: 'Número total de actividades de mantenimiento preventivo programadas por trimestre', unit: 'mantenimientos', defaultValue: 20 }
    ],
    unidad: '%',
    metaPredeterminada: 90.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 12,
    observaciones: 'Monitorea el estricto apego al plan de mantenimiento de la flota vehicular.',
    datosPeriodo: {
      'T1': { variables: { MEVh_t: 18, MPVh_t: 20 }, resultado: 90.0, meta: 90.0, cumple: true, observacion: 'Cumplimiento de revisiones programadas en taller certificado' },
      'T2': { variables: { MEVh_t: 20, MPVh_t: 21 }, resultado: 95.24, meta: 90.0, cumple: true, observacion: 'Mantenimientos preventivos y cambio de fluidos' },
      'T3': { variables: { MEVh_t: 19, MPVh_t: 20 }, resultado: 95.0, meta: 90.0, cumple: true, observacion: 'Sincronización y revisión de frenos al día' },
      'T4': { variables: { MEVh_t: 20, MPVh_t: 20 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Cierre anual de mantenimientos preventivos' }
    }
  },
  {
    id: 11,
    code: 'CPFSV',
    nombre: 'Cumplimiento plan de formación en seguridad vial',
    tipo: 'actividad',
    formula: 'CPFSV = (CESV(t) / CPSV(t)) * 100',
    formulaDescription: '(Número de capacitaciones en seguridad vial ejecutadas / Número total programadas) * 100',
    frecuencia: 'Trimestral y Acumulado año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'CESV_t', symbol: 'CESV(t)', name: 'Capacitaciones ejecutadas', description: 'Número de capacitaciones en seguridad vial ejecutadas por trimestre', unit: 'sesiones', defaultValue: 5 },
      { key: 'CPSV_t', symbol: 'CPSV(t)', name: 'Capacitaciones programadas', description: 'Número total de capacitaciones en seguridad vial programadas por trimestre', unit: 'sesiones', defaultValue: 5 }
    ],
    unidad: '%',
    metaPredeterminada: 90.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 10,
    observaciones: 'La resolución trae la fórmula CPFSV = CEPF(t) / CTPF(t) * 100 pero se considera una errata al no utilizar las variables definidas.',
    datosPeriodo: {
      'T1': { variables: { CESV_t: 4, CPSV_t: 5 }, resultado: 80.0, meta: 90.0, cumple: false, observacion: '1 capacitación postergada por operación de flota' },
      'T2': { variables: { CESV_t: 6, CPSV_t: 6 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Módulos de manejo defensivo completados' },
      'T3': { variables: { CESV_t: 5, CPSV_t: 5 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Taller de primeros auxilios y normatividad vial' },
      'T4': { variables: { CESV_t: 4, CPSV_t: 4 }, resultado: 100.0, meta: 90.0, cumple: true, observacion: 'Evaluación final y reentrenamiento anual' }
    }
  },
  {
    id: 12,
    code: 'CPF PESV',
    nombre: 'Cobertura plan de formación en seguridad vial',
    tipo: 'actividad',
    formula: 'CPF PESV = (CFSV(t) / CT(t)) * 100',
    formulaDescription: '(Número de colaboradores capacitados en seguridad vial / Número total de colaboradores de la organización) * 100',
    frecuencia: 'Acumulado Trimestre y año',
    frecuenciaTipo: 'trimestral',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'CFSV_t', symbol: 'CFSV(t)', name: 'Colaboradores capacitados en seguridad vial', description: 'Número de colaboradores de la organización capacitados en seguridad vial', unit: 'personas capacitadas', defaultValue: 54 },
      { key: 'CT_t', symbol: 'CT(t)', name: 'Total de colaboradores de la organización', description: 'Número total de colaboradores de la organización (conductores y administrativos)', unit: 'personas totales', defaultValue: 58 }
    ],
    unidad: '%',
    metaPredeterminada: 90.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 10,
    observaciones: 'Mide la cobertura universal del programa de capacitación vial en la empresa.',
    datosPeriodo: {
      'T1': { variables: { CFSV_t: 46, CT_t: 58 }, resultado: 79.31, meta: 90.0, cumple: false },
      'T2': { variables: { CFSV_t: 53, CT_t: 58 }, resultado: 91.38, meta: 90.0, cumple: true },
      'T3': { variables: { CFSV_t: 55, CT_t: 58 }, resultado: 94.83, meta: 90.0, cumple: true },
      'T4': { variables: { CFSV_t: 56, CT_t: 58 }, resultado: 96.55, meta: 90.0, cumple: true }
    }
  },
  {
    id: 13,
    code: 'NCAC',
    nombre: 'No Conformidades Auditoría Cerradas',
    tipo: 'actividad',
    formula: 'NCAC = (#NCG / #NCI) * 100',
    formulaDescription: '(No conformidades gestionadas y cerradas / Número de no conformidades identificadas y analizadas) * 100',
    frecuencia: 'Anual',
    frecuenciaTipo: 'anual',
    aplicabilidad: {
      basico: true,
      estandar: true,
      avanzado: true
    },
    variables: [
      { key: 'NCI', symbol: '#NCI', name: 'No conformidades identificadas y analizadas', description: 'Número de no conformidades identificadas y analizadas en auditorías del PESV', unit: 'no conformidades', defaultValue: 6 },
      { key: 'NCG', symbol: '#NCG', name: 'No conformidades gestionadas y cerradas', description: 'Número de no conformidades gestionadas y efectivamente cerradas con plan de acción PHVA', unit: 'no conformidades cerradas', defaultValue: 6 }
    ],
    unidad: '%',
    metaPredeterminada: 100.0,
    sentidoMeta: 'ascendente',
    pasoRelacionado: 22,
    observaciones: 'Vinculado directamente con el Paso 22 (Auditoría anual) y planes de acción de mejora continua.',
    datosPeriodo: {
      '2026': { variables: { NCI: 6, NCG: 6 }, resultado: 100.0, meta: 100.0, cumple: true, observacion: '100% de las no conformidades cerradas y validadas por el auditor interno' }
    }
  }
];

// Helper calculation engine for any official PESV indicator
export function calculateOfficialIndicatorResult(indicatorId: number, variables: Record<string, number>): number {
  switch (indicatorId) {
    case 1: { // TSV(n) = SV(tn) * K / Km(t)
      const sv = variables.SV_tn ?? 0;
      const k = variables.K || 1000000;
      const km = variables.Km_t ?? 1;
      return km > 0 ? Number(((sv * k) / km).toFixed(2)) : 0;
    }
    case 2: { // $SV(n) = CDSV(tn) + CISV(tn)
      const directos = variables.CDSV_tn ?? 0;
      const indirectos = variables.CISV_tn ?? 0;
      return Number((directos + indirectos).toFixed(0));
    }
    case 3: { // RSVI = RI(fa) - RI(ia), GRV = RVA(fa) - RVA(ia). Return GRV as primary key risk metric
      const rva_fa = variables.RVA_fa ?? 0;
      const rva_ia = variables.RVA_ia ?? 0;
      return rva_fa - rva_ia;
    }
    case 4: { // CM PESV = (MA(t) / TM(t)) * 100
      const ma = variables.MA_t ?? 0;
      const tm = variables.TM_t ?? 1;
      return tm > 0 ? Number(((ma / tm) * 100).toFixed(1)) : 0;
    }
    case 5: { // CPlan PESV = (AEPlan(t) / APPlan(t)) * 100
      const ae = variables.AEPlan_t ?? 0;
      const ap = variables.APPlan_t ?? 1;
      return ap > 0 ? Number(((ae / ap) * 100).toFixed(1)) : 0;
    }
    case 6: { // %EJL = (#EJD / #SDT) * 100
      const ejd = variables.EJD ?? 0;
      const sdt = variables.SDT ?? 1;
      return sdt > 0 ? Number(((ejd / sdt) * 100).toFixed(2)) : 0;
    }
    case 7: { // GVE = (#VIP / #VDL) * 100
      const vip = variables.VIP ?? 0;
      const vdl = variables.VDL ?? 1;
      return vdl > 0 ? Number(((vip / vdl) * 100).toFixed(1)) : 0;
    }
    case 8: { // ELVL = (#DLEV / #TDL) * 100
      const dlev = variables.DLEV ?? 0;
      const tdl = variables.TDL ?? 1;
      return tdl > 0 ? Number(((dlev / tdl) * 100).toFixed(2)) : 0;
    }
    case 9: { // IDP = (#VID / #TV) * 100
      const vid = variables.VID ?? 0;
      const tv = variables.TV ?? 1;
      return tv > 0 ? Number(((vid / tv) * 100).toFixed(1)) : 0;
    }
    case 10: { // CPMVh = (MEVh(t) / MPVh(t)) * 100
      const mevh = variables.MEVh_t ?? 0;
      const mpvh = variables.MPVh_t ?? 1;
      return mpvh > 0 ? Number(((mevh / mpvh) * 100).toFixed(1)) : 0;
    }
    case 11: { // CPFSV = (CESV(t) / CPSV(t)) * 100
      const cesv = variables.CESV_t ?? 0;
      const cpsv = variables.CPSV_t ?? 1;
      return cpsv > 0 ? Number(((cesv / cpsv) * 100).toFixed(1)) : 0;
    }
    case 12: { // CPF PESV = (CFSV(t) / CT(t)) * 100
      const cfsv = variables.CFSV_t ?? 0;
      const ct = variables.CT_t ?? 1;
      return ct > 0 ? Number(((cfsv / ct) * 100).toFixed(1)) : 0;
    }
    case 13: { // NCAC = (#NCG / #NCI) * 100
      const ncg = variables.NCG ?? 0;
      const nci = variables.NCI ?? 1;
      return nci > 0 ? Number(((ncg / nci) * 100).toFixed(1)) : 0;
    }
    default:
      return 0;
  }
}

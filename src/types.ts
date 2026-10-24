/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Misionalidad = 'TRANSPORTE' | 'NO_TRANSPORTE';

export type PESVLevel = 'BÁSICO' | 'ESTÁNDAR' | 'AVANZADO';

export interface CompanyConfig {
  misionalidad: Misionalidad;
  motos: number;
  carros: number;
  camiones: number;
  buses: number;
  conductoresContratados: number;
  conductoresAdministrados: number;
  totalVehiculos: number;
  totalConductores: number;
  nivelCalculado: PESVLevel;
}

export interface TrainingCourse {
  id: string;
  name: string;
  date: string;
  durationHours: number;
  grade: number; // 0 to 5.0
  status: 'Aprobado' | 'Reprobado' | 'En Curso';
}

export interface Driver {
  id: string;
  name: string;
  cedula: string;
  license: string;
  licenseCategory: string;
  licenseExpiry: string;
  soatExpiry: string;
  tecnoExpiry: string; // Revisión Técnico Mecánica of their assigned/owned vehicle
  role: string;
  isContracted: boolean;
  trainingCourses: TrainingCourse[];
  documentStatus: 'Vigente' | 'Próximo a vencer' | 'Vencido';
}

export interface Inspection {
  id: string;
  date: string;
  inspectorName: string;
  approved: boolean;
  items: {
    frenos: boolean;
    luces: boolean;
    direccion: boolean;
    llantas: boolean;
    cinturones: boolean;
    fluidos: boolean;
    espejos: boolean;
    kitCarretera: boolean;
  };
  observations: string;
  signature?: string;
}

export interface Vehicle {
  plate: string;
  type: 'Moto' | 'Automóvil' | 'Camioneta' | 'Camión' | 'Bus';
  brand: string;
  model: string;
  year: number;
  assignedDriverId: string;
  assignedDriverName: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceAlert: 'Al día' | 'Mantenimiento Urgente' | 'Próximo Servicio';
  inspections: Inspection[];
  status: 'Operativo' | 'En Taller' | 'Inactivo';
}

export interface PESVStep {
  id: number;
  title: string;
  phase: 1 | 2 | 3 | 4; // 1: Planificación, 2: Implementación, 3: Seguimiento, 4: Mejora Continua
  levels: PESVLevel[]; // Levels that must implement this step
  description: string;
  automationSummary: string;
  completed: boolean;
}

export interface PhvaAction {
  id: string;
  phase: 'Planear' | 'Hacer' | 'Verificar' | 'Actuar';
  action: string;
  responsible: string;
  deadline: string;
  status: 'Pendiente' | 'En Ejecución' | 'Completado';
}

export interface Incident {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  type: 'Choque Simple' | 'Atropello' | 'Volcamiento' | 'Colisión Grave';
  description: string;
  severity: 'Baja' | 'Media' | 'Alta';
  place: string;
  phvaPlan: PhvaAction[];
  status: 'Abierto' | 'En Proceso de Cierre' | 'Cerrado';
}

export interface RiskMatrixItem {
  id: number;
  actividad: string;
  productoServicio: string;
  riesgo: string;
  impacto: string;
  actorVial: 'Conductor' | 'Motociclista' | 'Ciclista' | 'Peatón' | 'Varios';
  factorSeguridad: 'Comportamiento seguro' | 'Vehículos seguros' | 'Velocidades seguras' | 'Entorno o infraestructura vial' | 'Viajes seguros';
  variableRiesgo: string;
  exposicion: 1 | 2 | 3;
  probabilidad: 1 | 2 | 3;
  nivelRiesgoValor: number;
  nivelRiesgoCategoria: 'Bajo' | 'Moderado' | 'Crítico';
  accionTratamiento: 'Evitar' | 'Aceptar' | 'Eliminar fuente' | 'Modificar factores';
  controlesPropuestos: string;
}

export interface ObjectiveYearValue {
  year: number;
  value: number;
}

export interface PESVObjective {
  id: number;
  objetivo: string;
  meta: string;
  indicador: string;
  unidadMedida: string;
  metaValor: number;
  valoresAnuales: ObjectiveYearValue[];
  indicadorOficialId?: number;
  indicadorOficialCodigo?: string;
  indicadoresOficialesIds?: number[];
  indicadoresOficialesCodigos?: string[];
  trimestre?: 'T1' | 'T2' | 'T3' | 'T4' | 'Anual';
  logrado?: boolean;
}

export interface PESVIndicatorVariable {
  key: string;
  symbol: string;
  name: string;
  description: string;
  unit?: string;
  defaultValue?: number;
}

export interface PESVIndicatorQuarterData {
  periodo: string; // 'T1' | 'T2' | 'T3' | 'T4' or 'Ene' | 'Feb' ... or '2026'
  variables: Record<string, number>;
  resultado: number;
  meta: number;
  cumple: boolean;
}

export interface PESVIndicatorRecord {
  id: number;
  code: string;
  nombre: string;
  tipo: 'resultado' | 'actividad';
  formula: string;
  formulaDescription: string;
  frecuencia: string;
  frecuenciaTipo: 'trimestral' | 'mensual' | 'anual';
  aplicabilidad: {
    basico: boolean;
    estandar: boolean;
    avanzado: boolean;
  };
  variables: PESVIndicatorVariable[];
  unidad: string;
  metaPredeterminada: number;
  sentidoMeta: 'ascendente' | 'descendente';
  pasoRelacionado: number;
  observaciones?: string;
  datosPeriodo?: Record<string, {
    variables: Record<string, number>;
    resultado: number;
    meta: number;
    cumple: boolean;
    fechaRegistro?: string;
    observacion?: string;
  }>;
}

export interface PESVProgramActivity {
  id: number | string;
  actividad: string;
  objetivo: string;
  responsable: string;
  fechaRealizacion: string;
  verificacion: string;
  indicadores: string;
  estado: 'Programado' | 'En Ejecución' | 'Realizado' | 'Cancelado';
}

export interface PESVAnnualPlanActivity {
  id: string;
  actividad: string;
  responsable: string;
  recursos: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Planeada' | 'En proceso' | 'Ejecutado';
  fase?: 'Planificación' | 'Implementación' | 'Seguimiento' | 'Mejora';
  observaciones?: string;
}

export interface PESVProgramObjectiveItem {
  id: string;
  objetivo: string;
  meta: string;
  metaValor: string;
  objetivoPaso7Id?: number;
}

export interface PESVProgramBudgetItem {
  id: string;
  rubro: string;
  recursos: string;
  asignado: number;
  ejecutado: number;
}

export interface PESVProgramFollowUpItem {
  id: string;
  estrategia: string;
  frecuencia: string;
  responsable: string;
  evidencia: string;
}

export interface PESVRiskProgram {
  id: number;
  nombre: string;
  objetivoGeneral: string;
  indicadorGeneral: string;
  // 1. Lineamiento base o política
  lineamientoBase: string;
  lineamientosLista?: string[];
  // 2. Alcance (actores viales, vehículos y procesos)
  alcanceActores: string;
  alcanceVehiculos: string;
  alcanceProcesos: string;
  alcanceDescripcion: string;
  // 3. Objetivos y metas (alineado con Paso 7)
  objetivoEspecifico: string;
  metaMedible: string;
  metaValor: string;
  objetivoPaso7Id?: number;
  objetivosLista?: PESVProgramObjectiveItem[];
  // 4. Indicadores y forma de medición (alineado con Paso 20)
  indicadoresMedicion: string;
  formulaMedicion: string;
  frecuenciaMedicion: string;
  fuenteDatos: string;
  indicadoresPaso20Ids: number[];
  // 5. Factores de desempeño relacionados
  factoresDesempeno: string[];
  descripcionFactoresDesempeno: string;
  // 6. Presupuesto
  presupuestoAsignado: number;
  presupuestoEjecutado: number;
  detallePresupuesto: string;
  rubrosPresupuesto?: PESVProgramBudgetItem[];
  // 7. Mecanismos de seguimiento
  mecanismosSeguimiento: string;
  frecuenciaSeguimiento: string;
  responsableSeguimiento: string;
  mecanismosLista?: PESVProgramFollowUpItem[];
  actividades: PESVProgramActivity[];
}

export interface CommitteeMember {
  id: string;
  nombre: string;
  cargo: string;
  rolComite: 'Presidente' | 'Secretario' | 'Vocal' | 'Representante de Conductores' | 'Asesor Externo';
  email: string;
  firma: string;
  firmado: boolean;
}

export interface CommitteeMeetingCommitment {
  id: string;
  tarea: string;
  responsable: string;
  fechaLimite: string;
}

export interface CommitteeMeeting {
  id: string;
  numeroActa: string;
  fecha: string;
  temasDiscutidos: string;
  compromisos: CommitteeMeetingCommitment[];
  asistentesIds: string[];
}

export interface ManagerChecklistItem {
  id: string;
  letra: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
  descripcion: string;
  cumple: 'Sí' | 'No' | 'Parcial';
  observaciones: string;
}

export interface PESVUser {
  email: string;
  role: 'SUPER_ADMIN' | 'PESV_ADMIN';
  companyId?: string;
  name?: string;
}

export interface PESVCompany {
  id: string;
  name: string;
  nit: string;
  logo: string; // Base64 or elegant initial avatar info
  config: CompanyConfig;
  adminEmail: string;
  adminPassword?: string;
}

export interface PESVTrainingIntegrationConfig {
  enabled: boolean;
  appUrl: string;
  appName: string;
  apiKey?: string;
  webhookSecret?: string;
  autoSync: boolean;
  syncIntervalHours: number;
  lastSyncDate?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage?: string;
  totalSyncedCourses?: number;
  totalSyncedDrivers?: number;
  totalCertificatesIssued?: number;
}

export interface PESVTrainingSession {
  id: string;
  codigoCurso: string;
  nombreCurso: string;
  moduloObligatorio: 'Manejo Defensivo' | 'Mecánica Básica' | 'Normas de Tránsito' | 'Primeros Auxilios' | 'Fatiga y Velocidad' | 'Emergencias en Vía' | 'General';
  fecha: string;
  instructorOEntidad: string;
  duracionHoras: number;
  modalidad: 'Virtual / E-learning' | 'Presencial' | 'Práctica en Vía' | 'Mixta';
  totalConductoresCitados: number;
  totalConductoresAsistentes: number;
  totalConductoresAprobados: number;
  origen: 'Aplicativo Externo LMS' | 'Manual' | 'API Webhook';
  urlCertificados?: string;
  estado: 'Programada' | 'En Proceso' | 'Ejecutada' | 'Cancelada';
  temarioResumen?: string;
}

export interface PESVDriverCompetencyProfile {
  id: string;
  cargo: string;
  tipoLicencia: string;
  escolaridadMinima: string;
  experienciaMinimaMeses: number;
  examenTeoricoRequerido: boolean;
  examenPracticoRequerido: boolean;
  examenMedicoRequerido?: string;
  cursosObligatorios: string[];
  frecuenciaReentrenamientoMeses: number;
  observaciones?: string;
}


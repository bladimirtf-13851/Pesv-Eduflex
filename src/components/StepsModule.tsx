/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PESVStep, CompanyConfig, PESVLevel, RiskMatrixItem, PESVObjective, ObjectiveYearValue, PESVRiskProgram, PESVProgramActivity, CommitteeMember, CommitteeMeetingCommitment, CommitteeMeeting, ManagerChecklistItem, PESVAnnualPlanActivity } from '../types';
import { PESV_STEPS, SEED_DRIVERS, PESV_OFFICIAL_INDICATORS } from '../data';
import { 
  ClipboardList, Sparkles, FileText, CheckCircle2, ChevronRight, ChevronLeft, Download, Printer, 
  User, Users, Building, AlertTriangle, Info, PenTool, Upload, Trash2, Check, Plus, 
  MapPin, Calendar, Activity, Shield, Truck, Clock, Target, BarChart2, Edit, Edit3, 
  Filter, Search, RotateCcw, CheckSquare, Layers, Eye, DollarSign, CalendarDays, ArrowRight,
  ExternalLink, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { 
  exportActaNombramientoPDF, 
  exportPoliticaPDF, 
  exportComiteActaPDF, 
  exportCompromisoGerentePDF, 
  exportPlanAnualPDF 
} from '../utils/pesvPdfGenerator';
import { subscribeToAnnualPlan, saveAnnualPlanToFirestore, saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';
import Step10TrainingModule from './Step10TrainingModule';
import Step11PublicPortalModal from './Step11PublicPortalModal';
import Step12EmergencyModule from './Step12EmergencyModule';
import Step14SafeRoadsModule from './Step14SafeRoadsModule';
import Step15TripPlanningModule from './Step15TripPlanningModule';
import Step16And17MaintenanceModule from './Step16And17MaintenanceModule';
import Step20IndicatorsModule from './Step20IndicatorsModule';

interface StepsModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
  onNavigateToIndicators?: () => void;
}

export default function StepsModule({
  config,
  companyName: propCompanyName,
  companyNit = '901.452.883-1',
  companyLogo = '',
  onNavigateToIndicators
}: StepsModuleProps) {
  const [selectedPhase, setSelectedPhase] = useState<number | 'ALL'>('ALL');
  const [activeStep, setActiveStep] = useState<PESVStep | null>(PESV_STEPS[0]);
  const [hideOptional, setHideOptional] = useState<boolean>(true);
  const isImageLogo = Boolean(companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http')));

  // Cross-module Navigation Listener (e.g. from Indicators Tab to Paso 7)
  useEffect(() => {
    const handleActivateStep = (e: any) => {
      const targetId = e?.detail?.stepId || Number(localStorage.getItem('pesv_target_step_id'));
      if (targetId) {
        const step = PESV_STEPS.find(s => s.id === targetId);
        if (step) {
          setActiveStep(step);
          localStorage.removeItem('pesv_target_step_id');
        }
      }
    };
    window.addEventListener('pesv_activate_step', handleActivateStep);

    // Mount check
    const pendingStepId = localStorage.getItem('pesv_target_step_id');
    if (pendingStepId) {
      const step = PESV_STEPS.find(s => s.id === Number(pendingStepId));
      if (step) {
        setActiveStep(step);
        localStorage.removeItem('pesv_target_step_id');
      }
    }

    return () => window.removeEventListener('pesv_activate_step', handleActivateStep);
  }, []);

  // Auto-Policy Generator & Editor State
  const [companyName, setCompanyName] = useState<string>(propCompanyName || 'Transportes Integrados de Colombia S.A.S.');

  useEffect(() => {
    if (propCompanyName && propCompanyName !== 'Empresa Principal') {
      setCompanyName(propCompanyName);
    }
  }, [propCompanyName]);

  const [repLegal, setRepLegal] = useState<string>('Ing. Diana Patricia Osorio');
  const [policyDate, setPolicyDate] = useState<string>('2026-06-25');
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>([
    'Velocidad máxima de 80 km/h en carreteras nacionales y 30 km/h en zonas urbanas.',
    'Política de Cero Alcohol, Drogas y Sustancias Psicoactivas.',
    'Prohibición estricta del uso de dispositivos de comunicación bidireccional mientras se conduce.',
    'Uso obligatorio de Equipos de Protección Personal (EPP) y cinturón de seguridad.'
  ]);
  const [generatedPolicy, setGeneratedPolicy] = useState<boolean>(true); // default true for preview
  const [policyCustomText, setPolicyCustomText] = useState<string>(
    'En nuestra organización declaramos nuestro firme compromiso con la preservación de la vida, la integridad física de nuestros conductores, contratistas y terceros actores de la vía. En cumplimiento de la Resolución 40595 de 2022 de la República de Colombia, nos obligamos a planificar, ejecutar y evaluar controles operacionales dirigidos a eliminar o mitigar la probabilidad de siniestros viales de origen laboral. Esta política será divulgada y revisada anualmente bajo el ciclo PHVA.'
  );
  const [repSignatureImg2, setRepSignatureImg2] = useState<string>(''); // base64 signature for policy

  // Paso 1: Acta de Nombramiento
  const [leaderName, setLeaderName] = useState<string>('Ing. Carlos Andrés Restrepo');
  const [leaderId, setLeaderId] = useState<string>('CC 1.036.782.112');
  const [leaderLicense, setLeaderLicense] = useState<string>('SST-2024-5432');
  const [leaderLicenseExpiry, setLeaderLicenseExpiry] = useState<string>('2028-12-31');
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-06-25');
  const [actaNumber, setActaNumber] = useState<string>('ACTA-PESV-001-2026');
  const [actaCustomIntro, setActaCustomIntro] = useState<string>(
    'Por medio del presente documento, la alta dirección de la empresa designa formalmente al líder del diseño, implementación, seguimiento y mejora del Plan Estratégico de Seguridad Vial (PESV) de acuerdo con lo establecido en el Paso 1 de la Resolución 40595 de 2022. El líder designado contará con el apoyo directo de la gerencia para coordinar y supervisar todas las actividades de seguridad vial.'
  );
  const [actaResponsibilities, setActaResponsibilities] = useState<string>(
    '1. Diseñar, planificar e implementar las fases del PESV en la organización.\n2. Coordinar el Comité de Seguridad Vial y reportar mensualmente a la Gerencia General.\n3. Recopilar y analizar la información de la línea base y los indicadores de siniestralidad viales.\n4. Promover campañas de sensibilización, hábitos seguros y capacitaciones operativas continuas.\n5. Vigilar el cumplimiento de las inspecciones preoperacionales y programas preventivos.'
  );
  
  const [leaderSignatureImg, setLeaderSignatureImg] = useState<string>(''); // base64 string
  const [repSignatureImg1, setRepSignatureImg1] = useState<string>(''); // base64 string
  const [generatedActa, setGeneratedActa] = useState<boolean>(true); // default true for preview

  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSignature: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSignature(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Self-Diagnostic Checklist State
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, boolean>>({
    q1: true, q2: true, q3: false, q4: true, q5: false, q6: false, q7: true, q8: true
  });

  // --- Paso 8: Plan Anual de Trabajo (Resolución 40595 de 2022) ---
  const SEED_PLAN_ACTIVITIES: PESVAnnualPlanActivity[] = [
    {
      id: 'ACT-001',
      actividad: 'Actualización y divulgación de la Política de Seguridad Vial',
      responsable: 'Representante Legal / Líder PESV',
      recursos: 'Humano / Sala de Capacitación y Carteleras Institucionales',
      fechaInicio: '2026-01-10',
      fechaFin: '2026-01-30',
      estado: 'Ejecutado',
      fase: 'Planificación',
      observaciones: 'Publicada en sede principal y firmada por Gerencia.'
    },
    {
      id: 'ACT-002',
      actividad: 'Actualización de la Matriz de Identificación de Peligros y Evaluación de Riesgos Viales (IPER)',
      responsable: 'Líder PESV / Asesor SST',
      recursos: 'Técnico / Formato Matriz IPER y Asesoría ARL',
      fechaInicio: '2026-02-01',
      fechaFin: '2026-02-28',
      estado: 'Ejecutado',
      fase: 'Planificación',
      observaciones: 'Matriz validada con la participación del 100% de conductores.'
    },
    {
      id: 'ACT-003',
      actividad: 'Programa de Capacitación y Formación Vial: Manejo Defensivo y Res. 40595',
      responsable: 'Coordinador de Capacitación',
      recursos: 'Financiero: $2.500.000 / Plataforma Virtual y Aula',
      fechaInicio: '2026-03-01',
      fechaFin: '2026-04-30',
      estado: 'Ejecutado',
      fase: 'Implementación',
      observaciones: '95% de asistencia aprobada y evaluada.'
    },
    {
      id: 'ACT-004',
      actividad: 'Inspección Preoperacional Diaria y Control de Equipos de Carretera',
      responsable: 'Conductores / Supervisor de Patio',
      recursos: 'Tecnológico / Formato digital en App y Listas de chequeo',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
      estado: 'En proceso',
      fase: 'Implementación',
      observaciones: 'Ejecución diaria continua antes del primer encendido.'
    },
    {
      id: 'ACT-005',
      actividad: 'Ejecución del Plan de Mantenimiento Preventivo Bimestral de Flota',
      responsable: 'Jefe de Mantenimiento / Taller Aliado',
      recursos: 'Financiero: $12.000.000 / Taller Autorizado y Repuestos',
      fechaInicio: '2026-01-15',
      fechaFin: '2026-12-15',
      estado: 'En proceso',
      fase: 'Implementación',
      observaciones: 'Rutinas de 5.000 y 10.000 km al día.'
    },
    {
      id: 'ACT-006',
      actividad: 'Jornada de Pruebas de Alcoholimetría y Sustancias Psicoactivas Sorpresa',
      responsable: 'Líder PESV / Enfermería Ocupacional',
      recursos: 'Técnico / Alcosensor calibrado y Boquillas ($800.000)',
      fechaInicio: '2026-05-10',
      fechaFin: '2026-06-20',
      estado: 'Ejecutado',
      fase: 'Implementación',
      observaciones: '100% de pruebas con resultado negativo.'
    },
    {
      id: 'ACT-007',
      actividad: 'Simulacro Anual de Respuesta a Emergencias y Siniestros Viales',
      responsable: 'Brigada de Emergencia / Comité PESV',
      recursos: 'Logístico / Extintores, Botiquines, Apoyo Policía de Tránsito',
      fechaInicio: '2026-08-15',
      fechaFin: '2026-08-30',
      estado: 'Planeada',
      fase: 'Implementación',
      observaciones: 'Programado para el segundo semestre en patio principal.'
    },
    {
      id: 'ACT-008',
      actividad: 'Auditoría Interna Anual del PESV conforme a los 24 Pasos Res. 40595',
      responsable: 'Auditor Interno Certificado / Comité PESV',
      recursos: 'Humano / Lista de chequeo y 16 horas de auditoría',
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-30',
      estado: 'Planeada',
      fase: 'Seguimiento',
      observaciones: 'Verificación integral de evidencias documentales y operativas.'
    },
    {
      id: 'ACT-009',
      actividad: 'Revisión por la Alta Dirección y Evaluación Anual de Indicadores',
      responsable: 'Gerente General / Representante Legal',
      recursos: 'Sala de Juntas / Informe consolidado de gestión vial',
      fechaInicio: '2026-11-15',
      fechaFin: '2026-11-30',
      estado: 'Planeada',
      fase: 'Mejora',
      observaciones: 'Definición de planes de mejora continua para el siguiente ciclo.'
    }
  ];

  const [annualPlanActivities, setAnnualPlanActivities] = useState<PESVAnnualPlanActivity[]>(() => {
    const saved = localStorage.getItem('pesv_annual_plan_activities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_PLAN_ACTIVITIES;
  });

  const [newPlanActivity, setNewPlanActivity] = useState<Omit<PESVAnnualPlanActivity, 'id'>>({
    actividad: '',
    responsable: '',
    recursos: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Planeada',
    fase: 'Planificación',
    observaciones: ''
  });
  const [editingPlanActivityId, setEditingPlanActivityId] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<'TODOS' | 'Planeada' | 'En proceso' | 'Ejecutado'>('TODOS');
  const [planFaseFilter, setPlanFaseFilter] = useState<string>('TODAS');
  const [planSearch, setPlanSearch] = useState<string>('');
  const [showPlanForm, setShowPlanForm] = useState<boolean>(false);
  const [showPlanPrintPreview, setShowPlanPrintPreview] = useState<boolean>(false);

  useEffect(() => {
    // Listen to real-time changes in Firestore for Annual Plan (Paso 8)
    const unsubscribe = subscribeToAnnualPlan('global_plan', (cloudActivities) => {
      if (cloudActivities && cloudActivities.length > 0) {
        setAnnualPlanActivities(cloudActivities);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pesv_annual_plan_activities', JSON.stringify(annualPlanActivities));
    saveAnnualPlanToFirestore('global_plan', annualPlanActivities).catch(err => {
      console.error('Error saving plan to Firestore:', err);
    });
  }, [annualPlanActivities]);

  // --- Paso 4: Esquema de Información del Diagnóstico (Resolución 40595) ---
  const [activeDiagTab, setActiveDiagTab] = useState<'sedes' | 'contratistas' | 'colaboradores' | 'vehiculos' | 'rutas' | 'emergencias'>('sedes');
  
  // a) Sedes y Servicios
  const [sedesList, setSedesList] = useState([
    { id: 1, nombre: 'Sede Principal Bogotá', ciudad: 'Bogotá D.C.', direccion: 'Av. El Dorado #68C-20', personal: 120, servicios: 'Operaciones de despacho y transporte nacional de carga pesada.' },
    { id: 2, nombre: 'Sucursal Medellín', ciudad: 'Medellín (Antioquia)', direccion: 'Calle 10 #43E-15', personal: 45, servicios: 'Distribución urbana de mercancías de última milla.' },
    { id: 3, nombre: 'Terminal Cali', ciudad: 'Cali (Valle del Cauca)', direccion: 'Av. 3 Norte #30N-10', personal: 30, servicios: 'Almacenamiento, logística regional y mensajería en motocicleta.' }
  ]);
  const [newSede, setNewSede] = useState({ nombre: '', ciudad: '', direccion: '', personal: 5, servicios: '' });
  const [editingSedeId, setEditingSedeId] = useState<number | null>(null);

  // b) Contratistas
  const [contratistasList, setContratistasList] = useState([
    { id: 1, razonSocial: 'Enlaces Logísticos Express S.A.S.', nit: '900.543.210-4', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 12, viajesMes: 180 },
    { id: 2, razonSocial: 'Servicios de Tránsito de Colombia Ltda.', nit: '860.112.334-9', tipoContrato: 'Permanente', tipoFlota: 'Outsourcing', vehiculos: 5, viajesMes: 60 },
    { id: 3, razonSocial: 'Pedro Alcides Moreno Prada', nit: 'CC 79.845.223', tipoContrato: 'Ocasional', tipoFlota: 'Persona Natural (Vehículo Propio)', vehiculos: 1, viajesMes: 15 },
    { id: 4, razonSocial: 'Cooperativa Trans-Andina', nit: '800.224.551-0', tipoContrato: 'Ocasional', tipoFlota: 'Afiliados', vehiculos: 8, viajesMes: 45 }
  ]);
  const [newContratista, setNewContratista] = useState({ razonSocial: '', nit: '', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 1, viajesMes: 10 });
  const [editingContratistaId, setEditingContratistaId] = useState<number | null>(null);

  // c) Colaboradores
  const [colaboradoresList, setColaboradoresList] = useState(() => {
    const saved = localStorage.getItem('pesv_drivers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map((d: any, idx: number) => {
            return {
              id: d.id || `col-${idx}`,
              nombre: d.name,
              cedula: d.cedula,
              genero: d.gender || (d.name.includes('Martha') || d.name.includes('Ángela') || d.name.includes('Sandra') ? 'Femenino' : 'Masculino'),
              fechaNacimiento: d.dob || (d.name === 'Carlos Alberto Restrepo' ? '1982-04-12' : d.name === 'Juan Fernando Montoya' ? '1988-08-24' : '1992-05-14'),
              cargo: d.role,
              escolaridad: d.education || 'Bachiller Técnico',
              estadoCivil: d.civilStatus || 'Casado',
              rolConductor: 'SÍ',
              licencia: `${d.licenseCategory || 'C2'} (Vence ${d.licenseExpiry})`,
              capacitaciones: d.trainingCourses && d.trainingCourses.length > 0 
                ? d.trainingCourses.map((c: any) => `${c.name} (${c.status})`).join(', ') 
                : 'Manejo Defensivo y Seguridad Vial (Resol. 40595) (Aprobado)',
              evalCompetencia: d.documentStatus === 'Vencido' ? 'No Aprobado' : 'Aprobado',
              siniestros: d.siniestros || 0,
              infracciones: d.name === 'Juan Fernando Montoya' ? '1 Infracción (Exceso de velocidad - PENDIENTE)' : 'Ninguna',
              medioTransporte: d.license && d.license.toLowerCase().includes('moto') ? 'Motocicleta Propia' : 'Vehículo de la empresa',
              tipoVehiculoConduce: d.license || 'Automóvil SUV',
              fechaVinculacion: d.vinculationDate || '2021-06-18',
              soatExpiry: d.soatExpiry || '2026-11-20',
              tecnoExpiry: d.tecnoExpiry || '2026-08-30'
            };
          });
        }
      } catch (e) {
        // Fallback
      }
    }
    // Default seed perfectly consistent with SEED_DRIVERS
    return [
      { 
        id: 'D01', 
        nombre: 'Carlos Alberto Restrepo', 
        cedula: 'CC 71.345.890', 
        genero: 'Masculino', 
        fechaNacimiento: '1982-04-12', 
        cargo: 'Conductor Carga Camión Pesado', 
        escolaridad: 'Bachiller Técnico', 
        estadoCivil: 'Casado', 
        rolConductor: 'SÍ', 
        licencia: 'C2 (Vence 2026-07-15)', 
        soatExpiry: '2026-11-20',
        tecnoExpiry: '2026-08-30',
        capacitaciones: 'Manejo Defensivo y Seguridad Vial (Aprobado), Primeros Auxilios en Vía (Aprobado), Inspección Preoperacional de Equipos (Aprobado)', 
        evalCompetencia: 'Aprobado', 
        siniestros: 0, 
        infracciones: 'Ninguna', 
        medioTransporte: 'Vehículo de la empresa', 
        tipoVehiculoConduce: 'C2 - Camiones Rígidos', 
        fechaVinculacion: '2020-03-15' 
      },
      { 
        id: 'D02', 
        nombre: 'Juan Fernando Montoya', 
        cedula: 'CC 10.223.441', 
        genero: 'Masculino', 
        fechaNacimiento: '1988-08-24', 
        cargo: 'Conductor Pasajeros Van', 
        escolaridad: 'Secundaria Completa', 
        estadoCivil: 'Unión Libre', 
        rolConductor: 'SÍ', 
        licencia: 'C1 (Vence 2025-12-10)', 
        soatExpiry: '2026-05-15',
        tecnoExpiry: '2026-04-10',
        capacitaciones: 'Manejo Defensivo y Seguridad Vial (Aprobado), Manejo de Fatiga y Prevención del Sueño (Reprobado)', 
        evalCompetencia: 'No Aprobado', 
        siniestros: 0, 
        infracciones: '1 Infracción (Exceso de velocidad - PENDIENTE)', 
        medioTransporte: 'Vehículo de la empresa', 
        tipoVehiculoConduce: 'C1 - Automóviles / Camionetas Públicas', 
        fechaVinculacion: '2021-06-18' 
      },
      { 
        id: 'D03', 
        nombre: 'Ángela María Gómez', 
        cedula: 'CC 43.120.944', 
        genero: 'Femenino', 
        fechaNacimiento: '1992-05-14', 
        cargo: 'Conductora de Distribución Moto', 
        escolaridad: 'Técnico Logística', 
        estadoCivil: 'Soltera', 
        rolConductor: 'SÍ', 
        licencia: 'A2 (Vence 2029-05-18)', 
        soatExpiry: '2027-01-10',
        tecnoExpiry: '2026-12-15',
        capacitaciones: 'Manejo Defensivo y Seguridad Vial (Aprobado), Normatividad de Tránsito y Código Penal (Aprobado)', 
        evalCompetencia: 'Aprobado', 
        siniestros: 0, 
        infracciones: 'Ninguna', 
        medioTransporte: 'Motocicleta Propia', 
        tipoVehiculoConduce: 'A2 - Motocicletas de alto cilindraje', 
        fechaVinculacion: '2023-02-10' 
      },
      { 
        id: 'D04', 
        nombre: 'Andrés Felipe Caicedo', 
        cedula: 'CC 94.887.210', 
        genero: 'Masculino', 
        fechaNacimiento: '1985-11-30', 
        cargo: 'Conductor Tractocamión Cabezote', 
        escolaridad: 'Bachiller', 
        estadoCivil: 'Casado', 
        rolConductor: 'SÍ', 
        licencia: 'C3 (Vence 2028-09-02)', 
        soatExpiry: '2026-07-04',
        tecnoExpiry: '2026-07-10',
        capacitaciones: 'Manejo Defensivo y Seguridad Vial (Aprobado), Operación e Inspección Mecánica Avanzada (Aprobado)', 
        evalCompetencia: 'Aprobado', 
        siniestros: 0, 
        infracciones: 'Ninguna', 
        medioTransporte: 'Vehículo de la empresa', 
        tipoVehiculoConduce: 'C3 - Tractocamiones y articulados', 
        fechaVinculacion: '2022-10-05' 
      },
      { 
        id: 'D05', 
        nombre: 'Martha Liliana Beltrán', 
        cedula: 'CC 52.890.312', 
        genero: 'Femenino', 
        fechaNacimiento: '1979-09-15', 
        cargo: 'Coordinador Administrativo (Conduce vehículo corporativo)', 
        escolaridad: 'Profesional', 
        estadoCivil: 'Casada', 
        rolConductor: 'SÍ', 
        licencia: 'B1 (Vence 2031-10-30)', 
        soatExpiry: '2027-03-25',
        tecnoExpiry: '2027-04-05',
        capacitaciones: 'Manejo Defensivo y Seguridad Vial (Aprobado)', 
        evalCompetencia: 'Aprobado', 
        siniestros: 0, 
        infracciones: 'Ninguna', 
        medioTransporte: 'Automóvil Particular', 
        tipoVehiculoConduce: 'B1 - Automóviles particulares', 
        fechaVinculacion: '2019-04-12' 
      }
    ];
  });

  // Sync back to localStorage to bridge with IntegrationsModule
  React.useEffect(() => {
    const mappedDrivers = colaboradoresList.map((col: any) => {
      let licenseCategory = 'C2';
      let licenseExpiry = '2026-12-31';
      if (col.licencia) {
        const match = col.licencia.match(/^([A-Z0-9]+)\s*\(Vence\s*([^)]+)\)/i);
        if (match) {
          licenseCategory = match[1];
          licenseExpiry = match[2];
        } else {
          // If the format doesn't have "Vence", extract any alphanumeric sequence at start
          const startMatch = col.licencia.match(/^([A-Z0-9]+)/i);
          if (startMatch) licenseCategory = startMatch[1];
        }
      }

      const isExpired = new Date(licenseExpiry) < new Date('2026-06-25');
      const isExpiring = new Date(licenseExpiry) < new Date('2026-07-25');
      const documentStatus = isExpired ? 'Vencido' : isExpiring ? 'Próximo a vencer' : 'Vigente';

      return {
        id: String(col.id),
        name: col.nombre,
        cedula: col.cedula,
        license: col.tipoVehiculoConduce || 'Camión Rígido',
        licenseCategory: licenseCategory,
        licenseExpiry: licenseExpiry,
        soatExpiry: '2026-11-20',
        tecnoExpiry: '2026-08-30',
        role: col.cargo,
        isContracted: true,
        documentStatus: documentStatus,
        trainingCourses: col.capacitaciones && typeof col.capacitaciones === 'string'
          ? col.capacitaciones.split(',').map((courseStr: string, idx: number) => {
              const name = courseStr.trim();
              return {
                id: `C-${idx}`,
                name: name,
                date: '2026-06-01',
                durationHours: 16,
                grade: 4.8,
                status: 'Aprobado' as const
              };
            })
          : []
      };
    });
    localStorage.setItem('pesv_drivers', JSON.stringify(mappedDrivers));
  }, [colaboradoresList]);
  const [newColaborador, setNewColaborador] = useState({
    nombre: '', cedula: '', genero: 'Masculino', fechaNacimiento: '1995-01-01', cargo: '', escolaridad: 'Profesional', estadoCivil: 'Soltero',
    rolConductor: 'SÍ', licencia: '', soatExpiry: '2027-06-25', tecnoExpiry: '2027-06-25', capacitaciones: '', evalCompetencia: 'Aprobado', siniestros: 0, infracciones: 'Ninguna',
    medioTransporte: 'Vehículo de la empresa', tipoVehiculoConduce: 'Automóvil SUV', fechaVinculacion: '2026-01-01'
  });
  const [editingColaboradorId, setEditingColaboradorId] = useState<string | number | null>(null);

  // d) Vehículos
  const [vehiculosList, setVehiculosList] = useState([
    { 
      id: 1, 
      placa: 'JKS-284', 
      tipo: 'Automotor', 
      clase: 'Tractocamión Kenworth', 
      vin: '1NKD5D9X7JR23485', 
      motor: 'ISX15-450', 
      kilometraje: 482500, 
      fabricacion: 2018, 
      especificaciones: 'Diésel 15 Litros, Tracción 6x4, Freno ABS', 
      soatVence: '2027-01-15', 
      rtmVence: '2026-11-20', 
      siniestros: 0, 
      mantenimientoPlan: 'Al Día (Cada 15,000 km)', 
      mantenimientoControl: 'Preventivo regular de motor e inyectores', 
      kmMesEstimado: 4500 
    },
    { 
      id: 2, 
      placa: 'WHZ-885', 
      tipo: 'Automotor', 
      clase: 'Motocicleta Yamaha FZ25', 
      vin: '9C2RG1520M001258', 
      motor: 'G3E4E-04820', 
      kilometraje: 32400, 
      fabricacion: 2021, 
      especificaciones: 'Monocilíndrica 249cc, Inyección Electrónica', 
      soatVence: '2026-09-08', 
      rtmVence: '2026-08-14', 
      siniestros: 1, 
      mantenimientoPlan: 'Al Día (Cada 3,000 km)', 
      mantenimientoControl: 'Cambio de kit de arrastre y pastillas de freno', 
      kmMesEstimado: 1200 
    },
    { 
      id: 3, 
      placa: 'REM-202', 
      tipo: 'No Automotor', 
      clase: 'Remolque Plataforma de 3 Ejes', 
      vin: '936PL3X94K004523', 
      motor: 'No Aplica', 
      kilometraje: 280000, 
      fabricacion: 2019, 
      especificaciones: 'Capacidad 35 Toneladas, Suspensión Neumática', 
      soatVence: 'No Aplica', 
      rtmVence: '2026-10-05', 
      siniestros: 0, 
      mantenimientoPlan: 'Al Día (Cada 20,000 km)', 
      mantenimientoControl: 'Revisión y engrase de ejes, cambio de bandas', 
      kmMesEstimado: 3200 
    }
  ]);
  const [newVehiculo, setNewVehiculo] = useState({
    placa: '', tipo: 'Automotor', clase: '', vin: '', motor: '', kilometraje: 0, fabricacion: 2022, especificaciones: '', soatVence: '2027-01-01', rtmVence: '2027-01-01', siniestros: 0, mantenimientoPlan: 'Al Día', mantenimientoControl: 'Preventivo regular', kmMesEstimado: 1000
  });
  const [editingVehiculoId, setEditingVehiculoId] = useState<number | null>(null);

  // e) Rutas
  const [rutasList, setRutasList] = useState([
    { id: 1, nombre: 'Corredor Troncal de Occidente', origen: 'Bogotá D.C.', destino: 'Medellín (Antioquia)', distancia: 415, frecuencia: '24 veces al mes', viaPrincipal: 'Autopista de doble calzada y montaña' },
    { id: 2, nombre: 'Distribución Urbana Bogotá', origen: 'Sede Principal El Dorado', destino: 'Red Metropolitana Urbana', distancia: 45, frecuencia: 'Diaria (6 veces por semana)', viaPrincipal: 'Vías arterias urbanas metropolitanas' },
    { id: 3, nombre: 'Corredor Puerto Buenaventura', origen: 'Sede Industrial Cali', destino: 'Buenaventura (Puerto)', distancia: 120, frecuencia: '12 veces al mes', viaPrincipal: 'Vía nacional doble calzada de alta densidad' }
  ]);
  const [newRuta, setNewRuta] = useState({ nombre: '', origen: '', destino: '', distancia: 10, frecuencia: 'Semanal', viaPrincipal: '' });
  const [editingRutaId, setEditingRutaId] = useState<number | null>(null);

  // f) Emergencias y Simulacros
  const [emergenciasCapacitados, setEmergenciasCapacitados] = useState<number>(18);
  const [primerosAuxiliosList, setPrimerosAuxiliosList] = useState([
    { id: 1, equipo: 'Botiquines Tipo B Fijos', cantidad: '3 unidades', descripcion: 'Fijos en muro en Sede Principal, Sucursal Medellín y Terminal Cali, completamente equipados.' },
    { id: 2, equipo: 'Botiquines de Carretera Reglamentarios', cantidad: '39 unidades', descripcion: 'Un botiquín individual reglamentario tipo A a bordo de cada vehículo de la flota activa.' },
    { id: 3, equipo: 'Extintores ABC Multiproposito', cantidad: '39 unidades', descripcion: 'Extintores de polvo químico ABC de 10 lbs recargados y vigentes en toda la flota.' },
    { id: 4, equipo: 'Camillas de Emergencia Espina Dorsal', cantidad: '3 unidades', descripcion: 'Camillas rígidas de madera/polietileno con arnés de seguridad e inmovilizador de cuello.' }
  ]);
  const [newEquipo, setNewEquipo] = useState({ equipo: '', cantidad: '', descripcion: '' });
  const [editingEquipoId, setEditingEquipoId] = useState<number | null>(null);

  const [simulacrosList, setSimulacrosList] = useState([
    { id: 1, tipo: 'Colisión de camión con derrame menor de combustible', fecha: '2025-11-12', observaciones: 'Simulación exitosa de respuesta inmediata. Se evaluó el uso de kit de derrames químicos y protocolo PAS.' },
    { id: 2, tipo: 'Evacuación de sede principal por sismo con lesionado vial', fecha: '2026-03-20', observaciones: 'Se coordinó con brigada interna y se articuló la respuesta con ambulancia externa en 7 minutos de reloj.' }
  ]);
  const [newSimulacro, setNewSimulacro] = useState({ tipo: '', fecha: '2026-06-01', observaciones: '' });
  const [editingSimulacroId, setEditingSimulacroId] = useState<number | null>(null);

  // PASO 5 / STEP 5 (Caracterización, evaluación y control de riesgos) States
  const [risksList, setRisksList] = useState<RiskMatrixItem[]>([
    {
      id: 1,
      actividad: 'Distribución de mercancías de última milla',
      productoServicio: 'Entrega de paquetes y carga urbana',
      riesgo: 'Colisión con terceros o atropello de peatón en vía urbana',
      impacto: 'Lesiones graves, fatalidad, incapacidad médica, daños a vehículos de la flota y perjuicios civiles',
      actorVial: 'Conductor',
      factorSeguridad: 'Comportamiento seguro',
      variableRiesgo: 'Comportamiento: distracción por uso de celular o fatiga acumulada',
      exposicion: 3,
      probabilidad: 2,
      nivelRiesgoValor: 6,
      nivelRiesgoCategoria: 'Crítico',
      accionTratamiento: 'Modificar factores',
      controlesPropuestos: 'Bloqueo por software de celulares corporativos en movimiento, programación de jornadas de máximo 8 horas con pausas activas obligatorias guiadas de 15 minutos.'
    },
    {
      id: 2,
      actividad: 'Visita de supervisión y asesoría comercial',
      productoServicio: 'Asesoramiento técnico en campo',
      riesgo: 'Caída de motocicleta por pérdida de adherencia en vías secundarias húmedas o con gravilla',
      impacto: 'Lesiones corporales del asesor, traumatismo craneoencefálico, inactividad laboral',
      actorVial: 'Motociclista',
      factorSeguridad: 'Vehículos seguros',
      variableRiesgo: 'Vehículos: deficiencias en la inspección preoperacional de neumáticos y frenos',
      exposicion: 2,
      probabilidad: 3,
      nivelRiesgoValor: 6,
      nivelRiesgoCategoria: 'Crítico',
      accionTratamiento: 'Eliminar la fuente que lo ocasiona',
      controlesPropuestos: 'Sustitución de desplazamientos en motocicleta por camionetas contratadas para zonas rurales difíciles; inspección preoperacional digital estricta con bloqueo de asignación si la labranza es menor de 2mm.'
    },
    {
      id: 3,
      actividad: 'Operación nacional de tractocamiones de carga',
      productoServicio: 'Transporte de materias primas intermunicipal',
      riesgo: 'Pérdida de control del vehículo por exceso de velocidad en pendientes pronunciadas',
      impacto: 'Volcamiento, colisión múltiple, muerte del conductor y terceros, pérdida total de la carga',
      actorVial: 'Conductor',
      factorSeguridad: 'Velocidades seguras',
      variableRiesgo: 'Velocidad: exceso de velocidad y deficiente espacio de seguridad en frenado',
      exposicion: 3,
      probabilidad: 1,
      nivelRiesgoValor: 3,
      nivelRiesgoCategoria: 'Moderado',
      accionTratamiento: 'Modificar factores',
      controlesPropuestos: 'Instalación de limitador de velocidad físico a 80 km/h en camiones, monitoreo por GPS en tiempo real con alertas sonoras en cabina y auditorías aleatorias de telemetría.'
    },
    {
      id: 4,
      actividad: 'Desplazamiento casa-trabajo-casa del personal técnico',
      productoServicio: 'Mantenimiento preventivo en instalaciones de clientes',
      riesgo: 'Atropello o caída de ciclista por mal estado de la ciclo-infraestructura o maniobras imprudentes de vehículos mayores',
      impacto: 'Traumatismos múltiples, fracturas, secuelas permanentes',
      actorVial: 'Ciclista',
      factorSeguridad: 'Entorno o infraestructura vial',
      variableRiesgo: 'Viajes: errores en la planificación de rutas seguras y pobre análisis dinámico de riesgos',
      exposicion: 2,
      probabilidad: 2,
      nivelRiesgoValor: 4,
      nivelRiesgoCategoria: 'Moderado',
      accionTratamiento: 'Evitar',
      controlesPropuestos: 'Diseño de mapas de rutas seguras con ciclovías segregadas, suministro de chalecos reflectivos de alta visibilidad clase 3, cascos homologados y luces LED recargables.'
    },
    {
      id: 5,
      actividad: 'Desplazamiento peatonal en operaciones de cargue',
      productoServicio: 'Operaciones logísticas en muelles de despacho',
      riesgo: 'Arrollamiento de peatón por montacargas o camión en reversa en patios de maniobra',
      impacto: 'Aplastamiento, lesiones graves o fatales',
      actorVial: 'Peatón',
      factorSeguridad: 'Entorno o infraestructura vial',
      variableRiesgo: 'Viajes: falta de controles operacionales en patios y deficiente demarcación de senderos peatonales',
      exposicion: 2,
      probabilidad: 1,
      nivelRiesgoValor: 2,
      nivelRiesgoCategoria: 'Bajo',
      accionTratamiento: 'Eliminar la fuente que lo ocasiona',
      controlesPropuestos: 'Segregación física completa de zonas de peatones y patios de maniobra con barreras metálicas, alarmas de reversa obligatorias y de proximidad ultrasónicos en maquinaria.'
    }
  ]);

  const [newRisk, setNewRisk] = useState<Omit<RiskMatrixItem, 'id' | 'nivelRiesgoValor' | 'nivelRiesgoCategoria'>>({
    actividad: '',
    productoServicio: '',
    riesgo: '',
    impacto: '',
    actorVial: 'Conductor',
    factorSeguridad: 'Comportamiento seguro',
    variableRiesgo: 'Comportamiento: exceso de horas de conducción',
    exposicion: 2,
    probabilidad: 1,
    accionTratamiento: 'Modificar factores',
    controlesPropuestos: ''
  });

  const [riskFilterActor, setRiskFilterActor] = useState<string>('TODOS');
  const [riskFilterFactor, setRiskFilterFactor] = useState<string>('TODOS');
  const [editingRiskId, setEditingRiskId] = useState<number | null>(null);

  // PASO 7 / STEP 7 (Objetivos y metas del PESV) States
  const [objectivesList, setObjectivesList] = useState<PESVObjective[]>(() => {
    const saved = localStorage.getItem('pesv_objectives_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o: any) => {
            let ids = o.indicadoresOficialesIds;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
              if (o.indicadorOficialId) {
                ids = [o.indicadorOficialId];
              } else {
                ids = PESV_OFFICIAL_INDICATORS.filter(ind =>
                  (o.indicador && o.indicador.includes(ind.code)) || (o.meta && o.meta.includes(ind.code))
                ).map(ind => ind.id);
                if (ids.length === 0) {
                  if (o.id === 1) ids = [1, 5];
                  else if (o.id === 2) ids = [2];
                  else if (o.id === 3) ids = [3, 11];
                  else if (o.id === 4) ids = [6];
                  else ids = [1];
                }
              }
            }
            return {
              ...o,
              indicadoresOficialesIds: ids,
              indicadoresOficialesCodigos: ids.map((id: number) => PESV_OFFICIAL_INDICATORS.find(i => i.id === id)?.code || '').filter(Boolean)
            };
          });
        }
      } catch (e) {}
    }
    return [
      {
        id: 1,
        objetivo: 'Reducir la siniestralidad vial en la operación de transporte',
        meta: 'Reducir la tasa de siniestros viales TSV(n) a menos de 2.0 por millón de km y mitigar la severidad',
        indicador: 'TSV(n) = SV(tn) * 1.000.000 / Km(t) | IS = ((SVm + SVi + SVd) / SV(t-1)) * 100',
        unidadMedida: 'Siniestros',
        metaValor: 2,
        indicadoresOficialesIds: [1, 5],
        indicadoresOficialesCodigos: ['TSV(n)', 'IS'],
        valoresAnuales: [
          { year: 2024, value: 4 },
          { year: 2025, value: 3 },
          { year: 2026, value: 1.8 }
        ]
      },
      {
        id: 2,
        objetivo: 'Incrementar la cobertura de formación y capacitación vial',
        meta: 'Lograr una cobertura mínima del 95% de los conductores en hábitos seguros',
        indicador: 'CPF PESV = (CFSV(t) / CT(t)) * 100',
        unidadMedida: '%',
        metaValor: 95,
        indicadoresOficialesIds: [2],
        indicadoresOficialesCodigos: ['CPF PESV'],
        valoresAnuales: [
          { year: 2024, value: 72 },
          { year: 2025, value: 85 },
          { year: 2026, value: 96 }
        ]
      },
      {
        id: 3,
        objetivo: 'Asegurar la realización de inspecciones preoperacionales y control de riesgos críticos',
        meta: 'Garantizar que el 100% de la flota activa cuente con inspección preoperacional aprobada y control de factores de riesgo',
        indicador: 'IDP = (#VID / #TV) * 100 | CRV = (FRC_controlados / FRC_totales) * 100',
        unidadMedida: '%',
        metaValor: 100,
        indicadoresOficialesIds: [3, 11],
        indicadoresOficialesCodigos: ['IDP', 'CRV'],
        valoresAnuales: [
          { year: 2024, value: 78 },
          { year: 2025, value: 91 },
          { year: 2026, value: 99 }
        ]
      },
      {
        id: 4,
        objetivo: 'Cumplir con el plan de mantenimiento preventivo de vehículos',
        meta: 'Lograr un cumplimiento del 90% en la programación de mantenimiento preventivo',
        indicador: 'CPMVh = (MEVh(t) / MPVh(t)) * 100',
        unidadMedida: '%',
        metaValor: 90,
        indicadoresOficialesIds: [6],
        indicadoresOficialesCodigos: ['CPMVh'],
        valoresAnuales: [
          { year: 2024, value: 65 },
          { year: 2025, value: 82 },
          { year: 2026, value: 89 }
        ]
      }
    ];
  });

  // Sync objectives with localStorage and emit cross-module event
  useEffect(() => {
    localStorage.setItem('pesv_objectives_list', JSON.stringify(objectivesList));
    window.dispatchEvent(new Event('pesv_objectives_updated'));
  }, [objectivesList]);

  const [newObjective, setNewObjective] = useState<Omit<PESVObjective, 'id' | 'valoresAnuales'>>({
    objetivo: '',
    meta: '',
    indicador: '',
    unidadMedida: '%',
    metaValor: 90,
    indicadoresOficialesIds: []
  });

  // Multi-indicator selection state for Paso 7 Objective Form
  const [selectedFormIndicatorIds, setSelectedFormIndicatorIds] = useState<number[]>([]);
  const [showIndicatorChecklist, setShowIndicatorChecklist] = useState<boolean>(false);

  // Helper to jump directly from Paso 7 into measuring a specific indicator in Paso 20
  const navigateToIndicatorInStep20 = (indicatorId: number) => {
    localStorage.setItem('pesv_target_indicator_id', String(indicatorId));
    const step20 = PESV_STEPS.find(s => s.id === 20);
    if (step20) {
      setActiveStep(step20);
    } else if (onNavigateToIndicators) {
      onNavigateToIndicators();
    } else {
      window.dispatchEvent(new CustomEvent('pesv_navigate_tab', { detail: { tab: 'dashboard' } }));
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pesv_select_indicator', { detail: { indicatorId } }));
    }, 60);
  };

  const [tempYearValues, setTempYearValues] = useState<ObjectiveYearValue[]>([
    { year: 2024, value: 70 },
    { year: 2025, value: 80 },
    { year: 2026, value: 90 }
  ]);

  const [newYearInput, setNewYearInput] = useState<string>('2027');
  const [newValueInput, setNewValueInput] = useState<string>('');

  const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(null);
  const [selectedObjectiveForChart, setSelectedObjectiveForChart] = useState<number>(1);

  // PASO 8 (Programas de gestión de riesgos críticos y factores de desempeño) States
  const DEFAULT_RISK_PROGRAMS: PESVRiskProgram[] = [
    {
      id: 1,
      nombre: '1. Programa de Gestión de la Velocidad Segura',
      objetivoGeneral: 'Controlar, monitorear y reducir los excesos de velocidad de la flota de vehículos de la organización, promoviendo el cumplimiento de límites legales y seguros.',
      indicadorGeneral: 'GVE = (#VIP / #VDL) * 100 | ELVL = (#DLEV / #TDL) * 100',
      lineamientoBase: 'Política de Seguridad Vial del PESV (Paso 2): Compromiso directivo con el respeto irrestricto de los límites legales y operativos de velocidad bajo el enfoque de Sistema Seguro.',
      alcanceActores: 'Conductores de carga pesada, conductores de camionetas operativas y motociclistas en misión laboral o desplazamiento in-itinere.',
      alcanceVehiculos: '100% de la flota propia, contratista, fidelizada y vehículos de terceros puestos al servicio de la organización.',
      alcanceProcesos: 'Operaciones de transporte intermunicipal, distribución urbana de última milla, visitas comerciales y logística de despacho.',
      alcanceDescripcion: 'Aplica de forma transversal a todos los desplazamientos laborales en rutas nacionales, urbanas y patios de maniobra internos.',
      objetivoEspecifico: 'Reducir la siniestralidad vial asociada al exceso de velocidad, manteniendo los desplazamientos con sobrevelocidad por debajo del 1% y asegurando cobertura de monitoreo mayor al 95%.',
      metaMedible: 'Lograr GVE >= 95% de vehículos incluidos en el programa, mantener ELVL <= 1.0% de desplazamientos con exceso y aportar a la meta TSV(n) <= 2.0.',
      metaValor: 'ELVL <= 1.0% | GVE >= 95%',
      objetivoPaso7Id: 1,
      indicadoresMedicion: 'Indicador 7 (GVE: Cobertura Programa de Gestión Velocidad Empresarial), Indicador 8 (ELVL: Excesos Límite de Velocidad Laboral) e Indicador 1 (TSV(n): Tasa de Siniestros Viales).',
      formulaMedicion: 'GVE = (#VIP / #VDL) * 100  |  ELVL = (#DLEV / #TDL) * 100',
      frecuenciaMedicion: 'Mensual y Acumulado Anual',
      fuenteDatos: 'Plataforma de Telemetría Satelital GPS, Reportes de Geocercas y Consulta de Comparendos SIMIT.',
      indicadoresPaso20Ids: [7, 8, 1],
      factoresDesempeno: [
        'Evaluación de la gestión de la velocidad (Telemetría/GPS)',
        'Comportamiento y hábitos seguros del conductor',
        'Mantenimiento preventivo del sistema de frenos y velocímetro',
        'Planificación de rutas y límites máximos por corredor vial'
      ],
      descripcionFactoresDesempeno: 'Monitoreo continuo de excesos de velocidad por geocerca, análisis de frenadas bruscas, calibración de gobernadores de velocidad y evaluación comportamental de conductores.',
      presupuestoAsignado: 18500000,
      presupuestoEjecutado: 12400000,
      detallePresupuesto: 'Licenciamiento anual de telemetría GPS ($11.000.000), calibración de limitadores y sensores ($4.500.000), campañas pedagógicas y señalización ($3.000.000).',
      mecanismosSeguimiento: 'Auditoría semanal de reportes de telemetría GPS en centro de control, alertas sonoras en cabina en tiempo real, retroalimentación individual mensual a conductores con excesos y revisión trimestral en Comité de Seguridad Vial.',
      frecuenciaSeguimiento: 'Semanal (Monitoreo GPS) / Mensual (Comité PESV)',
      responsableSeguimiento: 'Líder del PESV / Coordinador de Operaciones y Tráfico',
      actividades: [
        {
          id: 'act-1-1',
          actividad: 'Instalación y calibración de dispositivos de control de velocidad (GPRS / Telemetría)',
          objetivo: 'Garantizar el monitoreo en tiempo real del 100% de la flota activa.',
          responsable: 'Coordinador de Operaciones / Proveedor de GPS',
          fechaRealizacion: '2026-04-10',
          verificacion: 'Reporte de conectividad satelital y actas de instalación.',
          indicadores: 'GVE: Porcentaje de flota con GPS activo',
          estado: 'Realizado'
        },
        {
          id: 'act-1-2',
          actividad: 'Sensibilización sobre los peligros del exceso de velocidad y distancias de frenado',
          objetivo: 'Concientizar al personal sobre los riesgos físicos y legales del exceso de velocidad.',
          responsable: 'Líder del PESV / Formador Vial',
          fechaRealizacion: '2026-07-20',
          verificacion: 'Planillas de asistencia firmadas y evaluaciones de conocimiento aprobadas.',
          indicadores: 'Cobertura de capacitación en exceso de velocidad (%)',
          estado: 'Programado'
        }
      ]
    },
    {
      id: 2,
      nombre: '2. Programa de Prevención de la Fatiga',
      objetivoGeneral: 'Establecer lineamientos de control de tiempos de conducción, descanso y pausas activas para evitar accidentes relacionados con microsueños y fatiga laboral.',
      indicadorGeneral: '%EJL = (#EJD / #SDT) * 100',
      lineamientoBase: 'Política de Regulación de Horas de Conducción y Descanso del PESV: Garantizar condiciones psicofísicas óptimas y cero conducción bajo estados de fatiga o somnolencia.',
      alcanceActores: 'Conductores de rutas largas intermunicipales, operadores de reparto urbano y supervisores de programación de despacho.',
      alcanceVehiculos: 'Tractocamiones, camiones rígidos, vans de transporte de personal y vehículos utilitarios en turnos operativos.',
      alcanceProcesos: 'Programación de despachos y rutas, control de tráfico, Gestión Humana y Seguridad y Salud en el Trabajo (SST).',
      alcanceDescripcion: 'Cubre toda programación de viajes superiores a 4 horas continuas y jornadas laborales de transporte diurno y nocturno.',
      objetivoEspecifico: 'Prevenir el 100% de los siniestros viales asociados a microsueños o fatiga, manteniendo los excesos de jornada laboral diaria por debajo del 1% mensual.',
      metaMedible: 'Cumplir %EJLC <= 1.0% mensual en jornadas de conductores y garantizar el 100% de realización de pausas activas cada 2 horas de conducción.',
      metaValor: '%EJLC <= 1.0% | 100% Pausas Activas',
      objetivoPaso7Id: 3,
      indicadoresMedicion: 'Indicador 6 (%EJLC: % Exceso Jornadas Laborales Conductores) e Indicador 1 (TSV(n): Tasa de Siniestros Viales).',
      formulaMedicion: '%EJL = (#EJD / #SDT) * 100',
      frecuenciaMedicion: 'Mensual y Acumulado Anual',
      fuenteDatos: 'Planillas de control de turnos y despacho, bitácoras de sueño preoperacionales y reporte de horas de motor encendido por GPS.',
      indicadoresPaso20Ids: [6, 1],
      factoresDesempeno: [
        'Control de tiempos de conducción, jornada laboral y descanso',
        'Evaluación médica ocupacional (higiene del sueño y tamizaje de apnea)',
        'Comportamiento del conductor (reporte preventivo de somnolencia)',
        'Condiciones ergonómicas, climatización y confort de cabina'
      ],
      descripcionFactoresDesempeno: 'Control de límite máximo de horas de conducción diaria con pausas activas obligatorias de 15 minutos cada 2 horas, test preoperacional de calidad de sueño y revisión ergonómica del vehículo.',
      presupuestoAsignado: 12000000,
      presupuestoEjecutado: 8200000,
      detallePresupuesto: 'Exámenes médicos ocupacionales de sueño y tamizaje de fatiga ($6.500.000), kits de pausas activas e hidratación en ruta ($3.000.000), adecuación de salas de descanso ($2.500.000).',
      mecanismosSeguimiento: 'Verificación diaria del test de fatiga preoperacional antes de autorizar el despacho, auditoría mensual de horas de conducción GPS vs planilla de turnos y vigilancia epidemiológica semestral.',
      frecuenciaSeguimiento: 'Diario (Preoperacional) / Mensual (Auditoría de Jornadas)',
      responsableSeguimiento: 'Profesional SST / Médico Ocupacional / Jefe de Despacho',
      actividades: [
        {
          id: 'act-2-1',
          actividad: 'Implementación del diario de sueño preoperacional y control de pausas activas en ruta',
          objetivo: 'Identificar síntomas tempranos de cansancio en conductores antes y durante el viaje.',
          responsable: 'HSE / Supervisor de Despacho',
          fechaRealizacion: '2026-05-15',
          verificacion: 'Registros diligenciados en la app o planillas físicas diarias.',
          indicadores: '%EJLC y Porcentaje de reportes de fatiga analizados',
          estado: 'Realizado'
        },
        {
          id: 'act-2-2',
          actividad: 'Exámenes de control de medicina preventiva de hábitos de sueño y descanso',
          objetivo: 'Evaluar clínicamente trastornos de sueño como apnea en conductores críticos.',
          responsable: 'Médico Ocupacional',
          fechaRealizacion: '2026-09-12',
          verificacion: 'Certificados de aptitud médica ocupacional con recomendaciones.',
          indicadores: 'Exámenes médicos realizados / Programados (%)',
          estado: 'Programado'
        }
      ]
    },
    {
      id: 3,
      nombre: '3. Programa de Prevención de la Distracción',
      objetivoGeneral: 'Prohibir el uso de teléfonos móviles u otros dispositivos distractores durante la conducción, asegurando la concentración absoluta en la vía.',
      indicadorGeneral: 'ECESV = (CEV(t) / CPT(t)) * 100 | 0 Infracciones por uso de celular',
      lineamientoBase: 'Política de Prevención de Elementos Distractores en la Conducción: Prohibición del uso de dispositivos móviles, pantallas o manipulación de objetos con el vehículo en marcha.',
      alcanceActores: 'Todos los conductores de vehículos automotores, motociclistas y ciclistas corporativos de la organización.',
      alcanceVehiculos: '100% de vehículos automotores y no automotores propios, contratistas y de uso misional.',
      alcanceProcesos: 'Distribución logística, atención comercial en campo, mensajería corporativa y transporte administrativo.',
      alcanceDescripcion: 'Aplica durante todo el tiempo en que el vehículo se encuentre encendido o en circulación en vías públicas, privadas o zonas de parqueo.',
      objetivoEspecifico: 'Eliminar los siniestros viales e infracciones asociados al uso de celulares o pantallas durante la conducción, alcanzando una cobertura de formación y sensibilización mayor al 95%.',
      metaMedible: 'Mantener 0 siniestros viales por distracción, 0 comparendos por manipulación de móviles y >= 95% de cobertura de formación vial.',
      metaValor: '0 Siniestros por Distracción | >= 95% Formación',
      objetivoPaso7Id: 2,
      indicadoresMedicion: 'Indicador 11 (ECESV: Ejecución de Capacitaciones en Seguridad Vial), Indicador 5 (CPlan PESV) e Indicador 1 (TSV(n)).',
      formulaMedicion: 'ECESV = (CEV(t) / CPT(t)) * 100  |  Tasa Distracción = (Eventos detectados / Inspecciones en ruta) * 100',
      frecuenciaMedicion: 'Mensual y Trimestral',
      fuenteDatos: 'Inspecciones de comportamiento en vía, reportes de cámaras de cabina/telemetría, consulta SIMIT y registros de asistencia Paso 10.',
      indicadoresPaso20Ids: [11, 5, 1],
      factoresDesempeno: [
        'Comportamiento del conductor (atención visual y cognitiva en la vía)',
        'Protocolo de comunicación segura con central de despacho',
        'Evaluación práctica de hábitos de conducción defensiva',
        'Planificación y configuración de ruta en GPS previo al inicio de marcha'
      ],
      descripcionFactoresDesempeno: 'Evaluación del cumplimiento de no manipulación de celulares ni ruteros en movimiento; configuración de navegación antes de arrancar y contacto con despacho únicamente en zonas seguras de parqueo.',
      presupuestoAsignado: 8500000,
      presupuestoEjecutado: 5600000,
      detallePresupuesto: 'Adquisición de soportes homologados y software de bloqueo en movimiento ($4.200.000), campañas "Manos en el volante, ojos en la vía" ($2.300.000), auditorías de ruta ($2.000.000).',
      mecanismosSeguimiento: 'Inspecciones aleatorias de comportamiento vial en ruta, auditorías al protocolo de comunicación del centro de despacho (no llamar al conductor en movimiento) y seguimiento trimestral en Comité PESV.',
      frecuenciaSeguimiento: 'Quincenal (Inspección en ruta) / Trimestral (Comité PESV)',
      responsableSeguimiento: 'Líder del PESV / Coordinador de Logística y COPASST',
      actividades: [
        {
          id: 'act-3-1',
          actividad: 'Suministro y validación del uso de soportes manos libres únicamente para llamadas de emergencia autorizadas',
          objetivo: 'Reducir la manipulación física de teléfonos durante trayectos.',
          responsable: 'Coordinador de Logística',
          fechaRealizacion: '2026-03-22',
          verificacion: 'Actas de entrega de dotación y auditorías de seguridad en ruta.',
          indicadores: 'Porcentaje de conductores dotados con manos libres de seguridad',
          estado: 'Realizado'
        },
        {
          id: 'act-3-2',
          actividad: 'Campaña "Manos en el volante, ojos en la vía" y pruebas de observación aleatorias',
          objetivo: 'Reforzar de manera didáctica la prohibición estricta de chatear o hablar al conducir.',
          responsable: 'Copasst / Líder del PESV',
          fechaRealizacion: '2026-08-05',
          verificacion: 'Evidencia fotográfica y reportes de inspección en vía.',
          indicadores: 'ECESV: Número de campañas ejecutadas vs programadas',
          estado: 'Programado'
        }
      ]
    },
    {
      id: 4,
      nombre: '4. Programa de Cero Tolerancia al Alcohol y Sustancias Psicoactivas',
      objetivoGeneral: 'Garantizar un entorno laboral 100% libre de alcohol y drogas mediante controles aleatorios rigurosos preoperacionales en vía.',
      indicadorGeneral: 'Tasa de Positividad = (Pruebas Positivas / Total Pruebas Realizadas) * 100 (Meta: 0%)',
      lineamientoBase: 'Política de Cero Tolerancia al Consumo de Alcohol, Tabaco y Sustancias Psicoactivas (SPA): Garantizar operaciones de transporte 100% libres de sustancias que alteren la aptitud psicofísica.',
      alcanceActores: 'Conductores propios, contratistas, operadores de montacargas, motociclistas y personal técnico con rol de conducción.',
      alcanceVehiculos: 'Toda la flota vehicular automotor, maquinaria de patio y motocicletas al servicio de la empresa.',
      alcanceProcesos: 'Despacho de flota, control de acceso en sedes operativas, mantenimiento vehicular y selección/evaluación de personal.',
      alcanceDescripcion: 'Aplica en controles preventivos al inicio de turno, operativos sorpresa en ruta y pruebas obligatorias post-incidente o siniestro vial.',
      objetivoEspecifico: 'Garantizar 0% de positividad en pruebas de alcoholimetría y sustancias psicoactivas en conductores activos, evitando cualquier siniestro vial derivado de esta causa.',
      metaMedible: 'Lograr 0% de casos positivos en pruebas de tamizaje y cumplir >= 95% del cronograma mensual de pruebas preventivas preoperacionales.',
      metaValor: '0% Positividad | >= 95% Cobertura de Pruebas',
      objetivoPaso7Id: 1,
      indicadoresMedicion: 'Tasa de Positividad en Tamizajes, Indicador 5 (CPlan PESV), Indicador 11 (ECESV) e Indicador 1 (TSV(n)).',
      formulaMedicion: 'Positividad = (Pruebas Positivas / Total Pruebas Realizadas) * 100  |  Cobertura = (Pruebas Ejecutadas / Programadas) * 100',
      frecuenciaMedicion: 'Mensual y Trimestral',
      fuenteDatos: 'Bitácora oficial de pruebas de alcohosensor con tirillas impresas, certificados de calibración ONAC y reportes de laboratorio clínico.',
      indicadoresPaso20Ids: [5, 11, 1],
      factoresDesempeno: [
        'Aptitud psicofísica y comportamiento responsable del conductor',
        'Control preoperacional de ingreso a la operación',
        'Aseguramiento metrológico y calibración de equipos de medición',
        'Cultura de autocuidado, prevención de adicciones y salud mental'
      ],
      descripcionFactoresDesempeno: 'Verificación del estado psicofísico del conductor previo al despacho, calibración certificada de alcohosensores cada 6 meses y programas de salud preventiva en SST.',
      presupuestoAsignado: 14200000,
      presupuestoEjecutado: 9800000,
      detallePresupuesto: 'Compra y calibración certificada de alcohosensores digitales ($6.200.000), insumos/boquillas y pruebas de laboratorio ($5.000.000), talleres con psicólogo especialista en SST ($3.000.000).',
      mecanismosSeguimiento: 'Operativos diarios aleatorios en portería y muelles de despacho antes de la entrega de llaves, auditoría de certificados de calibración de alcohosensores y reporte mensual al Comité PESV.',
      frecuenciaSeguimiento: 'Diario (Muestreo Preoperacional) / Mensual (Consolidado SST)',
      responsableSeguimiento: 'Líder del PESV / Profesional SST / Médico Laboral',
      actividades: [
        {
          id: 'act-4-1',
          actividad: 'Adquisición de alcoholímetros calibrados y ejecución de pruebas sorpresa preoperacionales',
          objetivo: 'Identificar cualquier conductor bajo el efecto de sustancias antes de iniciar la operación.',
          responsable: 'Líder del PESV / Auxiliar de Seguridad',
          fechaRealizacion: '2026-06-10',
          verificacion: 'Libro de registro de pruebas de alcoholimetría firmado con resultados.',
          indicadores: 'Porcentaje de pruebas realizadas frente a la flota activa (%)',
          estado: 'Realizado'
        },
        {
          id: 'act-4-2',
          actividad: 'Talleres de sensibilización sobre efectos nocivos del alcohol y sustancias psicoactivas en la conducción',
          objetivo: 'Educar a la planta de conductores sobre la metabolización de sustancias y normatividad legal.',
          responsable: 'Psicólogo Especialista en SST',
          fechaRealizacion: '2026-10-18',
          verificacion: 'Evaluaciones teóricas firmadas y folletos divulgados.',
          indicadores: 'ECESV: Cobertura de capacitación en prevención de adicciones (%)',
          estado: 'Programado'
        }
      ]
    },
    {
      id: 5,
      nombre: '5. Programa para la protección de actores viales vulnerables',
      objetivoGeneral: 'Implementar medidas específicas, técnicas y pedagógicas para salvaguardar la vida de peatones, ciclistas, motociclistas y animales en las rutas de operación.',
      indicadorGeneral: 'IDP = (#VID / #TV) * 100 | CPMVh = (MEVh(t) / MPVh(t)) * 100',
      lineamientoBase: 'Política de Protección Prioritaria a Actores Viales Vulnerables (Enfoque Sistema Seguro): Respeto absoluto por la prelación e integridad de peatones, ciclistas y motociclistas.',
      alcanceActores: 'Peatones en planta y vía pública, ciclistas (desplazamiento in-itinere), motociclistas corporativos y conductores de vehículos pesados.',
      alcanceVehiculos: 'Camiones rígidos, tractocamiones, furgones de reparto, motocicletas corporativas y bicicletas de colaboradores.',
      alcanceProcesos: 'Maniobras en patios y muelles, distribución urbana, desplazamientos casa-trabajo-casa (in-itinere) y mantenimiento vehicular.',
      alcanceDescripcion: 'Cubre la interacción vial en zonas urbanas de alta densidad, entornos escolares/residenciales y circulación interna en sedes de la empresa.',
      objetivoEspecifico: 'Lograr cero siniestros viales con lesión o fatalidad que involucren peatones, ciclistas o motociclistas, asegurando el 100% de inspecciones preoperacionales y sistemas de visibilidad activa.',
      metaMedible: 'Alcanzar 100% en Inspecciones Diarias Preoperacionales (IDP), >= 90% en Mantenimiento Preventivo (CPMVh) y 0 atropellos o colisiones con actores vulnerables.',
      metaValor: '0 Siniestros con Vulnerables | IDP = 100% | CPMVh >= 90%',
      objetivoPaso7Id: 3,
      indicadoresMedicion: 'Indicador 9 (IDP: Inspecciones Diarias Preoperacionales), Indicador 10 (CPMVh: Cumplimiento Plan Mantenimiento Preventivo) e Indicador 1 (TSV(n)).',
      formulaMedicion: 'IDP = (#VID / #TV) * 100  |  CPMVh = (MEVh(t) / MPVh(t)) * 100',
      frecuenciaMedicion: 'Mensual y Trimestral',
      fuenteDatos: 'Formatos digitales de inspección preoperacional diaria, órdenes de taller de mantenimiento, actas de entrega de EPP y registro de incidentes.',
      indicadoresPaso20Ids: [9, 10, 1],
      factoresDesempeno: [
        'Mantenimiento preventivo de sistemas críticos y visibilidad (espejos punto ciego, frenos)',
        'Inspección preoperacional diaria de vehículos y motocicletas (IDP)',
        'Comportamiento del conductor (distancia lateral >= 1.5 m y velocidad en zonas peatonales)',
        'Infraestructura segura y segregación de senderos peatonales en sedes'
      ],
      descripcionFactoresDesempeno: 'Verificación de espejos convexos de punto ciego, sensores/alarmas sonoras de reversa, defensas laterales, uso de casco certificado y prendas reflectivas de alta visibilidad.',
      presupuestoAsignado: 16800000,
      presupuestoEjecutado: 11500000,
      detallePresupuesto: 'Instalación de espejos de punto ciego, sensores y alarmas de reversa ($8.500.000), dotación de EPP certificados para motociclistas/ciclistas ($4.800.000), demarcación de senderos peatonales y talleres prácticos ($3.500.000).',
      mecanismosSeguimiento: 'Inspección preoperacional diaria obligatoria antes de salir a ruta, auditoría mensual de estado de EPP y dispositivos de punto ciego, y simulacros prácticos de puntos ciegos.',
      frecuenciaSeguimiento: 'Diario (Inspección IDP) / Mensual (Auditoría de Taller y SST)',
      responsableSeguimiento: 'Jefe de Mantenimiento / Líder del PESV / COPASST',
      actividades: [
        {
          id: 'act-5-1',
          actividad: 'Demarcación e instalación de espejos de punto ciego convexos en toda la flota de camiones',
          objetivo: 'Eliminar los puntos ciegos laterales para proteger ciclistas y motociclistas.',
          responsable: 'Jefe de Taller / Mantenimiento',
          fechaRealizacion: '2026-04-28',
          verificacion: 'Registro fotográfico del vehículo y check-list de mantenimiento.',
          indicadores: 'CPMVh: Porcentaje de camiones con espejos de punto ciego instalado',
          estado: 'Realizado'
        },
        {
          id: 'act-5-2',
          actividad: 'Capacitación práctica "Ponte en mis zapatos" (Simulacros de puntos ciegos con ciclistas reales)',
          objetivo: 'Permitir que los conductores experimenten la visibilidad de los ciclistas desde la vía.',
          responsable: 'Líder del PESV / Formador Externo',
          fechaRealizacion: '2026-11-05',
          verificacion: 'Video de la actividad de campo y planillas de asistencia.',
          indicadores: 'ECESV: Número de conductores entrenados en empatía vial',
          estado: 'Programado'
        }
      ]
    }
  ];

  const [riskPrograms, setRiskPrograms] = useState<PESVRiskProgram[]>(() => {
    const saved = localStorage.getItem('pesv_risk_programs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((prog: any) => {
            const fallback = DEFAULT_RISK_PROGRAMS.find(d => d.id === prog.id) || DEFAULT_RISK_PROGRAMS[0];
            return {
              ...fallback,
              ...prog,
              factoresDesempeno: Array.isArray(prog.factoresDesempeno) && prog.factoresDesempeno.length > 0
                ? prog.factoresDesempeno
                : fallback.factoresDesempeno,
              indicadoresPaso20Ids: Array.isArray(prog.indicadoresPaso20Ids) && prog.indicadoresPaso20Ids.length > 0
                ? prog.indicadoresPaso20Ids
                : fallback.indicadoresPaso20Ids
            };
          });
        }
      } catch (e) {}
    }
    return DEFAULT_RISK_PROGRAMS;
  });

  useEffect(() => {
    localStorage.setItem('pesv_risk_programs_v2', JSON.stringify(riskPrograms));
  }, [riskPrograms]);

  const [selectedProgramId, setSelectedProgramId] = useState<number>(1);
  const [isEditingProgramFicha, setIsEditingProgramFicha] = useState<boolean>(false);
  const [newFactorInput, setNewFactorInput] = useState<string>('');

  // Activity form states
  const [newActivity, setNewActivity] = useState<Omit<PESVProgramActivity, 'id'>>({
    actividad: '',
    objetivo: '',
    responsable: '',
    fechaRealizacion: '',
    verificacion: '',
    indicadores: '',
    estado: 'Programado'
  });

  const [editingActivityId, setEditingActivityId] = useState<number | string | null>(null);


  // STEP 3 Sub-tabs (Comité vs Liderazgo Directivo)
  const [activeStep3Tab, setActiveStep3Tab] = useState<'comite' | 'liderazgo'>('comite');

  // Committee Members state
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([
    {
      id: 'cm-1',
      nombre: 'Liliana Patricia Gómez Ortiz',
      cargo: 'Gerente de Operaciones',
      rolComite: 'Presidente',
      email: 'liliana.gomez@empresa.com',
      firma: 'Liliana Gomez O.',
      firmado: true
    },
    {
      id: 'cm-2',
      nombre: 'Sandra Milena Giraldo Castro',
      cargo: 'Coordinadora de Logística',
      rolComite: 'Secretario',
      email: 'sandra.giraldo@empresa.com',
      firma: 'S. Milena Giraldo',
      firmado: true
    },
    {
      id: 'cm-3',
      nombre: 'Carlos Alberto Restrepo',
      cargo: 'Conductor Carga Camión Pesado',
      rolComite: 'Representante de Conductores',
      email: 'carlos.restrepo@gmail.com',
      firma: 'Carlos Restrepo',
      firmado: true
    },
    {
      id: 'cm-4',
      nombre: 'Edwin Orlando Pérez',
      cargo: 'Asesor HSE Externo',
      rolComite: 'Asesor Externo',
      email: 'edwin.perez@consultores.com',
      firma: 'Edwin Perez H.',
      firmado: false
    }
  ]);

  const [newMember, setNewMember] = useState<Omit<CommitteeMember, 'id'>>({
    nombre: '',
    cargo: '',
    rolComite: 'Vocal' as any,
    email: '',
    firma: '',
    firmado: false
  });

  // Committee Meetings state
  const [committeeMeetings, setCommitteeMeetings] = useState<CommitteeMeeting[]>([
    {
      id: 'meet-1',
      numeroActa: 'CSV-ACT-001',
      fecha: '2026-05-20',
      temasDiscutidos: '1. Presentación y conformación formal del Comité de Seguridad Vial para el periodo 2026-2027. 2. Revisión de la Política de Seguridad Vial de la organización. 3. Socialización del plan inicial de diagnóstico y matriz de riesgos del PESV.',
      compromisos: [
        { id: 'comp-1-1', tarea: 'Divulgar la Política de Seguridad Vial firmada a todos los colaboradores de la empresa.', responsable: 'Sandra Milena Giraldo', fechaLimite: '2026-06-15' },
        { id: 'comp-1-2', tarea: 'Revisar la base de datos de conductores y actualizar el estado de vigencia de licencias C2 y C3.', responsable: 'Carlos Alberto Restrepo', fechaLimite: '2026-06-30' }
      ],
      asistentesIds: ['cm-1', 'cm-2', 'cm-3']
    }
  ]);

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('meet-1');
  const [newMeeting, setNewMeeting] = useState<Omit<CommitteeMeeting, 'id' | 'compromisos' | 'asistentesIds'>>({
    numeroActa: '',
    fecha: '',
    temasDiscutidos: ''
  });
  const [newMeetingCompromisos, setNewMeetingCompromisos] = useState<CommitteeMeetingCommitment[]>([]);
  const [tempCompromiso, setTempCompromiso] = useState<Omit<CommitteeMeetingCommitment, 'id'>>({
    tarea: '',
    responsable: '',
    fechaLimite: ''
  });
  const [selectedAsistentes, setSelectedAsistentes] = useState<string[]>(['cm-1', 'cm-2', 'cm-3']);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingCompromisoId, setEditingCompromisoId] = useState<string | null>(null);
  const [showEditMeetingModal, setShowEditMeetingModal] = useState<boolean>(false);
  const [editMeetingForm, setEditMeetingForm] = useState<{ numeroActa: string; fecha: string; temasDiscutidos: string }>({
    numeroActa: '',
    fecha: '',
    temasDiscutidos: ''
  });

  // Manager's Checklist (Paso 4)
  const [managerChecklist, setManagerChecklist] = useState<ManagerChecklistItem[]>([
    {
      id: 'mcl-a',
      letra: 'a',
      descripcion: 'La definición de la política y los objetivos del PESV, que sean compatibles con la dirección estratégica de la organización, buscando prevenir siniestros viales, reducir las muertes y disminuir el riesgo de lesiones o daños derivados de los siniestros viales.',
      cumple: 'Sí',
      observaciones: 'La Política de Seguridad Vial fue definida y firmada el 15 de marzo de 2026. Los objetivos del PESV se encuentran alineados con el Balanced Scorecard estratégico de la compañía.'
    },
    {
      id: 'mcl-b',
      letra: 'b',
      descripcion: 'Promover en la organización la formación y aplicación de hábitos, comportamientos y conductas seguras en la vía.',
      cumple: 'Sí',
      observaciones: 'Se incluyó la inducción en seguridad vial y se programaron capacitaciones mensuales. Campaña "Manos al volante" activa.'
    },
    {
      id: 'mcl-c',
      letra: 'c',
      descripcion: 'El suministro de recursos financieros, técnicos y humanos requeridos para el diseño, implementación, verificación y mejora del PESV.',
      cumple: 'Sí',
      observaciones: 'Presupuesto de $15,000,000 COP asignado para la vigencia 2026, incluyendo contratación de consultor especialista y compra de alcoholímetros.'
    },
    {
      id: 'mcl-d',
      letra: 'd',
      descripcion: 'La adquisición o contratación de vehículos, equipos, repuestos y servicios que cumplan especificaciones de seguridad, de acuerdo con la normatividad vigente en la materia.',
      cumple: 'Sí',
      observaciones: 'El manual de compras incluye como requisito obligatorio que todo camión cuente con frenos ABS y airbags frontales. Repuestos de frenos homologados por fabricante.'
    },
    {
      id: 'mcl-e',
      letra: 'e',
      descripcion: 'El seguimiento para que los contratistas, afiliados, asociados, terceros y la comunidad de la organización cumplan los requisitos de seguridad vial que establezca la organización.',
      cumple: 'Sí',
      observaciones: 'Inclusión de cláusulas contractuales de PESV en el 100% de los contratos con empresas afiliadas y de transporte terrestre.'
    },
    {
      id: 'mcl-f',
      letra: 'f',
      descripcion: 'El cumplimiento de las acciones y estrategias definidas en el plan de trabajo anual del PESV.',
      cumple: 'Sí',
      observaciones: 'Revisión mensual del cronograma de plan de trabajo. Cumplimiento actual del 85% de las actividades planeadas.'
    },
    {
      id: 'mcl-g',
      letra: 'g',
      descripcion: 'La atención oportuna de la solicitud de información por parte de las entidades verificadoras, la participación en la reunión de apertura y reunión de cierre y la gestión de los hallazgos resultantes de las visitas de verificación que realicen el Ministerio de Trabajo, la Superintendencia de Transporte o los Organismos de Tránsito según corresponda de acuerdo con la función de verificación de la implementación del Plan Estratégico de Seguridad Vial de conformidad con lo establecido en el artículo 1 de la Ley 2050 de 2020 y las disposiciones que lo reglamenten.',
      cumple: 'Sí',
      observaciones: 'Se cuenta con un canal oficial de radicación y se asignó al Líder del PESV como enlace directo ante la Superintendencia y el Ministerio.'
    },
    {
      id: 'mcl-h',
      letra: 'h',
      descripcion: 'La participación en una (1) reunión del comité de seguridad vial por lo menos una (1) vez al año para revisar los resultados de la planificación, implementación, seguimiento y mejora del PESV.',
      cumple: 'Sí',
      observaciones: 'La Gerencia General participó de forma presencial en el Comité de Instalación del 20 de mayo de 2026 y está agendada para el comité de cierre anual.'
    }
  ]);

  const [managerSignatureName, setManagerSignatureName] = useState<string>('Pedro Alcides Moreno Prada');
  const [managerSignatureCharge, setManagerSignatureCharge] = useState<string>('Gerente General & Representante Legal');
  const [managerSignatureText, setManagerSignatureText] = useState<string>('P. Alcides Moreno');
  const [managerSigned, setManagerSigned] = useState<boolean>(true);
  const [managerSignatureDate, setManagerSignatureDate] = useState<string>('2026-06-25');
  const [managerSignatureImage, setManagerSignatureImage] = useState<string | null>(null);

  const handleSignatureUploadCallback = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawQrCodeOnCanvas = (canvas: HTMLCanvasElement, text: string, type: 'reporte' | 'evaluaciones') => {
    if (!canvas || !text) return;
    const primaryColor = type === 'reporte' ? '#0369a1' : '#0f766e'; // Sky-700 vs Teal-700
    QRCode.toCanvas(
      canvas,
      text,
      {
        width: 156,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: primaryColor,
          light: '#FFFFFF'
        }
      },
      (err) => {
        if (err) {
          console.error('Error generating QR code:', err);
        }
      }
    );
  };

  const downloadPDF = async (elementId: string, filename: string) => {
    setIsExporting(elementId);
    
    try {
      // 1. Caso específico: Acta de Nombramiento y Delegación del Líder (Paso 1)
      if (elementId === 'acta-document-container') {
        exportActaNombramientoPDF({
          companyName,
          companyLogo,
          companyNit,
          actaNumber,
          appointmentDate,
          leaderName,
          leaderId,
          leaderLicense,
          leaderLicenseExpiry,
          repLegal,
          actaCustomIntro,
          actaResponsibilities,
          repSignatureImg1,
          leaderSignatureImg,
          filename: filename || `Acta_Nombramiento_Lider_${leaderName.replace(/\s+/g, '_')}.pdf`
        });
        return;
      }

      // 2. Caso específico: Política de Seguridad Vial (Paso 2)
      if (elementId === 'policy-document-container') {
        exportPoliticaPDF({
          companyName,
          companyLogo,
          companyNit,
          policyDate,
          repLegal,
          policyCustomText,
          selectedCommitments,
          repSignatureImg2,
          filename: filename || `Politica_Seguridad_Vial_${companyName.replace(/\s+/g, '_')}.pdf`
        });
        return;
      }

      // 3. Caso específico: Acta de Sesión del Comité (Paso 3)
      if (elementId === 'visual-acta-comite') {
        const currentMeeting = committeeMeetings.find(m => m.id === selectedMeetingId) || committeeMeetings[0];
        const attendees = committeeMembers.filter(m => currentMeeting?.asistentesIds?.includes(m.id));
        exportComiteActaPDF({
          companyName,
          companyLogo,
          companyNit,
          numeroActa: currentMeeting?.numeroActa || 'CSV-ACT-001',
          fecha: currentMeeting?.fecha || '2026-05-20',
          temasDiscutidos: currentMeeting?.temasDiscutidos || '',
          compromisos: (currentMeeting?.compromisos || []).map(c => ({
            tarea: c.tarea || '',
            responsable: c.responsable || '',
            fechaLimite: c.fechaLimite || ''
          })),
          asistentes: attendees.map(m => ({
            nombre: m.nombre,
            cargo: m.cargo,
            rol: m.rolComite,
            firma: m.firma,
            firmado: m.firmado
          })),
          filename: filename || `Acta_Comite_${currentMeeting?.numeroActa || '001'}.pdf`
        });
        return;
      }

      // 4. Caso específico: Declaración Juramentada de Liderazgo Directivo (Paso 4)
      if (elementId === 'visual-liderazgo-directivo') {
        exportCompromisoGerentePDF({
          companyName,
          companyLogo,
          companyNit,
          managerSignatureName,
          managerSignatureCharge,
          managerSignatureDate,
          commitmentScore: 100,
          managerSignatureImg: managerSignatureImage || '',
          filename: filename || 'Certificado_Compromiso_Gerente_PESV.pdf'
        });
        return;
      }

      // 5. Caso específico: Plan Anual de Trabajo PESV (Paso 8)
      if (elementId === 'pdf-annual-work-plan') {
        exportPlanAnualPDF({
          companyName,
          companyLogo,
          companyNit,
          activities: annualPlanActivities,
          filename: filename || `Plan_Anual_Trabajo_PESV_${companyName.replace(/\s+/g, '_')}.pdf`
        });
        return;
      }

      // 6. Fallback universal en TAMAÑO CARTA para cualquier otro contenedor
      const element = document.getElementById(elementId);
      if (!element) {
        alert('Error: No se encontró el contenedor del documento.');
        return;
      }
      
      const originalStyle = element.style.cssText;
      element.style.width = '750px';
      element.style.padding = '36px';
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#111827';
      element.style.boxShadow = 'none';
      element.style.borderRadius = '0px';
      element.style.border = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      element.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      // Configuración en TAMAÑO CARTA (Letter: 215.9mm x 279.4mm)
      const pdf = new jsPDF('p', 'mm', 'letter');
      const letterWidth = 215.9;
      const letterHeight = 279.4;
      const margin = 10;
      const printableWidth = letterWidth - margin * 2;
      const printableHeight = letterHeight - margin * 2;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;
      
      pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
      heightLeft -= printableHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage('letter', 'portrait');
        pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
        heightLeft -= printableHeight;
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setIsExporting(null);
    }
  };



  // --- PASO 11: Responsabilidad y Comportamiento Seguro ---
  const [evaluacionesComportamiento, setEvaluacionesComportamiento] = useState<any[]>(() => {
    const saved = localStorage.getItem('pesv_evaluaciones_comportamiento');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'eval-1',
        colaboradorId: 1,
        nombre: 'Juan Carlos Montoya Velásquez',
        cedula: 'CC 71.382.441',
        cargo: 'Conductor de Carga Pesada',
        periodoEvaluado: 'Primer Semestre 2026',
        fechaEvaluacion: '2026-06-15',
        observacionesGenerales: 'Conductor demuestra un alto nivel de compromiso con la seguridad vial. Se evidencia cumplimiento de las inspecciones preoperacionales de forma rigurosa.',
        infracciones: [
          {
            id: 'inf-1',
            fecha: '2026-03-10',
            codigoInfraccion: 'C29 (Exceso de velocidad)',
            comparendoNo: '11001000000012345',
            descripcion: 'Exceso de velocidad registrado por fotodetector en la Autopista Norte con Calle 170 Bogotá. Velocidad registrada: 58 km/h en zona de 50 km/h.',
            estado: 'Pagada',
            puntosAfectados: 4
          }
        ],
        quejas: [
          {
            id: 'q-1',
            fecha: '2026-04-22',
            origen: 'Ciudadano (Canal Cómo Conduzco)',
            descripcion: 'Reporte ciudadano indicando que el camión de placa JKS-284 hizo un cambio brusco de carril sin activar las luces direccionales en la salida de Medellín.',
            nivelRiesgo: 'Medio',
            accionTomada: 'Llamado de atención y retroalimentación individual sobre uso obligatorio de direccionales. Suscripción de compromiso de mejora.'
          }
        ],
        compromisoFirmado: true,
        firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
        firmaEvaluadorImg: null,
        firmaConductor: 'Juan Carlos Montoya',
        firmaConductorImg: null,
        fechaFirma: '2026-06-15'
      },
      {
        id: 'eval-2',
        colaboradorId: 3,
        nombre: 'Carlos Julio Restrepo Bedoya',
        cedula: 'CC 19.452.883',
        cargo: 'Conductor Reparto Urbano',
        periodoEvaluado: 'Primer Semestre 2026',
        fechaEvaluacion: '2026-06-20',
        observacionesGenerales: 'Conductor con excelente récord. Cero infracciones y cero reportes en el período evaluado.',
        infracciones: [],
        quejas: [],
        compromisoFirmado: true,
        firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
        firmaEvaluadorImg: null,
        firmaConductor: 'Carlos Julio Restrepo',
        firmaConductorImg: null,
        fechaFirma: '2026-06-20'
      }
    ];
  });

  // Sync Step 11 evaluations with Firestore & localStorage
  useEffect(() => {
    const unsubscribe = subscribeToSystemSetting('paso11_evaluaciones_comportamiento', (cloudList) => {
      if (Array.isArray(cloudList) && cloudList.length > 0) {
        setEvaluacionesComportamiento(cloudList);
        localStorage.setItem('pesv_evaluaciones_comportamiento', JSON.stringify(cloudList));
      }
    });
    const handleLocalUpdate = (e: any) => {
      if (Array.isArray(e?.detail)) {
        setEvaluacionesComportamiento(e.detail);
      }
    };
    window.addEventListener('pesv_step11_updated', handleLocalUpdate);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('pesv_step11_updated', handleLocalUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pesv_evaluaciones_comportamiento', JSON.stringify(evaluacionesComportamiento));
    saveSystemSetting('paso11_evaluaciones_comportamiento', evaluacionesComportamiento).catch(() => {});
  }, [evaluacionesComportamiento]);

  const [selectedEvalId, setSelectedEvalId] = useState<string | null>('eval-1');
  const [showEvalForm, setShowEvalForm] = useState<boolean>(false);
  const [newEvalObj, setNewEvalObj] = useState<any>({
    nombre: '',
    cedula: '',
    cargo: '',
    periodoEvaluado: 'Primer Semestre 2026',
    fechaEvaluacion: '2026-06-25',
    observacionesGenerales: '',
    infracciones: [],
    quejas: [],
    compromisoFirmado: false,
    firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
    firmaEvaluadorImg: null,
    firmaConductor: '',
    firmaConductorImg: null,
    fechaFirma: '2026-06-25'
  });
  
  const [newInfraction, setNewInfraction] = useState({
    fecha: '2026-06-25',
    codigoInfraccion: 'C29 (Exceso de velocidad)',
    comparendoNo: '',
    descripcion: '',
    estado: 'Pendiente',
    puntosAfectados: 0
  });

  const [newComplaint, setNewComplaint] = useState({
    fecha: '2026-06-25',
    origen: 'Ciudadano (Canal Cómo Conduzco)',
    descripcion: '',
    nivelRiesgo: 'Bajo',
    accionTomada: ''
  });

  const [showAddInfModal, setShowAddInfModal] = useState(false);
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [editingInfractionId, setEditingInfractionId] = useState<string | null>(null);
  const [editingComplaintId, setEditingComplaintId] = useState<string | null>(null);

  // Top navigation view mode: 'carousel' (sleek horizontal ribbon) | 'grid' (expanded matrix)
  const [stepsViewMode, setStepsViewMode] = useState<'carousel' | 'grid'>('carousel');

  // Sharing links and QR logic state
  const [qrType, setQrType] = useState<'reporte' | 'evaluaciones'>('reporte');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [showStep11PortalModal, setShowStep11PortalModal] = useState<boolean>(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedDriverForQr = evaluacionesComportamiento.find(e => e.id === selectedEvalId) || evaluacionesComportamiento[0];
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLinkActive = qrType === 'reporte'
    ? `${baseOrigin}/?canal=como-conduzco&nit=${encodeURIComponent(companyNit)}&empresa=${encodeURIComponent(companyName)}`
    : `${baseOrigin}/?canal=evaluacion-digital&conductorId=${encodeURIComponent(selectedDriverForQr?.id || 'eval-1')}&conductor=${encodeURIComponent(selectedDriverForQr?.nombre || '')}&nit=${encodeURIComponent(companyNit)}&empresa=${encodeURIComponent(companyName)}`;

  useEffect(() => {
    if (qrCanvasRef.current && shareLinkActive) {
      drawQrCodeOnCanvas(qrCanvasRef.current, shareLinkActive, qrType);
    }
  }, [shareLinkActive, qrType, activeStep?.id]);



  const getPhaseName = (phaseId: number) => {
    switch (phaseId) {
      case 1: return 'Fase 1: Planificación (Pasos 1 al 8)';
      case 2: return 'Fase 2: Implementación y Ejecución (Pasos 9 al 19)';
      case 3: return 'Fase 3: Seguimiento y Auditoría (Pasos 20 al 22)';
      default: return '';
    }
  };

  const getPhaseColor = (phaseId: number) => {
    switch (phaseId) {
      case 1: return 'bg-blue-50 text-blue-700 border-blue-200';
      case 2: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 3: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Filter steps based on selected level and optional toggle
  const currentLevel = config.nivelCalculado;
  const activeStepsForLevel = PESV_STEPS.filter(step => {
    const isRequired = step.levels.includes(currentLevel);
    return hideOptional ? isRequired : true;
  });

  const filteredSteps = activeStepsForLevel.filter(step => {
    return selectedPhase === 'ALL' || step.phase === selectedPhase;
  });

  const optionalStepsCount = PESV_STEPS.filter(step => !step.levels.includes(currentLevel)).length;

  // Ensure activeStep stays within the active/applicable steps when level or toggle changes
  useEffect(() => {
    if (activeStep && hideOptional && !activeStep.levels.includes(currentLevel)) {
      const firstApplicable = filteredSteps[0] || activeStepsForLevel[0] || PESV_STEPS[0];
      setActiveStep(firstApplicable);
    }
  }, [currentLevel, hideOptional]);

  const diagnosticQuestions = [
    { id: 'q1', text: '¿Se encuentra designado formalmente un Líder del PESV con licencia en SST vigente?' },
    { id: 'q2', text: '¿Se ha estructurado y firmado la política de seguridad vial de la organización?' },
    { id: 'q3', text: '¿Existe un plan anual de trabajo debidamente aprobado para el periodo vigente?' },
    { id: 'q4', text: '¿Se cuenta con la hoja de vida unificada y digitalizada de todos los conductores?' },
    { id: 'q5', text: '¿Están integradas las alertas de vencimiento de licencias, SOAT y Tecnomecánica?' },
    { id: 'q6', text: '¿Se realiza el 100% de las inspecciones preoperacionales de forma diaria?' },
    { id: 'q7', text: '¿Se ejecutan auditorías internas por lo menos una vez al año?' },
    { id: 'q8', text: '¿Existe un canal estandarizado para que los conductores reporten incidentes en vía?' }
  ];

  const diagnosticScore = Object.values(diagnosticAnswers).filter(Boolean).length;
  const diagnosticPercentage = Math.round((diagnosticScore / diagnosticQuestions.length) * 100);

  return (
    <div className="flex flex-col gap-6 w-full" id="steps-module-root">
      {/* Panel Superior: Menú y Navegador de Pasos Normativos */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 space-y-4" id="steps-navigation-panel">
        {/* Cabecera y Controles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Pasos Normativos de la Resol. 40595 de 2022</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Nivel {config.nivelCalculado} ({PESV_STEPS.filter(s => s.levels.includes(currentLevel)).length} Pasos Aplicables)
              </span>
              {!hideOptional && optionalStepsCount > 0 && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  +{optionalStepsCount} No obligatorios activos
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se han activado automáticamente los pasos aplicables según el nivel de la empresa ({config.nivelCalculado}). Haga clic en un paso para desarrollar su contenido abajo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botón de opción para activar los otros pasos no obligatorios */}
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${
              !hideOptional
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <span className="text-xs font-semibold">
                Activar otros no obligatorios {optionalStepsCount > 0 ? `(${optionalStepsCount})` : ''}
              </span>
              <button
                type="button"
                id="btn-toggle-hide-optional"
                onClick={() => setHideOptional(!hideOptional)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !hideOptional ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                title="Activar o desactivar los pasos no obligatorios para su nivel de aplicabilidad"
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  !hideOptional ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Selector de Modo de Vista (Carrusel vs Cuadrícula) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setStepsViewMode('carousel')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  stepsViewMode === 'carousel'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Carrusel
              </button>
              <button
                type="button"
                onClick={() => setStepsViewMode('grid')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  stepsViewMode === 'grid'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cuadrícula
              </button>
            </div>

            {/* Botones de Navegación Rápida Anterior / Siguiente sobre pasos activos */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!activeStep || filteredSteps.findIndex(s => s.id === activeStep.id) <= 0}
                onClick={() => {
                  const currentIndex = filteredSteps.findIndex(s => s.id === activeStep?.id);
                  if (currentIndex > 0) {
                    setActiveStep(filteredSteps[currentIndex - 1]);
                  }
                }}
                className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Ir al paso activo anterior"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                type="button"
                disabled={!activeStep || filteredSteps.findIndex(s => s.id === activeStep.id) >= filteredSteps.length - 1}
                onClick={() => {
                  const currentIndex = filteredSteps.findIndex(s => s.id === activeStep?.id);
                  if (currentIndex >= 0 && currentIndex < filteredSteps.length - 1) {
                    setActiveStep(filteredSteps[currentIndex + 1]);
                  }
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Ir al paso activo siguiente"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtro de Fases */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="btn-filter-phase-all"
            onClick={() => setSelectedPhase('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
              selectedPhase === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            Pasos Activos ({activeStepsForLevel.length})
          </button>
          {[
            { id: 1, name: 'Fase 1: Planificación' },
            { id: 2, name: 'Fase 2: Implementación' },
            { id: 3, name: 'Fase 3: Seguimiento y Auditoría' }
          ].map((ph) => {
            const phaseCount = activeStepsForLevel.filter(s => s.phase === ph.id).length;
            return (
              <button
                key={ph.id}
                type="button"
                id={`btn-filter-phase-${ph.id}`}
                onClick={() => setSelectedPhase(ph.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  selectedPhase === ph.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {ph.name} ({phaseCount})
              </button>
            );
          })}
        </div>

        {/* Despliegue de Pasos Superiores: Carrusel Horizontal o Cuadrícula Completa */}
        {filteredSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6">
            <ClipboardList className="mx-auto mb-2 opacity-50" size={28} />
            <p className="text-xs">No hay pasos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : stepsViewMode === 'carousel' ? (
          <div className="relative">
            <div className="flex gap-2.5 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar scroll-smooth" id="steps-horizontal-scroll">
              {filteredSteps.map((step) => {
                const isRequired = step.levels.includes(currentLevel);
                const isActive = activeStep?.id === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    id={`btn-step-item-${step.id}`}
                    onClick={() => setActiveStep(step)}
                    className={`shrink-0 w-[230px] sm:w-[250px] text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer relative group ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 shadow-md transform -translate-y-0.5'
                        : 'border-gray-200/80 bg-white hover:border-emerald-300 hover:bg-gray-50/70 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : step.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {step.id}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${getPhaseColor(step.phase)}`}>
                            Fase {step.phase}
                          </span>
                          {!isRequired && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded text-[8px] font-semibold">
                              No obligatorio
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs font-bold line-clamp-2 leading-snug ${isActive ? 'text-emerald-950 font-black' : 'text-gray-900'}`}>
                        {step.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 text-[10px]">
                      <span className={`font-semibold flex items-center gap-1 ${step.completed ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {step.completed ? (
                          <>
                            <CheckCircle2 size={11} /> Listo
                          </>
                        ) : (
                          <>
                            <Clock size={11} /> Pendiente
                          </>
                        )}
                      </span>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-700 font-extrabold' : 'text-gray-400 group-hover:text-emerald-600'}`}>
                        {isActive ? 'Mostrando Abajo ▼' : 'Ver detalle →'}
                      </span>
                    </div>

                    {/* Indicador visual activo apuntando a la pantalla de abajo */}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-emerald-600 rotate-45 rounded-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vista Cuadrícula */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredSteps.map((step) => {
              const isRequired = step.levels.includes(currentLevel);
              const isActive = activeStep?.id === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  id={`btn-step-grid-item-${step.id}`}
                  onClick={() => setActiveStep(step)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 shadow-md'
                      : 'border-gray-200/80 bg-white hover:border-emerald-300 hover:bg-gray-50/70 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-emerald-600 text-white' : step.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {step.id}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 line-clamp-1">{step.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-semibold border ${getPhaseColor(step.phase)}`}>
                          Fase {step.phase}
                        </span>
                        {!isRequired && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded text-[8px] font-semibold">
                            No obligatorio
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-[10px]">
                    <span className={step.completed ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {step.completed ? '✓ Completado' : '• Pendiente'}
                    </span>
                    {isActive && <span className="text-emerald-700 font-extrabold">Activo ▼</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Inferior: Detalle y Desarrollo del Paso a Pantalla Completa */}
      <div className="w-full space-y-6" id="steps-details-panel">
        {activeStep ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-6 flex flex-col justify-between" id="step-detail-card">
            <div>
              {/* Encabezado del Paso con Navegación Rápida */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPhaseColor(activeStep.phase)}`}>
                      {getPhaseName(activeStep.phase)}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">Paso {activeStep.id} de 22</span>
                    {!activeStep.levels.includes(currentLevel) && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Paso No Obligatorio en Nivel {currentLevel}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight">{activeStep.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      disabled={filteredSteps.findIndex(s => s.id === activeStep.id) <= 0}
                      onClick={() => {
                        const currentIndex = filteredSteps.findIndex(s => s.id === activeStep.id);
                        if (currentIndex > 0) setActiveStep(filteredSteps[currentIndex - 1]);
                      }}
                      className="p-1.5 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-gray-700 transition-all cursor-pointer"
                      title="Paso Activo Anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-gray-500 px-1">
                      Paso {activeStep.id}
                    </span>
                    <button
                      type="button"
                      disabled={filteredSteps.findIndex(s => s.id === activeStep.id) >= filteredSteps.length - 1}
                      onClick={() => {
                        const currentIndex = filteredSteps.findIndex(s => s.id === activeStep.id);
                        if (currentIndex >= 0 && currentIndex < filteredSteps.length - 1) setActiveStep(filteredSteps[currentIndex + 1]);
                      }}
                      className="p-1.5 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-gray-700 transition-all cursor-pointer"
                      title="Paso Activo Siguiente"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    activeStep.completed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <CheckCircle2 size={14} />
                    {activeStep.completed ? 'Completado (Evidencia)' : 'Pendiente'}
                  </div>
                </div>
              </div>

              {/* Contenido / Requisitos Normativos */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requisito Normativo (Resol. 40595)</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {activeStep.description}
                </p>
              </div>

              {/* Automatización Tecnológica del Paso */}
              <div className="mb-6 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5 rounded-xl border border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2.5">
                  <Sparkles size={16} />
                  <span>Automatización e Inteligencia del Paso</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  {activeStep.automationSummary}
                </p>

                {/* Zona de Demostración Interactiva del Paso */}
                <div className="border-t border-emerald-200/50 pt-4 mt-1">
                  {/* DEMO PASO 1: Designación de Líder */}
                  {activeStep.id === 1 && (
                    <div className="space-y-6" id="demo-lider-appointment">
                      {/* Editor Section */}
                      <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-xs space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                          <PenTool size={14} className="text-emerald-600" />
                          <h4 className="text-xs font-bold text-gray-800">
                            Redactar Acta de Nombramiento del Líder
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Nombre de la Empresa</label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Representante Legal</label>
                            <input
                              type="text"
                              value={repLegal}
                              onChange={(e) => setRepLegal(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Nombre del Líder Designado</label>
                            <input
                              type="text"
                              value={leaderName}
                              onChange={(e) => setLeaderName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Identificación del Líder (C.C.)</label>
                            <input
                              type="text"
                              value={leaderId}
                              onChange={(e) => setLeaderId(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Nro de Licencia SST del Líder</label>
                            <input
                              type="text"
                              value={leaderLicense}
                              onChange={(e) => setLeaderLicense(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Vencimiento Licencia SST</label>
                            <input
                              type="date"
                              value={leaderLicenseExpiry}
                              onChange={(e) => setLeaderLicenseExpiry(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Fecha del Acta</label>
                            <input
                              type="date"
                              value={appointmentDate}
                              onChange={(e) => setAppointmentDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Código de Acta / Referencia</label>
                            <input
                              type="text"
                              value={actaNumber}
                              onChange={(e) => setActaNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Consideraciones / Introducción del Acta</label>
                            <textarea
                              rows={3}
                              value={actaCustomIntro}
                              onChange={(e) => setActaCustomIntro(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px] font-sans leading-relaxed"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Responsabilidades y Funciones Designadas</label>
                            <textarea
                              rows={4}
                              value={actaResponsibilities}
                              onChange={(e) => setActaResponsibilities(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px] font-mono leading-relaxed"
                              placeholder="Escribe una responsabilidad por línea"
                            />
                          </div>
                        </div>

                        {/* Signatures Upload section */}
                        <div className="border-t border-gray-100 pt-3 space-y-3">
                          <span className="block text-xs font-bold text-gray-700">Cargar Firmas Digitales (JPG, PNG)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Firma Rep Legal */}
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-between gap-2 text-xs">
                              <span className="font-semibold text-gray-700">Firma Representante Legal</span>
                              {repSignatureImg1 ? (
                                <div className="relative border border-emerald-200 bg-white p-1.5 rounded flex items-center justify-between">
                                  <img src={repSignatureImg1} alt="Firma Representante" className="max-h-12 object-contain" />
                                  <button
                                    type="button"
                                    onClick={() => setRepSignatureImg1('')}
                                    className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                                    title="Eliminar Firma"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <label className="border border-dashed border-gray-300 hover:border-emerald-500 bg-white rounded p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                                  <Upload size={14} className="text-gray-400" />
                                  <span className="text-[10px] text-gray-500">Seleccionar firma (JPG/PNG)</span>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => handleSignatureUpload(e, setRepSignatureImg1)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {/* Firma Líder */}
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-between gap-2 text-xs">
                              <span className="font-semibold text-gray-700">Firma Líder del PESV</span>
                              {leaderSignatureImg ? (
                                <div className="relative border border-emerald-200 bg-white p-1.5 rounded flex items-center justify-between">
                                  <img src={leaderSignatureImg} alt="Firma Líder" className="max-h-12 object-contain" />
                                  <button
                                    type="button"
                                    onClick={() => setLeaderSignatureImg('')}
                                    className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                                    title="Eliminar Firma"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <label className="border border-dashed border-gray-300 hover:border-emerald-500 bg-white rounded p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                                  <Upload size={14} className="text-gray-400" />
                                  <span className="text-[10px] text-gray-500">Seleccionar firma (JPG/PNG)</span>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => handleSignatureUpload(e, setLeaderSignatureImg)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => setGeneratedActa(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Check size={14} /> Actualizar Vista de Acta
                          </button>
                        </div>
                      </div>

                      {/* Preview Document */}
                      {generatedActa && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 size={15} className="text-emerald-600" />
                                Vista Previa del Acta Oficial
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Formato Carta (Letter 215.9 x 279.4 mm)
                              </span>
                              <span className="hidden sm:inline text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                Paginación Dinámica
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadPDF('acta-document-container', `Acta_Nombramiento_Lider_${leaderName.replace(/\s+/g, '_')}.pdf`)}
                              disabled={isExporting !== null}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:bg-gray-400"
                            >
                              <Download size={13} />
                              {isExporting === 'acta-document-container' ? 'Generando PDF Carta...' : 'Descargar Acta en PDF (Carta)'}
                            </button>
                          </div>

                          {/* Hoja de papel Tamaño Carta (Proporción 8.5 x 11 pulgadas) */}
                          <div
                            className="bg-white p-8 sm:p-12 rounded-sm border border-gray-300 max-w-[760px] mx-auto shadow-md text-slate-800 font-sans text-[11px] leading-relaxed space-y-5"
                            id="acta-document-container"
                          >
                            {/* Cabezote Institucional Formal */}
                            <div className="border border-slate-700 rounded-sm bg-slate-50/70 p-4 relative text-center space-y-1">
                              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-sm" />
                              {isImageLogo && (
                                <div className="flex justify-center mb-1.5">
                                  <img src={companyLogo} alt={companyName} className="h-10 max-w-[140px] object-contain bg-white px-2 py-0.5 rounded border border-gray-200" />
                                </div>
                              )}
                              <p className="text-[9px] text-slate-500 tracking-wider font-extrabold uppercase">
                                SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV)
                              </p>
                              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                {companyName}
                              </h2>
                              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-tight">
                                ACTA DE NOMBRAMIENTO Y DELEGACIÓN DEL LÍDER DEL PESV
                              </h3>
                              <p className="text-[9px] text-slate-500 font-mono">
                                CÓDIGO: <strong>{actaNumber}</strong> • FECHA: <strong>{appointmentDate}</strong> • CONFORME A RESOLUCIÓN 40595 DE 2022 (PASO 1)
                              </p>
                            </div>

                            {/* Fundamento Legal e Introducción */}
                            <div className="space-y-2.5 text-justify text-slate-750">
                              <p>
                                Siendo el día <strong>{appointmentDate}</strong>, la Alta Dirección de la empresa <strong>{companyName}</strong>, en ejercicio de sus facultades legales y estatutarias, y en especial cumplimiento del <strong>Paso 1 de la Metodología para el diseño, implementación y verificación del Plan Estratégico de Seguridad Vial (Resolución 40595 de 2022 del Ministerio de Transporte de Colombia)</strong>, se permite formalizar la designación de funciones para el liderazgo del PESV.
                              </p>

                              {actaCustomIntro && (
                                <p className="text-slate-700 italic border-l-2 border-slate-300 pl-3 py-0.5">
                                  {actaCustomIntro}
                                </p>
                              )}
                            </div>

                            {/* 1. Datos del Líder Designado */}
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                                1. Identificación y Perfil del Líder Designado
                              </h4>
                              <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden">
                                <div className="bg-slate-100/90 px-3 py-1 border-b border-slate-200">
                                  <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">
                                    Perfil Técnico y Acreditación Legal
                                  </span>
                                </div>
                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-[10.5px]">
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9.5px]">Nombre Completo:</span>
                                    <strong className="text-slate-900">{leaderName}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9.5px]">Licencia en SST:</span>
                                    <strong className="text-slate-900">{leaderLicense}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9.5px]">Documento de Identidad:</span>
                                    <strong className="text-slate-900">{leaderId}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-bold block text-[9.5px]">Vigencia Licencia SST:</span>
                                    <strong className="text-slate-900">{leaderLicenseExpiry}</strong>
                                  </div>
                                  <div className="sm:col-span-2 pt-1 border-t border-slate-150">
                                    <span className="text-slate-500 font-bold block text-[9.5px]">Función Asignada:</span>
                                    <span className="text-emerald-800 font-bold">Líder del PESV (Diseño, Implementación, Seguimiento y Mejora Continua)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Responsabilidades Asignadas */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                                2. Responsabilidades y Obligaciones Asignadas al Líder del PESV
                              </h4>
                              <p className="text-[10px] text-slate-600">
                                De conformidad con el Paso 1 de la Resolución 40595 de 2022, el líder designado asume de manera expresa las siguientes facultades y deberes:
                              </p>
                              <div className="space-y-1.5 pl-1">
                                {actaResponsibilities.split('\n').filter(Boolean).map((resp, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[10.5px] text-slate-750">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                    <span>{resp.replace(/^[0-9]+[.\-)]\s*/, '')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 3. Aceptación y Compromiso */}
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                                3. Declaración de Aceptación y Compromiso
                              </h4>
                              <p className="text-justify text-slate-750">
                                El líder designado manifiesta mediante la suscripción de la presente acta la aceptación integral de la designación, asumiendo el compromiso ético, legal y profesional de coordinar la formulación, ejecución, seguimiento y evaluación del Plan Estratégico de Seguridad Vial de <strong>{companyName}</strong>, en consonancia con la Política de Seguridad Vial de la organización y el SG-SST.
                              </p>
                            </div>

                            {/* 4. Constancia y Firmas */}
                            <div className="border-t border-slate-200 pt-5 mt-6 space-y-4">
                              <p className="text-center text-[9.5px] font-bold text-slate-600 uppercase">
                                En constancia de nombramiento, aceptación y compromiso se suscribe a la fecha {appointmentDate}:
                              </p>

                              <div className="grid grid-cols-2 gap-8 pt-2">
                                {/* Firma Representante Legal */}
                                <div className="text-center space-y-2 flex flex-col justify-end">
                                  <div className="h-16 flex items-end justify-center pb-1">
                                    {repSignatureImg1 ? (
                                      <img src={repSignatureImg1} alt="Firma Representante" className="max-h-14 max-w-full object-contain mx-auto" />
                                    ) : (
                                      <div className="w-40 border-b border-slate-300 text-slate-400 font-serif italic text-xs pb-1">
                                        Diana P. Osorio
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t border-slate-400 w-full" />
                                  <div className="text-[9px] text-slate-600 space-y-0.5">
                                    <strong className="text-slate-900 block text-[10px]">{repLegal}</strong>
                                    <span>Representante Legal</span>
                                    <span className="block text-slate-500">{companyName}</span>
                                  </div>
                                </div>

                                {/* Firma Líder PESV */}
                                <div className="text-center space-y-2 flex flex-col justify-end">
                                  <div className="h-16 flex items-end justify-center pb-1">
                                    {leaderSignatureImg ? (
                                      <img src={leaderSignatureImg} alt="Firma Líder" className="max-h-14 max-w-full object-contain mx-auto" />
                                    ) : (
                                      <div className="w-40 border-b border-slate-300 text-slate-400 font-serif italic text-xs pb-1">
                                        Carlos Restrepo
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t border-slate-400 w-full" />
                                  <div className="text-[9px] text-slate-600 space-y-0.5">
                                    <strong className="text-slate-900 block text-[10px]">{leaderName}</strong>
                                    <span>Líder del PESV Designado</span>
                                    <span className="block text-slate-500">Lic. SST Nro. {leaderLicense} • Vence: {leaderLicenseExpiry}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Pie Institucional del Documento */}
                            <div className="border-t border-slate-200 pt-3 mt-4 flex justify-between items-center text-[8px] text-slate-400">
                              <span>Documento oficial PESV • {companyName} • Formato Carta • Res. 40595 de 2022</span>
                              <span>Página 1 de 1 (Auto-paginación inteligente en PDF)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DEMO PASO 3: Generador de Política de Seguridad Vial de la Organización */}
                  {activeStep.id === 3 && (
                    <div className="space-y-4" id="demo-politica-generator">
                      <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-xs space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                          <PenTool size={14} className="text-emerald-600" />
                          <h4 className="text-xs font-bold text-gray-800">
                            Editar y Configurar Política de Seguridad Vial
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Nombre de la Empresa</label>
                            <input
                              type="text"
                              id="policy-company-name-input"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Representante Legal (Firma)</label>
                            <input
                              type="text"
                              id="policy-rep-legal-input"
                              value={repLegal}
                              onChange={(e) => setRepLegal(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">Fecha de la Política</label>
                            <input
                              type="date"
                              value={policyDate}
                              onChange={(e) => setPolicyDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Declaratoria General de la Política (Editable)</label>
                          <textarea
                            rows={3}
                            value={policyCustomText}
                            onChange={(e) => setPolicyCustomText(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-[11px] font-sans leading-relaxed text-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Compromisos Clave de Seguridad:</label>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-gray-600">
                            {[
                              'Velocidad máxima de 80 km/h en carreteras nacionales y 30 km/h en zonas urbanas.',
                              'Política de Cero Alcohol, Drogas y Sustancias Psicoactivas.',
                              'Prohibición estricta del uso de dispositivos de comunicación bidireccional mientras se conduce.',
                              'Uso obligatorio de Equipos de Protección Personal (EPP) y cinturón de seguridad.',
                              'Cumplimiento del plan de mantenimiento preventivo de la flota.',
                              'Exigencia de pausas activas obligatorias cada 4 horas de conducción continua.'
                            ].map((comm) => {
                              const isChecked = selectedCommitments.includes(comm);
                              return (
                                <label key={comm} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    id={`checkbox-commitment-${comm.substring(0, 10)}`}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedCommitments(selectedCommitments.filter(c => c !== comm));
                                      } else {
                                        setSelectedCommitments([...selectedCommitments, comm]);
                                      }
                                    }}
                                    className="mt-0.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 rounded"
                                  />
                                  <span>{comm}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Signature Upload section for Policy */}
                        <div className="border-t border-gray-100 pt-3 text-xs space-y-2">
                          <span className="block font-bold text-gray-700">Cargar Firma del Representante Legal (JPG, PNG)</span>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-between gap-2 max-w-sm">
                            {repSignatureImg2 ? (
                              <div className="relative border border-emerald-200 bg-white p-1.5 rounded flex items-center justify-between">
                                <img src={repSignatureImg2} alt="Firma Representante" className="max-h-12 object-contain" />
                                <button
                                  type="button"
                                  onClick={() => setRepSignatureImg2('')}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                                  title="Eliminar Firma"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <label className="border border-dashed border-gray-300 hover:border-emerald-500 bg-white rounded p-2.5 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                                <Upload size={14} className="text-gray-400" />
                                <span className="text-[10px] text-gray-500">Seleccionar firma en JPG o PNG</span>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg"
                                  onChange={(e) => handleSignatureUpload(e, setRepSignatureImg2)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="text-right border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            id="btn-generate-policy"
                            onClick={() => setGeneratedPolicy(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Check size={14} /> Actualizar Vista de Política
                          </button>
                        </div>
                      </div>

                      {/* Documento Generado */}
                      {generatedPolicy && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-gray-100/80 px-4 py-2 rounded-lg border border-gray-200">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              Vista Previa de la Política Firmada
                            </span>
                            <button
                              type="button"
                              id="btn-download-policy"
                              onClick={() => downloadPDF('policy-document-container', `Politica_Seguridad_Vial_${companyName.replace(/\s+/g, '_')}.pdf`)}
                              disabled={isExporting !== null}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:bg-gray-400"
                              title="Descargar PDF"
                            >
                              <Download size={12} />
                              {isExporting === 'policy-document-container' ? 'Generando PDF...' : 'Descargar en PDF'}
                            </button>
                          </div>

                          <div
                            className="bg-white p-6 sm:p-8 rounded-lg border border-gray-250 text-gray-850 font-serif text-[11px] leading-relaxed space-y-4 shadow-sm relative overflow-hidden"
                            id="policy-document-container"
                          >
                            <div className="text-center font-sans font-bold uppercase tracking-tight text-gray-900 border-b border-gray-300/60 pb-2.5 flex flex-col items-center">
                              {isImageLogo && (
                                <img src={companyLogo} alt={companyName} className="h-10 max-w-[140px] object-contain mb-1.5 bg-white px-2 py-0.5 rounded border border-gray-200" />
                              )}
                              <span className="text-[9px] text-gray-500 tracking-widest font-extrabold mb-1">SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV)</span>
                              <span className="text-xs text-gray-950 font-black">{companyName}</span>
                              <span className="text-[10px] text-gray-800 border-t border-gray-200 mt-1.5 pt-1 font-semibold">POLÍTICA DE SEGURIDAD VIAL LABORAL</span>
                              <span className="text-[8px] text-gray-500 font-mono mt-0.5 font-normal">Cód: PESV-POL-001 v2 • Conforme a Resol. 40595 de 2022</span>
                            </div>

                            <p className="leading-relaxed text-justify text-gray-800">
                              {policyCustomText}
                            </p>

                            <div className="space-y-1.5">
                              <span className="font-bold text-gray-950 font-sans text-[9.5px]">COMPROMISOS CORPORATIVOS CLAVE:</span>
                              <ul className="list-disc pl-4 space-y-1 text-gray-800">
                                {selectedCommitments.map((comm, idx) => (
                                  <li key={idx} className="leading-relaxed">{comm}</li>
                                ))}
                              </ul>
                            </div>

                            <p className="leading-relaxed text-justify text-gray-800">
                              Esta política será divulgada de manera proactiva a todo el personal, contratistas, proveedores y partes interesadas. Asimismo, se mantendrá actualizada y evaluada periódicamente bajo el marco del ciclo de mejora continua PHVA de nuestra organización.
                            </p>

                            <div className="border-t border-gray-300/60 pt-4 mt-6 flex justify-between items-end font-sans">
                              <div className="space-y-2 flex flex-col justify-end">
                                <div className="h-14 flex items-end justify-center pb-1">
                                  {repSignatureImg2 ? (
                                    <img src={repSignatureImg2} alt="Firma Representante Legal" className="max-h-12 max-w-full object-contain mx-auto" />
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic border-b border-gray-200 w-36 text-center pb-1 font-serif">Diana P. Osorio</span>
                                  )}
                                </div>
                                <div className="border-t border-gray-300 w-36" />
                                <div className="text-[8.5px] text-gray-500">
                                  <strong className="text-gray-800">{repLegal}</strong>
                                  <br />Representante Legal
                                  <br />{companyName}
                                </div>
                              </div>
                              <div className="text-right text-[8.5px] text-gray-500">
                                <strong>Fecha de Emisión:</strong> {policyDate}
                                <br /><strong>Referencia:</strong> SG-PESV-POL-001 v2
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DEMO PASO 2 & 4: Comité de Seguridad Vial & Liderazgo Directivo */}
                  {(activeStep.id === 2 || activeStep.id === 4) && (
                    <div className="space-y-6">
                      {/* Subtabs to navigate between Committee and Manager's Checklist */}
                      <div className="flex border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            const s2 = PESV_STEPS.find(s => s.id === 2);
                            if (s2) setActiveStep(s2);
                            setActiveStep3Tab('comite');
                          }}
                          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                            activeStep.id === 2
                              ? 'border-sky-600 text-sky-600 font-extrabold'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Users size={14} />
                          Paso 2: Comité de Seguridad Vial
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const s4 = PESV_STEPS.find(s => s.id === 4);
                            if (s4) setActiveStep(s4);
                            setActiveStep3Tab('liderazgo');
                          }}
                          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                            activeStep.id === 4
                              ? 'border-sky-600 text-sky-600 font-extrabold'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Shield size={14} />
                          Paso 4: Liderazgo y Compromiso Directivo
                        </button>
                      </div>

                      {/* TAB 1: COMITE DE SEGURIDAD VIAL */}
                      {activeStep.id === 2 && (
                        <div className="space-y-6">
                          {/* Info banner */}
                          <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-100 flex gap-3 text-xs text-sky-950">
                            <Users size={24} className="text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-sky-900">Comité de Seguridad Vial (Paso 2 - Resol. 40595)</h4>
                              <p className="mt-1 text-gray-600 leading-relaxed">
                                El Comité de Seguridad Vial es el órgano responsable de coordinar la planeación, implementación y seguimiento del PESV. <strong>Aplica de forma obligatoria para los niveles Estándar y Avanzado</strong>. Aquí podrá registrar los miembros del comité, formular actas oficiales de reuniones periódicas con asignación de compromisos y generar las firmas digitales correspondientes.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Panel izquierdo: Miembros del Comité */}
                            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                              <h3 className="text-xs font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider border-b border-gray-100 pb-2">
                                <Users size={14} className="text-sky-600" />
                                1. Miembros del Comité Activos
                              </h3>

                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {committeeMembers.map((member) => (
                                  <div key={member.id} className="p-2.5 border border-gray-100 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 hover:bg-gray-50 text-[11px] gap-2">
                                    <div className="space-y-1 flex-1">
                                      <div className="font-bold text-gray-900">{member.nombre}</div>
                                      <div className="text-gray-500">{member.cargo} — <span className="font-bold text-sky-700">{member.rolComite}</span></div>
                                      <div className="text-gray-400 text-[10px]">{member.email}</div>
                                      
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-gray-400 text-[10px]">Firma:</span>
                                        {member.firma && member.firma.startsWith('data:image/') ? (
                                          <div className="flex items-center gap-1.5">
                                            <img src={member.firma} alt="Firma" className="h-6 bg-white border border-gray-250 rounded px-1 object-contain" referrerPolicy="no-referrer" />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCommitteeMembers(committeeMembers.map(m => m.id === member.id ? { ...m, firma: m.nombre } : m));
                                              }}
                                              className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                            >
                                              Quitar
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="font-serif italic text-[10px] text-sky-800 font-bold">{member.firma || 'Ninguna'}</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-1.5 md:pt-0 border-gray-150">
                                      <div className="flex items-center gap-1">
                                        {member.firmado ? (
                                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-200">
                                            <Check size={10} /> Firmado
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCommitteeMembers(committeeMembers.map(m => m.id === member.id ? { ...m, firmado: true, firma: m.firma || m.nombre } : m));
                                            }}
                                            className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer"
                                          >
                                            Por Firmar
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex gap-1.5 items-center">
                                        <label className="text-[9px] bg-sky-50 hover:bg-sky-100 text-sky-850 font-bold px-1.5 py-0.5 rounded border border-sky-200 cursor-pointer flex items-center gap-0.5">
                                          <Upload size={10} />
                                          <span>Imagen</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              handleSignatureUploadCallback(e, (base64) => {
                                                setCommitteeMembers(committeeMembers.map(m => m.id === member.id ? { ...m, firmado: true, firma: base64 } : m));
                                              });
                                            }}
                                          />
                                        </label>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingMemberId(member.id);
                                            setNewMember({
                                              nombre: member.nombre,
                                              cargo: member.cargo,
                                              rolComite: member.rolComite,
                                              email: member.email,
                                              firma: member.firma,
                                              firmado: member.firmado
                                            });
                                            document.getElementById('form-comite-member')?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="text-[9px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCommitteeMembers(committeeMembers.filter(m => m.id !== member.id));
                                            if (editingMemberId === member.id) {
                                              setEditingMemberId(null);
                                              setNewMember({ nombre: '', cargo: '', rolComite: 'Vocal', email: '', firma: '', firmado: false });
                                            }
                                          }}
                                          className="text-[9px] text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Formulario Agregar/Editar Miembro */}
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-3" id="form-comite-member">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">
                                    {editingMemberId ? 'Editar Miembro del Comité' : 'Nuevo Miembro'}
                                  </h4>
                                  {editingMemberId && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                      Modo Edición
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Nombre Completo</label>
                                    <input
                                      type="text"
                                      value={newMember.nombre}
                                      onChange={(e) => setNewMember({ ...newMember, nombre: e.target.value })}
                                      placeholder="ej. Juan Pérez"
                                      className="w-full p-1.5 border border-gray-200 rounded text-[11px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Cargo Empresa</label>
                                    <input
                                      type="text"
                                      value={newMember.cargo}
                                      onChange={(e) => setNewMember({ ...newMember, cargo: e.target.value })}
                                      placeholder="ej. Supervisor SST"
                                      className="w-full p-1.5 border border-gray-200 rounded text-[11px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Rol en Comité</label>
                                    <select
                                      value={newMember.rolComite}
                                      onChange={(e) => setNewMember({ ...newMember, rolComite: e.target.value as any })}
                                      className="w-full p-1.5 border border-gray-200 rounded text-[11px] bg-white font-semibold text-gray-700"
                                    >
                                      <option value="Presidente">Presidente</option>
                                      <option value="Secretario">Secretario</option>
                                      <option value="Vocal">Vocal</option>
                                      <option value="Representante de Conductores">Rep. Conductores</option>
                                      <option value="Asesor Externo">Asesor Externo</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Email</label>
                                    <input
                                      type="email"
                                      value={newMember.email}
                                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                      placeholder="ej. juan@empresa.com"
                                      className="w-full p-1.5 border border-gray-200 rounded text-[11px]"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-gray-500 font-bold mb-1">Firma Digital</label>
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={newMember.firma && newMember.firma.startsWith('data:image/') ? 'Imagen cargada' : newMember.firma}
                                        disabled={newMember.firma && newMember.firma.startsWith('data:image/')}
                                        onChange={(e) => setNewMember({ ...newMember, firma: e.target.value })}
                                        placeholder="Escriba texto o cargue una imagen"
                                        className="flex-1 p-1.5 border border-gray-200 rounded text-[11px] font-mono italic text-sky-800"
                                      />
                                      <label className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-250 border border-gray-300 rounded text-gray-700 text-[11px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-1">
                                        <Upload size={12} />
                                        <span>Cargar Imagen</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            handleSignatureUploadCallback(e, (base64) => {
                                              setNewMember({ ...newMember, firma: base64, firmado: true });
                                            });
                                          }}
                                        />
                                      </label>
                                      {newMember.firma && newMember.firma.startsWith('data:image/') && (
                                        <button
                                          type="button"
                                          onClick={() => setNewMember({ ...newMember, firma: '' })}
                                          className="text-red-500 text-[11px] font-bold hover:underline cursor-pointer"
                                        >
                                          Quitar
                                        </button>
                                      )}
                                    </div>
                                    {newMember.firma && newMember.firma.startsWith('data:image/') && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">Vista previa:</span>
                                        <img src={newMember.firma} alt="Preview" className="h-6 bg-white border rounded px-1 object-contain" referrerPolicy="no-referrer" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newMember.nombre || !newMember.cargo || !newMember.email) {
                                        alert('Por favor complete el nombre, cargo y correo del miembro.');
                                        return;
                                      }
                                      if (editingMemberId) {
                                        setCommitteeMembers(committeeMembers.map(m => m.id === editingMemberId ? {
                                          ...m,
                                          nombre: newMember.nombre,
                                          cargo: newMember.cargo,
                                          rolComite: newMember.rolComite,
                                          email: newMember.email,
                                          firma: newMember.firma || newMember.nombre,
                                          firmado: true
                                        } : m));
                                        setEditingMemberId(null);
                                      } else {
                                        const genId = 'cm-' + Date.now();
                                        setCommitteeMembers([...committeeMembers, {
                                          id: genId,
                                          nombre: newMember.nombre,
                                          cargo: newMember.cargo,
                                          rolComite: newMember.rolComite,
                                          email: newMember.email,
                                          firma: newMember.firma || newMember.nombre,
                                          firmado: true
                                        }]);
                                      }
                                      setNewMember({
                                        nombre: '',
                                        cargo: '',
                                        rolComite: 'Vocal',
                                        email: '',
                                        firma: '',
                                        firmado: false
                                      });
                                    }}
                                    className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] rounded transition-colors cursor-pointer flex justify-center items-center gap-1"
                                  >
                                    {editingMemberId ? <Check size={12} /> : <Plus size={12} />}
                                    {editingMemberId ? 'Guardar Cambios del Miembro' : 'Registrar Miembro en Comité'}
                                  </button>
                                  {editingMemberId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMemberId(null);
                                        setNewMember({
                                          nombre: '',
                                          cargo: '',
                                          rolComite: 'Vocal',
                                          email: '',
                                          firma: '',
                                          firmado: false
                                        });
                                      }}
                                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[11px] rounded cursor-pointer transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Panel derecho: Actas de Reuniones */}
                            <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                              <h3 className="text-xs font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider border-b border-gray-100 pb-2">
                                <FileText size={14} className="text-sky-600" />
                                2. Gestión de Actas del Comité
                              </h3>

                              {/* Selector de Acta */}
                              <div className="flex gap-2 items-center">
                                <label className="text-[11px] font-bold text-gray-600 whitespace-nowrap">Seleccionar Acta:</label>
                                <select
                                  value={selectedMeetingId}
                                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                                  className="p-1.5 border border-gray-200 rounded text-[11px] bg-white font-semibold text-gray-800 flex-1"
                                >
                                  {committeeMeetings.map(m => (
                                    <option key={m.id} value={m.id}>{m.numeroActa} — {m.fecha}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Mostrar detalles del acta seleccionada */}
                              {(() => {
                                const meeting = committeeMeetings.find(m => m.id === selectedMeetingId);
                                if (!meeting) return <p className="text-xs text-gray-400 italic">No se encontró el acta seleccionada.</p>;
                                return (
                                  <div className="space-y-4 text-[11px]">
                                    <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 space-y-2">
                                      <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                                        <span className="font-extrabold text-[10px] text-gray-700 uppercase">Detalles Generales del Acta</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!showEditMeetingModal) {
                                              setEditMeetingForm({
                                                numeroActa: meeting.numeroActa,
                                                fecha: meeting.fecha,
                                                temasDiscutidos: meeting.temasDiscutidos
                                              });
                                            }
                                            setShowEditMeetingModal(!showEditMeetingModal);
                                          }}
                                          className="text-[9.5px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                          <Edit size={11} /> {showEditMeetingModal ? 'Cancelar Edición' : 'Editar Información'}
                                        </button>
                                      </div>

                                      {showEditMeetingModal ? (
                                        <div className="space-y-2 pt-1">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Número de Acta</label>
                                              <input
                                                type="text"
                                                value={editMeetingForm.numeroActa}
                                                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, numeroActa: e.target.value })}
                                                className="w-full p-1 border border-gray-200 rounded text-[11px] font-semibold bg-white"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Fecha Reunión</label>
                                              <input
                                                type="date"
                                                value={editMeetingForm.fecha}
                                                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, fecha: e.target.value })}
                                                className="w-full p-1 border border-gray-200 rounded text-[11px] font-mono bg-white"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Temas Tratados / Orden del Día</label>
                                            <textarea
                                              rows={3}
                                              value={editMeetingForm.temasDiscutidos}
                                              onChange={(e) => setEditMeetingForm({ ...editMeetingForm, temasDiscutidos: e.target.value })}
                                              className="w-full p-1.5 border border-gray-200 rounded text-[10.5px] bg-white"
                                            />
                                          </div>
                                          <div className="flex justify-end gap-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => setShowEditMeetingModal(false)}
                                              className="px-2.5 py-1 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold cursor-pointer"
                                            >
                                              Cancelar
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!editMeetingForm.numeroActa || !editMeetingForm.fecha) {
                                                  alert('Por favor complete número y fecha del acta.');
                                                  return;
                                                }
                                                const updated = committeeMeetings.map(m => {
                                                  if (m.id === meeting.id) {
                                                    return {
                                                      ...m,
                                                      numeroActa: editMeetingForm.numeroActa,
                                                      fecha: editMeetingForm.fecha,
                                                      temasDiscutidos: editMeetingForm.temasDiscutidos
                                                    };
                                                  }
                                                  return m;
                                                });
                                                setCommitteeMeetings(updated);
                                                setShowEditMeetingModal(false);
                                              }}
                                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-extrabold cursor-pointer"
                                            >
                                              Guardar Cambios del Acta
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <strong>Número de Acta:</strong> {meeting.numeroActa}
                                          </div>
                                          <div>
                                            <strong>Fecha Reunión:</strong> {meeting.fecha}
                                          </div>
                                          <div className="col-span-2">
                                            <strong>Temas Tratados:</strong>
                                            <p className="text-gray-600 mt-1 text-[10.5px] leading-relaxed whitespace-pre-line bg-white p-2 border border-gray-100 rounded">
                                              {meeting.temasDiscutidos}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Compromisos de esta Acta */}
                                    <div className="space-y-2">
                                      <span className="font-extrabold text-gray-700 block uppercase tracking-wider text-[10px]">Compromisos y Tareas del Acta</span>
                                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <table className="w-full text-left text-[11px] border-collapse font-sans">
                                          <thead>
                                            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-200 text-[9.5px]">
                                              <th className="p-2 border-r border-gray-200">Compromiso / Tarea</th>
                                              <th className="p-2 border-r border-gray-200">Responsable</th>
                                              <th className="p-2 text-center">Límite</th>
                                              <th className="p-2 text-center">Acción</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {meeting.compromisos.length === 0 ? (
                                              <tr>
                                                <td colSpan={4} className="p-3 text-center text-gray-400 italic">No hay compromisos registrados en esta acta.</td>
                                              </tr>
                                            ) : (
                                              meeting.compromisos.map(comp => (
                                                <tr key={comp.id} className="hover:bg-gray-50/50">
                                                  <td className="p-2 text-gray-800 leading-tight">{comp.tarea}</td>
                                                  <td className="p-2 font-semibold text-gray-750">{comp.responsable}</td>
                                                  <td className="p-2 text-center text-gray-600 font-mono whitespace-nowrap">{comp.fechaLimite}</td>
                                                  <td className="p-2 text-center whitespace-nowrap">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingCompromisoId(comp.id);
                                                        setTempCompromiso({
                                                          tarea: comp.tarea,
                                                          responsable: comp.responsable,
                                                          fechaLimite: comp.fechaLimite
                                                        });
                                                      }}
                                                      className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer text-[10px] mr-2"
                                                    >
                                                      Editar
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const updatedMeetings = committeeMeetings.map(m => {
                                                          if (m.id === meeting.id) {
                                                            return { ...m, compromisos: m.compromisos.filter(c => c.id !== comp.id) };
                                                          }
                                                          return m;
                                                        });
                                                        setCommitteeMeetings(updatedMeetings);
                                                      }}
                                                      className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer text-[10px]"
                                                    >
                                                      Eliminar
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))
                                            )}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Añadir / Editar compromiso */}
                                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                                          <span>{editingCompromisoId ? 'Editar Compromiso' : 'Nuevo Compromiso'}</span>
                                          {editingCompromisoId && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCompromisoId(null);
                                                setTempCompromiso({ tarea: '', responsable: '', fechaLimite: '' });
                                              }}
                                              className="text-gray-500 hover:text-gray-700 font-bold text-[9px] cursor-pointer"
                                            >
                                              Cancelar Edición
                                            </button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                          <div className="sm:col-span-5">
                                            <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Descripción de Tarea</label>
                                            <input
                                              type="text"
                                              placeholder="ej. Realizar inspección preoperacional..."
                                              value={tempCompromiso.tarea}
                                              onChange={(e) => setTempCompromiso({ ...tempCompromiso, tarea: e.target.value })}
                                              className="w-full p-1 border border-gray-200 rounded text-[11px] bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-4">
                                            <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Responsable</label>
                                            <select
                                              value={tempCompromiso.responsable}
                                              onChange={(e) => setTempCompromiso({ ...tempCompromiso, responsable: e.target.value })}
                                              className="w-full p-1 border border-gray-200 bg-white rounded text-[11px] font-semibold text-gray-700"
                                            >
                                              <option value="">Seleccionar responsable...</option>
                                              {committeeMembers.map(m => (
                                                <option key={m.id} value={m.nombre}>{m.nombre} ({m.rolComite})</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="sm:col-span-2">
                                            <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Fecha Límite</label>
                                            <input
                                              type="date"
                                              value={tempCompromiso.fechaLimite}
                                              onChange={(e) => setTempCompromiso({ ...tempCompromiso, fechaLimite: e.target.value })}
                                              className="w-full p-0.5 border border-gray-200 rounded text-[11px] font-mono text-center bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!tempCompromiso.tarea || !tempCompromiso.responsable || !tempCompromiso.fechaLimite) {
                                                  alert('Por favor complete todos los campos para el compromiso.');
                                                  return;
                                                }
                                                const updatedMeetings = committeeMeetings.map(m => {
                                                  if (m.id === meeting.id) {
                                                    if (editingCompromisoId) {
                                                      return {
                                                        ...m,
                                                        compromisos: m.compromisos.map(c => c.id === editingCompromisoId ? {
                                                          ...c,
                                                          ...tempCompromiso
                                                        } : c)
                                                      };
                                                    } else {
                                                      return {
                                                        ...m,
                                                        compromisos: [
                                                          ...m.compromisos,
                                                          { id: 'comp-' + Date.now(), ...tempCompromiso }
                                                        ]
                                                      };
                                                    }
                                                  }
                                                  return m;
                                                });
                                                setCommitteeMeetings(updatedMeetings);
                                                setEditingCompromisoId(null);
                                                setTempCompromiso({ tarea: '', responsable: '', fechaLimite: '' });
                                              }}
                                              className="w-full py-1 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded cursor-pointer text-[10px] flex justify-center items-center"
                                              title={editingCompromisoId ? 'Guardar Cambios' : 'Agregar Compromiso'}
                                            >
                                              {editingCompromisoId ? <Check size={12} /> : <Plus size={12} />}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Asistentes a esta Acta */}
                                    <div className="space-y-1.5">
                                      <span className="font-extrabold text-gray-700 block uppercase tracking-wider text-[10px]">Asistencia de Miembros</span>
                                      <div className="flex flex-wrap gap-2">
                                        {committeeMembers.map(member => {
                                          const isAsistente = meeting.asistentesIds.includes(member.id);
                                          return (
                                            <label
                                              key={member.id}
                                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                                                isAsistente
                                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                                  : 'bg-white text-gray-450 border-gray-200'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isAsistente}
                                                onChange={() => {
                                                  const newAsistentes = isAsistente
                                                    ? meeting.asistentesIds.filter(id => id !== member.id)
                                                    : [...meeting.asistentesIds, member.id];
                                                  setCommitteeMeetings(committeeMeetings.map(m => m.id === meeting.id ? { ...m, asistentesIds: newAsistentes } : m));
                                                }}
                                                className="rounded text-sky-600 focus:ring-sky-500 w-3 h-3"
                                              />
                                              <span>{member.nombre} ({member.rolComite})</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Formulario Crear Nueva Acta */}
                              <div className="pt-3 border-t border-gray-100">
                                <details className="group">
                                  <summary className="text-[11px] font-bold text-sky-600 hover:text-sky-800 cursor-pointer list-none flex items-center gap-1">
                                    <Plus size={12} className="group-open:rotate-45 transition-transform" />
                                    Crear un Acta de Reunión desde Cero
                                  </summary>
                                  <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-3 text-[11px]">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-gray-500 font-bold mb-0.5">Código / Nro. Acta</label>
                                        <input
                                          type="text"
                                          placeholder="ej. CSV-ACT-002"
                                          value={newMeeting.numeroActa}
                                          onChange={(e) => setNewMeeting({ ...newMeeting, numeroActa: e.target.value })}
                                          className="w-full p-1.5 border border-gray-200 rounded"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-500 font-bold mb-0.5">Fecha Reunión</label>
                                        <input
                                          type="date"
                                          value={newMeeting.fecha}
                                          onChange={(e) => setNewMeeting({ ...newMeeting, fecha: e.target.value })}
                                          className="w-full p-1.5 border border-gray-200 rounded font-mono text-center"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-gray-500 font-bold mb-0.5">Temas Discutidos (Listar puntos clave)</label>
                                        <textarea
                                          rows={3}
                                          placeholder="1. Evaluación de pausas activas... 2. Revisión de reportes de telemetría de velocidad."
                                          value={newMeeting.temasDiscutidos}
                                          onChange={(e) => setNewMeeting({ ...newMeeting, temasDiscutidos: e.target.value })}
                                          className="w-full p-1.5 border border-gray-200 rounded leading-snug"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newMeeting.numeroActa || !newMeeting.fecha || !newMeeting.temasDiscutidos) {
                                          alert('Por favor ingrese código, fecha y temas discutidos.');
                                          return;
                                        }
                                        const genId = 'meet-' + Date.now();
                                        const newlyCreated: CommitteeMeeting = {
                                          id: genId,
                                          numeroActa: newMeeting.numeroActa,
                                          fecha: newMeeting.fecha,
                                          temasDiscutidos: newMeeting.temasDiscutidos,
                                          compromisos: [],
                                          asistentesIds: committeeMembers.map(m => m.id) // default all
                                        };
                                        setCommitteeMeetings([...committeeMeetings, newlyCreated]);
                                        setSelectedMeetingId(genId);
                                        setNewMeeting({ numeroActa: '', fecha: '', temasDiscutidos: '' });
                                      }}
                                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded transition-colors cursor-pointer text-center"
                                    >
                                      Guardar y Cargar Nueva Acta de Comité
                                    </button>
                                  </div>
                                </details>
                              </div>
                            </div>
                          </div>

                          {/* Preview Visual Formateado para Impresión / PDF */}
                          {(() => {
                            const meeting = committeeMeetings.find(m => m.id === selectedMeetingId);
                            if (!meeting) return null;
                            const attendees = committeeMembers.filter(m => meeting.asistentesIds.includes(m.id));

                            return (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-250">
                                  <span className="text-[11px] text-gray-600 font-bold">Vista Preliminar de Impresión Oficial de Acta</span>
                                  <button
                                    type="button"
                                    onClick={() => downloadPDF('visual-acta-comite', `Acta_Comite_${meeting.numeroActa}.pdf`)}
                                    disabled={isExporting !== null}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-black px-4 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors disabled:bg-gray-400"
                                  >
                                    <Download size={13} />
                                    {isExporting === 'visual-acta-comite' ? 'Generando PDF Carta...' : 'Descargar Acta Oficial en PDF (Carta)'}
                                  </button>
                                </div>

                                <div className="border border-gray-300 rounded-xl bg-white p-8 max-w-3xl mx-auto shadow-md" id="visual-acta-comite">
                                  {/* Cabezote Formal */}
                                  <div className="border-b-2 border-gray-900 pb-4 mb-6">
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex items-center gap-3">
                                        {isImageLogo && (
                                          <img src={companyLogo} alt={companyName} className="h-12 w-14 object-contain border border-gray-200 rounded p-1 bg-white shrink-0" />
                                        )}
                                        <div className="space-y-1 font-sans">
                                          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{companyName}</h2>
                                          <p className="text-[10px] text-gray-500 font-bold">NIT: {companyNit} | SISTEMA DE GESTIÓN PESV</p>
                                          <p className="text-[10px] text-gray-400 font-bold">Res. 40595 de 2022 — Ministerio de Transporte</p>
                                        </div>
                                      </div>
                                      <div className="text-right text-[10px] text-gray-500 font-mono space-y-0.5">
                                        <div><strong>Código Documental:</strong> SIG-PESV-ACT-02</div>
                                        <div><strong>Fecha Emisión:</strong> {meeting.fecha}</div>
                                        <div><strong>Estado:</strong> Aprobado por Comité</div>
                                      </div>
                                    </div>
                                    <div className="mt-4 bg-gray-900 text-white text-center py-1.5 text-xs font-black tracking-widest rounded-sm uppercase">
                                      ACTA DE REUNIÓN DEL COMITÉ DE SEGURIDAD VIAL Nro. {meeting.numeroActa}
                                    </div>
                                  </div>

                                  {/* Detalles de la Reunión */}
                                  <div className="grid grid-cols-3 gap-2 text-[10.5px] border-b border-gray-200 pb-4 mb-4 font-sans">
                                    <div><strong>Organización:</strong> <span className="text-gray-700">{companyName}</span></div>
                                    <div><strong>Fecha de Sesión:</strong> <span className="text-gray-700">{meeting.fecha}</span></div>
                                    <div><strong>Lugar / Canal:</strong> <span className="text-gray-700">Sala de Juntas SST / Virtual</span></div>
                                  </div>

                                  {/* Temas Tratados */}
                                  <div className="space-y-2 mb-6 text-justify">
                                    <h4 className="text-[11px] font-extrabold text-gray-900 uppercase border-b border-gray-100 pb-1">I. Agenda y Temas Discutidos</h4>
                                    <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line font-sans pl-1 border-l-2 border-sky-400">
                                      {meeting.temasDiscutidos}
                                    </p>
                                  </div>

                                  {/* Compromisos Asignados */}
                                  <div className="space-y-2 mb-6">
                                    <h4 className="text-[11px] font-extrabold text-gray-900 uppercase border-b border-gray-100 pb-1">II. Tabla de Tareas y Compromisos Adquiridos</h4>
                                    <div className="border border-gray-300 rounded overflow-hidden">
                                      <table className="w-full text-left text-[10.5px] border-collapse font-sans">
                                        <thead>
                                          <tr className="bg-gray-100 text-gray-750 uppercase tracking-wider font-extrabold border-b border-gray-300 text-[9.5px]">
                                            <th className="p-2 border-r border-gray-300">Actividad o Compromiso Asignado</th>
                                            <th className="p-2 border-r border-gray-300">Responsable</th>
                                            <th className="p-2 text-center">Fecha Límite</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {meeting.compromisos.length === 0 ? (
                                            <tr>
                                              <td colSpan={3} className="p-3 text-center text-gray-400 italic">No se registraron tareas adicionales en esta acta de comité.</td>
                                            </tr>
                                          ) : (
                                            meeting.compromisos.map(comp => (
                                              <tr key={comp.id}>
                                                <td className="p-2 border-r border-gray-200 text-gray-800 leading-snug">{comp.tarea}</td>
                                                <td className="p-2 border-r border-gray-200 font-bold text-gray-750">{comp.responsable}</td>
                                                <td className="p-2 text-center font-mono text-gray-750">{comp.fechaLimite}</td>
                                              </tr>
                                            ))
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Cuadrícula de Firmas */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] font-extrabold text-gray-900 uppercase border-b border-gray-100 pb-1">III. Control de Firmas y Validación de Asistencia</h4>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4">
                                      {attendees.length === 0 ? (
                                        <p className="text-xs text-gray-455 italic col-span-2 text-center">No se han registrado asistentes para esta sesión en el sistema.</p>
                                      ) : (
                                        attendees.map(member => (
                                          <div key={member.id} className="space-y-1 flex flex-col justify-end min-h-[70px]">
                                            <div className="h-10 flex items-end justify-start pb-0.5 border-b border-gray-300">
                                              {member.firmado ? (
                                                <div className="space-y-0.5">
                                                  <span className="font-serif italic text-xs text-sky-800 block select-none font-bold pr-4">
                                                    {member.firma && member.firma.startsWith('data:image/') ? <img src={member.firma} alt="Firma" className="h-8 max-w-[120px] object-contain block mb-0.5" referrerPolicy="no-referrer" /> : (member.firma || member.nombre)}
                                                  </span>
                                                  <span className="text-[7.5px] text-emerald-600 block uppercase tracking-tight font-extrabold select-none">
                                                    ✓ FIRMADO DIGITALMENTE — ASISTENTE
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-gray-400 italic">Pendiente por firmar</span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-gray-500 leading-tight">
                                              <strong className="text-gray-800 font-extrabold">{member.nombre}</strong>
                                              <br />{member.cargo}
                                              <br /><strong>Comité:</strong> {member.rolComite}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Pie de página oficial de calidad */}
                                  <div className="border-t border-gray-200/80 pt-4 mt-8 flex justify-between items-center text-[9px] text-gray-455 font-sans">
                                    <span>Sistema de Gestión de Seguridad Vial — PESV</span>
                                    <span>Confidencial y de Uso Exclusivo de la Organización</span>
                                    <span>Página 1 de 1</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* TAB 2: LIDERAZGO Y COMPROMISO DIRECTIVO (Paso 4) */}
                      {activeStep.id === 4 && (
                        <div className="space-y-6">
                          {/* Info banner */}
                          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 flex gap-3 text-xs text-emerald-950">
                            <Shield size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-emerald-900">Liderazgo, Compromiso y Corresponsabilidad Directiva (Paso 4 - Resol. 40595)</h4>
                              <p className="mt-1 text-gray-600 leading-relaxed">
                                De acuerdo con el <strong>Paso 4</strong> de la normatividad del PESV, el nivel directivo (Gerencia General) debe certificar su compromiso explícito suministrando los recursos, aprobando políticas, participando en comités, y haciendo seguimiento estricto al cumplimiento de las metas de seguridad. <strong>Aplica de forma obligatoria para todos los niveles de organización (Básico, Estándar y Avanzado)</strong>.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            {/* Editor de checklist y firmas */}
                            <div className="xl:col-span-12 space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                                <h3 className="text-xs font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider border-b border-gray-100 pb-2">
                                  <ClipboardList size={14} className="text-emerald-600" />
                                  Lista de Verificación de Cumplimiento de Liderazgo (Gerencia)
                                </h3>

                                <div className="space-y-3.5">
                                  {managerChecklist.map((item) => (
                                    <div key={item.id} className="p-3 border border-gray-100 bg-gray-50/40 rounded-lg space-y-2 text-[11px]">
                                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-1.5">
                                        <div className="font-bold text-gray-800 flex items-start gap-1.5">
                                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">{item.letra}</span>
                                          <span className="leading-relaxed text-justify max-w-4xl">{item.descripcion}</span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                          <span className="text-[10px] text-gray-500 font-extrabold uppercase">Cumplimiento:</span>
                                          <select
                                            value={item.cumple}
                                            onChange={(e) => {
                                              setManagerChecklist(managerChecklist.map(m => m.id === item.id ? { ...m, cumple: e.target.value as any } : m));
                                            }}
                                            className="p-1 border border-gray-200 rounded text-[11px] bg-white font-black text-emerald-800"
                                          >
                                            <option value="Sí">✅ Sí Cumple</option>
                                            <option value="No">❌ No Cumple</option>
                                            <option value="Parcial">⚡ Parcial</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-gray-500 font-bold mb-1">Observaciones / Evidencia de Verificación del Gerente:</label>
                                        <textarea
                                          rows={2}
                                          value={item.observaciones}
                                          onChange={(e) => {
                                            setManagerChecklist(managerChecklist.map(m => m.id === item.id ? { ...m, observaciones: e.target.value } : m));
                                          }}
                                          className="w-full p-2 border border-gray-200 bg-white rounded text-[11px] leading-snug"
                                          placeholder="ej. Se asignó presupuesto oficial, se contrató consultor..."
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Bloque de firma del Gerente */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px]">
                                <div className="md:col-span-4 border-b border-gray-100 pb-1.5 mb-1">
                                  <h4 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                                    <PenTool size={13} className="text-emerald-600" />
                                    Firma y Validaciones Digitales de la Gerencia
                                  </h4>
                                </div>

                                <div>
                                  <label className="block text-gray-600 font-bold mb-1">Nombre de la Alta Dirección</label>
                                  <input
                                    type="text"
                                    value={managerSignatureName}
                                    onChange={(e) => setManagerSignatureName(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-600 font-bold mb-1">Cargo Directivo</label>
                                  <input
                                    type="text"
                                    value={managerSignatureCharge}
                                    onChange={(e) => setManagerSignatureCharge(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-600 font-bold mb-1">Firma del Representante Legal (Texto o Imagen)</label>
                                  <div className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      value={managerSignatureImage ? 'Firma cargada como imagen' : managerSignatureText}
                                      disabled={!!managerSignatureImage}
                                      onChange={(e) => setManagerSignatureText(e.target.value)}
                                      className="flex-1 p-2 border border-gray-200 rounded text-[11px] font-mono italic text-sky-800"
                                      placeholder="Firma en texto"
                                    />
                                    <label className="px-2 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 text-[11px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-0.5">
                                      <Upload size={12} />
                                      <span>Imagen</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          handleSignatureUploadCallback(e, (base64) => {
                                            setManagerSignatureImage(base64);
                                            setManagerSigned(true);
                                          });
                                        }}
                                      />
                                    </label>
                                    {managerSignatureImage && (
                                      <button
                                        type="button"
                                        onClick={() => setManagerSignatureImage(null)}
                                        className="text-red-500 text-[11px] font-bold hover:underline cursor-pointer"
                                      >
                                        Quitar
                                      </button>
                                    )}
                                  </div>
                                  {managerSignatureImage && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-[10px] text-gray-400">Vista previa:</span>
                                      <img src={managerSignatureImage} alt="Gerente Firma" className="h-6 bg-white border rounded px-1 object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-gray-600 font-bold mb-1">Fecha de Firma</label>
                                  <input
                                    type="date"
                                    value={managerSignatureDate}
                                    onChange={(e) => setManagerSignatureDate(e.target.value)}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[11px] font-mono text-center"
                                  />
                                </div>

                                <div className="md:col-span-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-150 flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-emerald-900 leading-snug">
                                    ¿Habilitar y estampar la firma del Representante Legal en el certificado de compromiso?
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={managerSigned}
                                      onChange={() => setManagerSigned(!managerSigned)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    <span className="ml-2 text-[11px] font-black text-emerald-850 uppercase">{managerSigned ? 'Sí, Firmar' : 'No'}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Previsualización del Certificado Directivo Oficial */}
                          <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-250">
                              <span className="text-[11px] text-gray-600 font-bold">Documento Legal Generado para Verificación de Auditoría</span>
                              <button
                                type="button"
                                onClick={() => downloadPDF('visual-liderazgo-directivo', `Certificado_Compromiso_Gerente_PESV.pdf`)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Download size={13} />
                                Descargar Declaración Juramentada en PDF
                              </button>
                            </div>

                            <div className="border border-gray-300 rounded-xl bg-white p-8 max-w-3xl mx-auto shadow-md" id="visual-liderazgo-directivo">
                              {/* Cabezote Formal */}
                              <div className="border-b-2 border-gray-900 pb-4 mb-6">
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex items-center gap-3">
                                    {isImageLogo && (
                                      <img src={companyLogo} alt={companyName} className="h-12 w-14 object-contain border border-gray-200 rounded p-1 bg-white shrink-0" />
                                    )}
                                    <div className="space-y-1 font-sans">
                                      <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{companyName}</h2>
                                      <p className="text-[10px] text-gray-500 font-bold">NIT: {companyNit} | CONTROL DE GESTIÓN GERENCIAL</p>
                                      <p className="text-[10px] text-gray-400 font-bold">Res. 40595 de 2022 — Ministerio de Transporte</p>
                                    </div>
                                  </div>
                                  <div className="text-right text-[10px] text-gray-500 font-mono space-y-0.5">
                                    <div><strong>Código Documental:</strong> DIR-PESV-LID-01</div>
                                    <div><strong>Fecha Certificado:</strong> {managerSignatureDate}</div>
                                    <div><strong>Vigencia:</strong> Anual — 2026/2027</div>
                                  </div>
                                </div>
                                <div className="mt-4 bg-gray-900 text-white text-center py-1.5 text-xs font-black tracking-widest rounded-sm uppercase">
                                  DECLARACIÓN JURAMENTADA DE LIDERAZGO, COMPROMISO Y CORRESPONSABILIDAD DIRECTIVA
                                </div>
                              </div>

                              {/* Declaración Legal */}
                              <div className="text-[10.5px] leading-relaxed text-justify text-gray-750 space-y-3 mb-6 font-sans">
                                <p>
                                  Yo, <strong>{managerSignatureName}</strong>, actuando en calidad de <strong>{managerSignatureCharge}</strong> y Representante Legal de la organización <strong>{companyName}</strong>, identificada con NIT <strong>901.452.883-1</strong>, en cumplimiento expreso del <strong>Paso 4 de la Metodología de la Resolución 40595 de 2022</strong>, declaro formalmente bajo la gravedad de juramento lo siguiente:
                                </p>
                                <p>
                                  Que la Alta Dirección ejerce un rol directivo de total responsabilidad y corresponsabilidad con la seguridad vial en todos los niveles, proporcionando de manera oportuna los recursos, políticas y metas necesarias para la mitigación del riesgo en las vías. De esta manera, certificamos el cumplimiento de cada una de nuestras obligaciones normativas:
                                </p>
                              </div>

                              {/* Tabla de Puntos a a h */}
                              <div className="space-y-3 mb-6">
                                <h4 className="text-[10px] font-extrabold text-gray-900 uppercase border-b border-gray-100 pb-0.5">IV. Evidencia de Cumplimiento de Obligaciones Directivas</h4>
                                <div className="border border-gray-300 rounded overflow-hidden">
                                  <table className="w-full text-left text-[10px] border-collapse font-sans">
                                    <thead>
                                      <tr className="bg-gray-100 text-gray-750 uppercase tracking-wider font-extrabold border-b border-gray-300 text-[9px]">
                                        <th className="p-2 text-center border-r border-gray-300 w-10">Ítem</th>
                                        <th className="p-2 border-r border-gray-300">Descripción Obligación (Paso 4)</th>
                                        <th className="p-2 text-center border-r border-gray-300 w-16">Estado</th>
                                        <th className="p-2 w-72">Evidencia de Auditoría / Observación</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {managerChecklist.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                          <td className="p-2 text-center font-bold border-r border-gray-200 bg-gray-50 text-gray-700 uppercase">{item.letra}</td>
                                          <td className="p-2 border-r border-gray-200 text-gray-700 leading-snug text-justify text-[9.5px]">
                                            {item.descripcion}
                                          </td>
                                          <td className="p-2 text-center border-r border-gray-200 font-extrabold text-emerald-800">
                                            {item.cumple === 'Sí' ? 'SÍ CUMPLE' : item.cumple === 'No' ? 'NO CUMPLE' : 'PARCIAL'}
                                          </td>
                                          <td className="p-2 text-gray-600 leading-snug text-justify text-[9.5px]">
                                            {item.observaciones || 'Sin observaciones registradas.'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Firma del Gerente */}
                              <div className="pt-6">
                                <div className="space-y-2 flex flex-col justify-end min-h-[80px] max-w-sm">
                                  <div className="h-12 flex items-end justify-start pb-1 border-b border-gray-300">
                                    {managerSigned ? (
                                      <div className="space-y-0.5">
                                        <span className="font-serif italic text-sm text-sky-800 block select-none font-bold">
{managerSignatureImage ? <img src={managerSignatureImage} alt="Firma del Gerente" className="h-10 max-w-[150px] object-contain block mb-0.5" referrerPolicy="no-referrer" /> : (managerSignatureText || managerSignatureName)}
                                        </span>
                                        <span className="text-[7.5px] text-emerald-600 block uppercase tracking-tight font-extrabold select-none">
                                          ✓ FIRMADO LEGALMENTE — GERENTE GENERAL
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic">Pendiente por estampar firma</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 leading-tight">
                                    <strong className="text-gray-800 font-extrabold">{managerSignatureName}</strong>
                                    <br />{managerSignatureCharge}
                                    <br /><strong>Organización:</strong> {companyName}
                                    <br /><strong>Fecha Registro:</strong> {managerSignatureDate}
                                  </div>
                                </div>
                              </div>

                              {/* Pie de página oficial de calidad */}
                              <div className="border-t border-gray-200/80 pt-4 mt-8 flex justify-between items-center text-[9px] text-gray-455 font-sans">
                                <span>Declaración de Corresponsabilidad — PESV Paso 4</span>
                                <span>Válido para Entidades de Inspección y Control (Supertransporte / Mintrabajo)</span>
                                <span>Página 1 de 1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DEMO PASO 5: Diagnóstico */}
                  {activeStep.id === 5 && (
                    <div className="space-y-6">
                      {/* Sub-Sección 1: Checklist de Autodiagnóstico Inicial */}
                      <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-xs" id="demo-autodiagnostico">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <ClipboardList size={14} className="text-emerald-600" />
                            Autodiagnóstico Inicial de Cumplimiento Resol. 40595
                          </h4>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                            diagnosticPercentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Score: {diagnosticPercentage}%
                          </span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto text-[11px] text-gray-700 pr-1">
                          {diagnosticQuestions.map((q) => (
                            <div key={q.id} className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50">
                              <span className="leading-relaxed">{q.text}</span>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  id={`btn-diag-${q.id}-si`}
                                  onClick={() => setDiagnosticAnswers({ ...diagnosticAnswers, [q.id]: true })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    diagnosticAnswers[q.id] === true
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  SÍ
                                </button>
                                <button
                                  type="button"
                                  id={`btn-diag-${q.id}-no`}
                                  onClick={() => setDiagnosticAnswers({ ...diagnosticAnswers, [q.id]: false })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    diagnosticAnswers[q.id] === false
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  NO
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-2.5 bg-sky-50 rounded text-[10px] text-sky-800 flex gap-2 border border-sky-100">
                          <Info size={14} className="shrink-0 mt-0.5" />
                          <span>Este autodiagnóstico calcula dinámicamente tu preparación general. Un score inferior al 80% indica brechas que podrían resultar en no conformidades durante auditorías del Ministerio.</span>
                        </div>
                      </div>

                      {/* Sub-Sección 2: ESQUEMA DE LÍNEA BASE (REQUERIDO) */}
                      <div className="bg-white p-4 sm:p-5 rounded-lg border border-emerald-100 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                          <Activity size={16} className="text-emerald-600" />
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">
                              Esquema de Información y Línea Base de Seguridad Vial
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">Definición de línea base de la organización en conformidad con los literales a, b, c, d, e y f del Paso 4 de la Metodología.</p>
                          </div>
                        </div>

                        {/* Botonera de Tabs (a, b, c, d, e, f) */}
                        <div className="flex flex-wrap gap-1 border-b border-gray-100">
                          {[
                            { id: 'sedes', label: 'a) Sedes & Servicios', icon: <Building size={11} />, count: sedesList.length },
                            { id: 'contratistas', label: 'b) Contratistas', icon: <Users size={11} />, count: contratistasList.length },
                            { id: 'colaboradores', label: 'c) Colaboradores', icon: <User size={11} />, count: colaboradoresList.length },
                            { id: 'vehiculos', label: 'd) Vehículos & Flota', icon: <Truck size={11} />, count: vehiculosList.length },
                            { id: 'rutas', label: 'e) Rutas Frecuentes', icon: <MapPin size={11} />, count: rutasList.length },
                            { id: 'emergencias', label: 'f) Emergencias & Simulacros', icon: <Shield size={11} />, count: simulacrosList.length + 1 }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveDiagTab(tab.id as any)}
                              className={`px-2.5 py-1.5 text-[10px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                                activeDiagTab === tab.id
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold'
                                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              {tab.icon}
                              <span>{tab.label}</span>
                              <span className="bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.1 text-[9px] font-black">{tab.count}</span>
                            </button>
                          ))}
                        </div>

                        {/* CONTENIDOS DE LAS PESTAÑAS */}

                        {/* TAB A: SEDES */}
                        {activeDiagTab === 'sedes' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Literal a): Cantidad de sedes y servicios que presta la organización</span>
                              <span className="text-[10px] text-gray-500">Sedes registradas: {sedesList.length}</span>
                            </div>

                            <div className="overflow-x-auto border border-gray-150 rounded-lg">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold">
                                    <th className="p-2.5">Nombre de la Sede</th>
                                    <th className="p-2.5">Ciudad</th>
                                    <th className="p-2.5">Dirección</th>
                                    <th className="p-2.5 text-right">Personal</th>
                                    <th className="p-2.5">Servicios que Presta</th>
                                    <th className="p-2.5 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {sedesList.map((s) => (
                                    <tr key={s.id} className={`hover:bg-gray-50/50 ${editingSedeId === s.id ? 'bg-amber-50/60' : ''}`}>
                                      <td className="p-2.5 font-bold text-gray-900">{s.nombre}</td>
                                      <td className="p-2.5">{s.ciudad}</td>
                                      <td className="p-2.5 font-mono text-[10px]">{s.direccion}</td>
                                      <td className="p-2.5 text-right font-semibold">{s.personal}</td>
                                      <td className="p-2.5 leading-tight">{s.servicios}</td>
                                      <td className="p-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSedeId(s.id);
                                              setNewSede({ nombre: s.nombre, ciudad: s.ciudad, direccion: s.direccion, personal: s.personal, servicios: s.servicios });
                                            }}
                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                            title="Editar Sede"
                                          >
                                            <Edit size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (editingSedeId === s.id) {
                                                setEditingSedeId(null);
                                                setNewSede({ nombre: '', ciudad: '', direccion: '', personal: 5, servicios: '' });
                                              }
                                              setSedesList(sedesList.filter(item => item.id !== s.id));
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                            title="Eliminar Sede"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Formulario de Adición / Edición Sede */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 block text-xs">
                                  {editingSedeId ? 'Editar Sede Registrada' : 'Agregar Nueva Sede'}
                                </span>
                                {editingSedeId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSedeId(null);
                                      setNewSede({ nombre: '', ciudad: '', direccion: '', personal: 5, servicios: '' });
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancelar edición
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre de la Sede"
                                  value={newSede.nombre}
                                  onChange={(e) => setNewSede({ ...newSede, nombre: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Ciudad"
                                  value={newSede.ciudad}
                                  onChange={(e) => setNewSede({ ...newSede, ciudad: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Dirección"
                                  value={newSede.direccion}
                                  onChange={(e) => setNewSede({ ...newSede, direccion: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="Personal"
                                    value={newSede.personal || ''}
                                    onChange={(e) => setNewSede({ ...newSede, personal: parseInt(e.target.value) || 0 })}
                                    className="p-1.5 border border-gray-200 rounded w-16 text-[11px]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Servicios que presta"
                                    value={newSede.servicios}
                                    onChange={(e) => setNewSede({ ...newSede, servicios: e.target.value })}
                                    className="p-1.5 border border-gray-200 rounded flex-1 text-[11px]"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newSede.nombre || !newSede.ciudad) {
                                      alert('Por favor complete el nombre y la ciudad de la sede.');
                                      return;
                                    }
                                    if (editingSedeId) {
                                      setSedesList(sedesList.map(s => s.id === editingSedeId ? { ...newSede, id: editingSedeId } : s));
                                      setEditingSedeId(null);
                                    } else {
                                      setSedesList([...sedesList, { ...newSede, id: Date.now() }]);
                                    }
                                    setNewSede({ nombre: '', ciudad: '', direccion: '', personal: 5, servicios: '' });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                                >
                                  {editingSedeId ? <Check size={12} /> : <Plus size={12} />}
                                  {editingSedeId ? 'Actualizar Sede' : 'Guardar Sede'}
                                </button>
                                {editingSedeId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSedeId(null);
                                      setNewSede({ nombre: '', ciudad: '', direccion: '', personal: 5, servicios: '' });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB B: CONTRATISTAS */}
                        {activeDiagTab === 'contratistas' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Literal b): Lista de contratistas con desplazamientos viales laborales</span>
                              <span className="text-[10px] text-gray-500">Contratistas registrados: {contratistasList.length}</span>
                            </div>

                            <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded leading-tight border border-gray-200">
                              Debe incluir contratistas ocasionales y permanentes, flotas fidelizadas u ocasionales, afiliados, tercerizados, outsourcing, subcontratistas e intermediación laboral que realicen desplazamientos laborales en cumplimiento de su objeto contractual.
                            </p>

                            <div className="overflow-x-auto border border-gray-150 rounded-lg">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold">
                                    <th className="p-2.5">Razón Social / Nombre</th>
                                    <th className="p-2.5">Identificación (NIT/CC)</th>
                                    <th className="p-2.5">Frecuencia</th>
                                    <th className="p-2.5">Modalidad de Flota</th>
                                    <th className="p-2.5 text-right">Cant. Vehículos</th>
                                    <th className="p-2.5 text-right">Viajes/Mes Est.</th>
                                    <th className="p-2.5 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {contratistasList.map((c) => (
                                    <tr key={c.id} className={`hover:bg-gray-50/50 ${editingContratistaId === c.id ? 'bg-amber-50/60' : ''}`}>
                                      <td className="p-2.5 font-bold text-gray-900">{c.razonSocial}</td>
                                      <td className="p-2.5 font-mono text-[10.5px]">{c.nit}</td>
                                      <td className="p-2.5">
                                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                          c.tipoContrato === 'Permanente' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                        }`}>
                                          {c.tipoContrato}
                                        </span>
                                      </td>
                                      <td className="p-2.5 font-semibold text-gray-800">{c.tipoFlota}</td>
                                      <td className="p-2.5 text-right">{c.vehiculos}</td>
                                      <td className="p-2.5 text-right font-mono font-bold text-gray-900">{c.viajesMes}</td>
                                      <td className="p-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingContratistaId(c.id);
                                              setNewContratista({ razonSocial: c.razonSocial, nit: c.nit, tipoContrato: c.tipoContrato, tipoFlota: c.tipoFlota, vehiculos: c.vehiculos, viajesMes: c.viajesMes });
                                            }}
                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                            title="Editar Contratista"
                                          >
                                            <Edit size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (editingContratistaId === c.id) {
                                                setEditingContratistaId(null);
                                                setNewContratista({ razonSocial: '', nit: '', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 1, viajesMes: 10 });
                                              }
                                              setContratistasList(contratistasList.filter(item => item.id !== c.id));
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                            title="Eliminar Contratista"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Formulario de Adición / Edición Contratista */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 block text-xs">
                                  {editingContratistaId ? 'Editar Contratista Registrado' : 'Agregar Nuevo Contratista'}
                                </span>
                                {editingContratistaId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingContratistaId(null);
                                      setNewContratista({ razonSocial: '', nit: '', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 1, viajesMes: 10 });
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancelar edición
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Razón Social / Nombre"
                                  value={newContratista.razonSocial}
                                  onChange={(e) => setNewContratista({ ...newContratista, razonSocial: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="NIT / Cédula"
                                  value={newContratista.nit}
                                  onChange={(e) => setNewContratista({ ...newContratista, nit: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <select
                                  value={newContratista.tipoContrato}
                                  onChange={(e) => setNewContratista({ ...newContratista, tipoContrato: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                >
                                  <option value="Permanente">Contrato Permanente</option>
                                  <option value="Ocasional">Contrato Ocasional</option>
                                </select>
                                <select
                                  value={newContratista.tipoFlota}
                                  onChange={(e) => setNewContratista({ ...newContratista, tipoFlota: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                >
                                  <option value="Tercerización (Flota Fidelizada)">Tercerización (Flota Fidelizada)</option>
                                  <option value="Flotas Ocasionales">Flotas Ocasionales</option>
                                  <option value="Afiliados">Afiliados</option>
                                  <option value="Outsourcing">Outsourcing</option>
                                  <option value="Subcontratación">Subcontratación</option>
                                  <option value="Intermediación Laboral">Intermediación Laboral</option>
                                  <option value="Persona Natural (Vehículo Propio)">Persona Natural (Vehículo Propio)</option>
                                </select>
                                <input
                                  type="number"
                                  placeholder="Vehículos en Flota"
                                  value={newContratista.vehiculos || ''}
                                  onChange={(e) => setNewContratista({ ...newContratista, vehiculos: parseInt(e.target.value) || 0 })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="number"
                                  placeholder="Viajes estimados al mes"
                                  value={newContratista.viajesMes || ''}
                                  onChange={(e) => setNewContratista({ ...newContratista, viajesMes: parseInt(e.target.value) || 0 })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newContratista.razonSocial || !newContratista.nit) {
                                      alert('Por favor complete la razón social e identificación.');
                                      return;
                                    }
                                    if (editingContratistaId) {
                                      setContratistasList(contratistasList.map(c => c.id === editingContratistaId ? { ...newContratista, id: editingContratistaId } : c));
                                      setEditingContratistaId(null);
                                    } else {
                                      setContratistasList([...contratistasList, { ...newContratista, id: Date.now() }]);
                                    }
                                    setNewContratista({ razonSocial: '', nit: '', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 1, viajesMes: 10 });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                                >
                                  {editingContratistaId ? <Check size={12} /> : <Plus size={12} />}
                                  {editingContratistaId ? 'Actualizar Contratista' : 'Guardar Contratista'}
                                </button>
                                {editingContratistaId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingContratistaId(null);
                                      setNewContratista({ razonSocial: '', nit: '', tipoContrato: 'Permanente', tipoFlota: 'Tercerización (Flota Fidelizada)', vehiculos: 1, viajesMes: 10 });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB C: COLABORADORES */}
                        {activeDiagTab === 'colaboradores' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Literal c): Registro consolidado de colaboradores y conductores</span>
                              <span className="text-[10px] text-gray-500">Colaboradores registrados: {colaboradoresList.length}</span>
                            </div>

                            <div className="overflow-x-auto border border-gray-150 rounded-lg max-w-full">
                              <table className="w-full text-left border-collapse text-[10px] whitespace-nowrap">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold text-center">
                                    <th className="p-2 text-left">Nombre Completo</th>
                                    <th className="p-2">Identificación</th>
                                    <th className="p-2">Género</th>
                                    <th className="p-2">F. Nacimiento</th>
                                    <th className="p-2">Cargo</th>
                                    <th className="p-2">Escolaridad</th>
                                    <th className="p-2">E. Civil</th>
                                    <th className="p-2">Rol Conductor</th>
                                    <th className="p-2">Licencia (Vigencia)</th>
                                    <th className="p-2">Vence SOAT</th>
                                    <th className="p-2">Vence RTM</th>
                                    <th className="p-2 text-left">Capacitaciones</th>
                                    <th className="p-2">Eval. Competencia</th>
                                    <th className="p-2 text-center">Siniestros</th>
                                    <th className="p-2 text-left">Infracciones (Multas)</th>
                                    <th className="p-2">Transporte al Trabajo</th>
                                    <th className="p-2">Vehículo Conducido</th>
                                    <th className="p-2">F. Vinculación</th>
                                    <th className="p-2 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {colaboradoresList.map((col) => (
                                    <tr key={col.id} className={`hover:bg-gray-50/50 ${editingColaboradorId === col.id ? 'bg-amber-50/60' : ''}`}>
                                      <td className="p-2 font-bold text-gray-900 text-left">{col.nombre}</td>
                                      <td className="p-2 font-mono text-[9.5px]">{col.cedula}</td>
                                      <td className="p-2 text-center">{col.genero}</td>
                                      <td className="p-2 text-center font-mono">{col.fechaNacimiento}</td>
                                      <td className="p-2">{col.cargo}</td>
                                      <td className="p-2">{col.escolaridad}</td>
                                      <td className="p-2 text-center">{col.estadoCivil}</td>
                                      <td className="p-2 text-center font-bold">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${col.rolConductor === 'SÍ' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                                          {col.rolConductor}
                                        </span>
                                      </td>
                                      <td className="p-2 text-center font-semibold text-gray-800">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span>{col.licencia}</span>
                                          {(() => {
                                            if (!col.licencia) return null;
                                            const match = col.licencia.match(/Vence\s*([^)]+)/);
                                            if (match) {
                                              const expiryDate = new Date(match[1]);
                                              const currentDate = new Date('2026-06-25');
                                              if (expiryDate < currentDate) {
                                                return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-red-100 text-red-800 border border-red-200">VENCIDO</span>;
                                              } else if (expiryDate < new Date('2026-07-25')) {
                                                return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">POR VENCER</span>;
                                              } else {
                                                return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">VIGENTE</span>;
                                              }
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      </td>
                                      <td className="p-2 text-center font-semibold text-gray-800 font-mono">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span>{col.soatExpiry || 'N/A'}</span>
                                          {(() => {
                                            if (!col.soatExpiry) return null;
                                            const expiryDate = new Date(col.soatExpiry);
                                            const currentDate = new Date('2026-06-25');
                                            if (expiryDate < currentDate) {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-red-100 text-red-800 border border-red-200">VENCIDO</span>;
                                            } else if (expiryDate < new Date('2026-07-25')) {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">POR VENCER</span>;
                                            } else {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">VIGENTE</span>;
                                            }
                                          })()}
                                        </div>
                                      </td>
                                      <td className="p-2 text-center font-semibold text-gray-800 font-mono">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span>{col.tecnoExpiry || 'N/A'}</span>
                                          {(() => {
                                            if (!col.tecnoExpiry) return null;
                                            const expiryDate = new Date(col.tecnoExpiry);
                                            const currentDate = new Date('2026-06-25');
                                            if (expiryDate < currentDate) {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-red-100 text-red-800 border border-red-200">VENCIDO</span>;
                                            } else if (expiryDate < new Date('2026-07-25')) {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">POR VENCER</span>;
                                            } else {
                                              return <span className="inline-block px-1 py-0.5 rounded text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">VIGENTE</span>;
                                            }
                                          })()}
                                        </div>
                                      </td>
                                      <td className="p-2 text-left max-w-xs truncate" title={col.capacitaciones}>{col.capacitaciones}</td>
                                      <td className="p-2 text-center">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${col.evalCompetencia === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : col.evalCompetencia === 'No Aplica' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                          {col.evalCompetencia}
                                        </span>
                                      </td>
                                      <td className="p-2 text-center font-bold text-gray-900">{col.siniestros}</td>
                                      <td className="p-2 text-left text-gray-700 font-medium">{col.infracciones}</td>
                                      <td className="p-2">{col.medioTransporte}</td>
                                      <td className="p-2 font-bold text-emerald-800">{col.tipoVehiculoConduce}</td>
                                      <td className="p-2 text-center font-mono">{col.fechaVinculacion}</td>
                                      <td className="p-2 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingColaboradorId(col.id);
                                              setNewColaborador({
                                                nombre: col.nombre || '',
                                                cedula: col.cedula || '',
                                                genero: col.genero || 'Masculino',
                                                fechaNacimiento: col.fechaNacimiento || '1990-01-01',
                                                cargo: col.cargo || '',
                                                escolaridad: col.escolaridad || 'Bachiller',
                                                estadoCivil: col.estadoCivil || 'Soltero',
                                                rolConductor: col.rolConductor || 'SÍ',
                                                licencia: col.licencia || '',
                                                soatExpiry: col.soatExpiry || '2027-06-25',
                                                tecnoExpiry: col.tecnoExpiry || '2027-06-25',
                                                capacitaciones: col.capacitaciones || '',
                                                evalCompetencia: col.evalCompetencia || 'Aprobado',
                                                siniestros: col.siniestros || 0,
                                                infracciones: col.infracciones || 'Ninguna',
                                                medioTransporte: col.medioTransporte || 'Vehículo de la empresa',
                                                tipoVehiculoConduce: col.tipoVehiculoConduce || 'Camión',
                                                fechaVinculacion: col.fechaVinculacion || '2025-01-01'
                                              });
                                            }}
                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                            title="Editar Colaborador"
                                          >
                                            <Edit size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (editingColaboradorId === col.id) {
                                                setEditingColaboradorId(null);
                                                setNewColaborador({
                                                  nombre: '', cedula: '', genero: 'Masculino', fechaNacimiento: '1995-01-01', cargo: '', escolaridad: 'Profesional', estadoCivil: 'Soltero',
                                                  rolConductor: 'SÍ', licencia: '', soatExpiry: '2027-06-25', tecnoExpiry: '2027-06-25', capacitaciones: '', evalCompetencia: 'Aprobado', siniestros: 0, infracciones: 'Ninguna',
                                                  medioTransporte: 'Vehículo de la empresa', tipoVehiculoConduce: 'Automóvil SUV', fechaVinculacion: '2026-01-01'
                                                });
                                              }
                                              setColaboradoresList(colaboradoresList.filter(item => item.id !== col.id));
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                            title="Eliminar Colaborador"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Formulario de Adición / Edición Colaborador */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 block text-xs">
                                  {editingColaboradorId ? 'Editar Colaborador / Conductor' : 'Registrar Nuevo Colaborador / Conductor'}
                                </span>
                                {editingColaboradorId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingColaboradorId(null);
                                      setNewColaborador({
                                        nombre: '', cedula: '', genero: 'Masculino', fechaNacimiento: '1995-01-01', cargo: '', escolaridad: 'Profesional', estadoCivil: 'Soltero',
                                        rolConductor: 'SÍ', licencia: '', soatExpiry: '2027-06-25', tecnoExpiry: '2027-06-25', capacitaciones: '', evalCompetencia: 'Aprobado', siniestros: 0, infracciones: 'Ninguna',
                                        medioTransporte: 'Vehículo de la empresa', tipoVehiculoConduce: 'Automóvil SUV', fechaVinculacion: '2026-01-01'
                                      });
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancelar edición
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px]">
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Nombre Completo</label>
                                  <input
                                    type="text"
                                    value={newColaborador.nombre}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, nombre: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Juan Pérez"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Cédula / Identificación</label>
                                  <input
                                    type="text"
                                    value={newColaborador.cedula}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, cedula: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="CC 1.123..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Género</label>
                                  <select
                                    value={newColaborador.genero}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, genero: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Fecha de Nacimiento</label>
                                  <input
                                    type="date"
                                    value={newColaborador.fechaNacimiento}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, fechaNacimiento: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Cargo</label>
                                  <input
                                    type="text"
                                    value={newColaborador.cargo}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, cargo: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Operario de distribución"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Nivel Escolaridad</label>
                                  <select
                                    value={newColaborador.escolaridad}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, escolaridad: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  >
                                    <option value="Primaria">Primaria Completa</option>
                                    <option value="Secundaria">Secundaria Completa</option>
                                    <option value="Bachiller Técnico">Bachiller Técnico</option>
                                    <option value="Tecnólogo">Tecnólogo</option>
                                    <option value="Profesional">Profesional</option>
                                    <option value="Posgrado">Posgrado</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Estado Civil</label>
                                  <select
                                    value={newColaborador.estadoCivil}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, estadoCivil: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  >
                                    <option value="Soltero">Soltero/a</option>
                                    <option value="Casado">Casado/a</option>
                                    <option value="Unión Libre">Unión Libre</option>
                                    <option value="Divorciado">Divorciado/a</option>
                                    <option value="Viudo">Viudo/a</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">¿Tiene Rol de Conductor?</label>
                                  <select
                                    value={newColaborador.rolConductor}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, rolConductor: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px] font-bold"
                                  >
                                    <option value="SÍ">SÍ (Conduce para la labor)</option>
                                    <option value="NO">NO (Solo desplazamiento casa-trabajo)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Licencia (Categoría y Vence)</label>
                                  <input
                                    type="text"
                                    value={newColaborador.licencia}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, licencia: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="C2 (Vence 2028-10-12)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Vencimiento SOAT</label>
                                  <input
                                    type="date"
                                    value={newColaborador.soatExpiry}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, soatExpiry: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Vencimiento RTM</label>
                                  <input
                                    type="date"
                                    value={newColaborador.tecnoExpiry}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, tecnoExpiry: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Capacitaciones Viales</label>
                                  <input
                                    type="text"
                                    value={newColaborador.capacitaciones}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, capacitaciones: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Manejo defensivo, Primeros auxilios"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Evaluación Competencia</label>
                                  <select
                                    value={newColaborador.evalCompetencia}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, evalCompetencia: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  >
                                    <option value="Aprobado">Aprobado / Apto</option>
                                    <option value="No Aprobado">No Aprobado / Pendiente</option>
                                    <option value="No Aplica">No Aplica</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Siniestros Viales Históricos</label>
                                  <input
                                    type="number"
                                    value={newColaborador.siniestros || ''}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, siniestros: parseInt(e.target.value) || 0 })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Infracciones (Multas de Tránsito)</label>
                                  <input
                                    type="text"
                                    value={newColaborador.infracciones}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, infracciones: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="1 Infracción (Mal estacionado - PENDIENTE)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Medio de Transporte al Trabajo</label>
                                  <input
                                    type="text"
                                    value={newColaborador.medioTransporte}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, medioTransporte: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Motocicleta, Transporte Público, etc."
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Vehículo que Conduce (Rol labor)</label>
                                  <input
                                    type="text"
                                    value={newColaborador.tipoVehiculoConduce}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, tipoVehiculoConduce: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Camión Turbo NHR / Motocicleta"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Fecha Vinculación</label>
                                  <input
                                    type="date"
                                    value={newColaborador.fechaVinculacion}
                                    onChange={(e) => setNewColaborador({ ...newColaborador, fechaVinculacion: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newColaborador.nombre || !newColaborador.cedula) {
                                      alert('Por favor complete el nombre y cédula del colaborador.');
                                      return;
                                    }
                                    if (editingColaboradorId) {
                                      setColaboradoresList(colaboradoresList.map(col => col.id === editingColaboradorId ? { ...newColaborador, id: editingColaboradorId } : col));
                                      setEditingColaboradorId(null);
                                    } else {
                                      setColaboradoresList([...colaboradoresList, { ...newColaborador, id: Date.now() }]);
                                    }
                                    setNewColaborador({
                                      nombre: '', cedula: '', genero: 'Masculino', fechaNacimiento: '1995-01-01', cargo: '', escolaridad: 'Profesional', estadoCivil: 'Soltero',
                                      rolConductor: 'SÍ', licencia: '', soatExpiry: '2027-06-25', tecnoExpiry: '2027-06-25', capacitaciones: '', evalCompetencia: 'Aprobado', siniestros: 0, infracciones: 'Ninguna',
                                      medioTransporte: 'Vehículo de la empresa', tipoVehiculoConduce: 'Automóvil SUV', fechaVinculacion: '2026-01-01'
                                    });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                                >
                                  {editingColaboradorId ? <Check size={12} /> : <Plus size={12} />}
                                  {editingColaboradorId ? 'Actualizar Colaborador' : 'Guardar Colaborador'}
                                </button>
                                {editingColaboradorId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingColaboradorId(null);
                                      setNewColaborador({
                                        nombre: '', cedula: '', genero: 'Masculino', fechaNacimiento: '1995-01-01', cargo: '', escolaridad: 'Profesional', estadoCivil: 'Soltero',
                                        rolConductor: 'SÍ', licencia: '', soatExpiry: '2027-06-25', tecnoExpiry: '2027-06-25', capacitaciones: '', evalCompetencia: 'Aprobado', siniestros: 0, infracciones: 'Ninguna',
                                        medioTransporte: 'Vehículo de la empresa', tipoVehiculoConduce: 'Automóvil SUV', fechaVinculacion: '2026-01-01'
                                      });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1 rounded cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB D: VEHÍCULOS */}
                        {activeDiagTab === 'vehiculos' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Literal d): Inventario y control técnico de vehículos de la flota</span>
                              <span className="text-[10px] text-gray-500">Vehículos registrados: {vehiculosList.length}</span>
                            </div>

                            <div className="overflow-x-auto border border-gray-150 rounded-lg">
                              <table className="w-full text-left border-collapse text-[10.5px] whitespace-nowrap">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold text-center">
                                    <th className="p-2 text-left">Placa</th>
                                    <th className="p-2">Tipo</th>
                                    <th className="p-2 text-left">Clase / Marca</th>
                                    <th className="p-2">Año Fáb.</th>
                                    <th className="p-2">VIN</th>
                                    <th className="p-2">Nro Motor</th>
                                    <th className="p-2 text-right">Kilometraje</th>
                                    <th className="p-2 text-left">Especificaciones</th>
                                    <th className="p-2">Vigencia SOAT</th>
                                    <th className="p-2">Vigencia RTM</th>
                                    <th className="p-2 text-center">Siniestros</th>
                                    <th className="p-2 text-left">Plan de Mantenimiento</th>
                                    <th className="p-2 text-left">Control de Acciones</th>
                                    <th className="p-2 text-right">Km/Mes Prom.</th>
                                    <th className="p-2 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {vehiculosList.map((v) => (
                                    <tr key={v.id} className={`hover:bg-gray-50/50 ${editingVehiculoId === v.id ? 'bg-amber-50/60' : ''}`}>
                                      <td className="p-2 font-black text-gray-900 text-left">
                                        <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono border border-amber-300 shadow-3xs">{v.placa}</span>
                                      </td>
                                      <td className="p-2 text-center">{v.tipo}</td>
                                      <td className="p-2 font-bold text-gray-800 text-left">{v.clase}</td>
                                      <td className="p-2 text-center font-mono font-bold">{v.fabricacion}</td>
                                      <td className="p-2 font-mono text-[9px]">{v.vin}</td>
                                      <td className="p-2 font-mono text-[9px]">{v.motor}</td>
                                      <td className="p-2 text-right font-semibold text-gray-900">{v.kilometraje.toLocaleString()} km</td>
                                      <td className="p-2 text-left max-w-xs truncate" title={v.especificaciones}>{v.especificaciones}</td>
                                      <td className="p-2 text-center">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${v.soatVence === 'No Aplica' ? 'bg-gray-50 text-gray-400' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                                          {v.soatVence}
                                        </span>
                                      </td>
                                      <td className="p-2 text-center">
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          {v.rtmVence}
                                        </span>
                                      </td>
                                      <td className="p-2 text-center font-bold text-red-600">{v.siniestros}</td>
                                      <td className="p-2 text-left text-emerald-700 font-semibold">{v.mantenimientoPlan}</td>
                                      <td className="p-2 text-left leading-tight truncate max-w-xs text-gray-600" title={v.mantenimientoControl}>{v.mantenimientoControl}</td>
                                      <td className="p-2 text-right font-bold text-slate-800">{v.kmMesEstimado.toLocaleString()}</td>
                                      <td className="p-2 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingVehiculoId(v.id);
                                              setNewVehiculo({
                                                placa: v.placa || '',
                                                tipo: v.tipo || 'Automotor',
                                                clase: v.clase || '',
                                                vin: v.vin || '',
                                                motor: v.motor || '',
                                                kilometraje: v.kilometraje || 0,
                                                fabricacion: v.fabricacion || 2022,
                                                especificaciones: v.especificaciones || '',
                                                soatVence: v.soatVence || '2027-01-01',
                                                rtmVence: v.rtmVence || '2027-01-01',
                                                siniestros: v.siniestros || 0,
                                                mantenimientoPlan: v.mantenimientoPlan || 'Al Día',
                                                mantenimientoControl: v.mantenimientoControl || 'Preventivo regular',
                                                kmMesEstimado: v.kmMesEstimado || 1000
                                              });
                                            }}
                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                            title="Editar Vehículo"
                                          >
                                            <Edit size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (editingVehiculoId === v.id) {
                                                setEditingVehiculoId(null);
                                                setNewVehiculo({
                                                  placa: '', tipo: 'Automotor', clase: '', vin: '', motor: '', kilometraje: 0, fabricacion: 2022, especificaciones: '', soatVence: '2027-01-01', rtmVence: '2027-01-01', siniestros: 0, mantenimientoPlan: 'Al Día', mantenimientoControl: 'Preventivo regular', kmMesEstimado: 1000
                                                });
                                              }
                                              setVehiculosList(vehiculosList.filter(item => item.id !== v.id));
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                            title="Eliminar Vehículo"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Formulario de Adición / Edición Vehículo */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 block text-xs">
                                  {editingVehiculoId ? 'Editar Vehículo del Inventario' : 'Agregar Nuevo Vehículo al Inventario'}
                                </span>
                                {editingVehiculoId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVehiculoId(null);
                                      setNewVehiculo({
                                        placa: '', tipo: 'Automotor', clase: '', vin: '', motor: '', kilometraje: 0, fabricacion: 2022, especificaciones: '', soatVence: '2027-01-01', rtmVence: '2027-01-01', siniestros: 0, mantenimientoPlan: 'Al Día', mantenimientoControl: 'Preventivo regular', kmMesEstimado: 1000
                                      });
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancelar edición
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Placa del Vehículo</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.placa}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, placa: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded uppercase text-[10.5px] font-mono"
                                    placeholder="XYZ-123"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Tipo de Vehículo</label>
                                  <select
                                    value={newVehiculo.tipo}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, tipo: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  >
                                    <option value="Automotor">Automotor (Motorizado)</option>
                                    <option value="No Automotor">No Automotor (Remolque/Acoplado/Bici)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Clase, Marca y Modelo</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.clase}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, clase: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Camioneta Ford Ranger"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Número VIN</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.vin}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, vin: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px] font-mono"
                                    placeholder="1NKD5D..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Número de Motor</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.motor}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, motor: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px] font-mono"
                                    placeholder="ISX-450"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Kilometraje Inicial</label>
                                  <input
                                    type="number"
                                    value={newVehiculo.kilometraje || ''}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, kilometraje: parseInt(e.target.value) || 0 })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="50000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Año de Fabricación</label>
                                  <input
                                    type="number"
                                    value={newVehiculo.fabricacion || ''}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, fabricacion: parseInt(e.target.value) || 2022 })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="2022"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Especificaciones Técnicas</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.especificaciones}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, especificaciones: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Diésel, ABS, Doble Airbag"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Fecha Vencimiento SOAT</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.soatVence}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, soatVence: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="2027-04-10"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Fecha Vencimiento RTM</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.rtmVence}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, rtmVence: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="2026-10-15"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Siniestros del Vehículo</label>
                                  <input
                                    type="number"
                                    value={newVehiculo.siniestros || ''}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, siniestros: parseInt(e.target.value) || 0 })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Mantenimiento Preventivo Plan</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.mantenimientoPlan}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, mantenimientoPlan: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Al Día (Cada 10,000 km)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Control de Acciones Realizadas</label>
                                  <input
                                    type="text"
                                    value={newVehiculo.mantenimientoControl}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, mantenimientoControl: e.target.value })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="Cambio de frenos, alineación"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-semibold mb-0.5">Kilómetros al mes (Estimado)</label>
                                  <input
                                    type="number"
                                    value={newVehiculo.kmMesEstimado || ''}
                                    onChange={(e) => setNewVehiculo({ ...newVehiculo, kmMesEstimado: parseInt(e.target.value) || 1000 })}
                                    className="w-full p-1.5 border border-gray-200 rounded text-[10.5px]"
                                    placeholder="1500"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newVehiculo.placa || !newVehiculo.clase) {
                                      alert('Por favor complete placa y marca/modelo.');
                                      return;
                                    }
                                    if (editingVehiculoId) {
                                      setVehiculosList(vehiculosList.map(v => v.id === editingVehiculoId ? { ...newVehiculo, id: editingVehiculoId } : v));
                                      setEditingVehiculoId(null);
                                    } else {
                                      setVehiculosList([...vehiculosList, { ...newVehiculo, id: Date.now() }]);
                                    }
                                    setNewVehiculo({
                                      placa: '', tipo: 'Automotor', clase: '', vin: '', motor: '', kilometraje: 0, fabricacion: 2022, especificaciones: '', soatVence: '2027-01-01', rtmVence: '2027-01-01', siniestros: 0, mantenimientoPlan: 'Al Día', mantenimientoControl: 'Preventivo regular', kmMesEstimado: 1000
                                    });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                                >
                                  {editingVehiculoId ? <Check size={12} /> : <Plus size={12} />}
                                  {editingVehiculoId ? 'Actualizar Vehículo' : 'Guardar Vehículo'}
                                </button>
                                {editingVehiculoId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVehiculoId(null);
                                      setNewVehiculo({
                                        placa: '', tipo: 'Automotor', clase: '', vin: '', motor: '', kilometraje: 0, fabricacion: 2022, especificaciones: '', soatVence: '2027-01-01', rtmVence: '2027-01-01', siniestros: 0, mantenimientoPlan: 'Al Día', mantenimientoControl: 'Preventivo regular', kmMesEstimado: 1000
                                      });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1 rounded cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB E: RUTAS */}
                        {activeDiagTab === 'rutas' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Literal e): Registro de rutas frecuentes y desplazamientos habituales</span>
                              <span className="text-[10px] text-gray-500">Rutas activas: {rutasList.length}</span>
                            </div>

                            <div className="overflow-x-auto border border-gray-150 rounded-lg">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold">
                                    <th className="p-2.5">Identificación / Nombre de Ruta</th>
                                    <th className="p-2.5">Origen</th>
                                    <th className="p-2.5">Destino</th>
                                    <th className="p-2.5 text-right">Kilómetros</th>
                                    <th className="p-2.5">Frecuencia de Uso</th>
                                    <th className="p-2.5">Tipo de Vía Principal</th>
                                    <th className="p-2.5 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {rutasList.map((r) => (
                                    <tr key={r.id} className={`hover:bg-gray-50/50 ${editingRutaId === r.id ? 'bg-amber-50/60' : ''}`}>
                                      <td className="p-2.5 font-bold text-gray-900">{r.nombre}</td>
                                      <td className="p-2.5">{r.origen}</td>
                                      <td className="p-2.5">{r.destino}</td>
                                      <td className="p-2.5 text-right font-semibold text-gray-900">{r.distancia} km</td>
                                      <td className="p-2.5 font-semibold text-emerald-800">{r.frecuencia}</td>
                                      <td className="p-2.5 leading-tight">{r.viaPrincipal}</td>
                                      <td className="p-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingRutaId(r.id);
                                              setNewRuta({
                                                nombre: r.nombre || '',
                                                origen: r.origen || '',
                                                destino: r.destino || '',
                                                distancia: r.distancia || 10,
                                                frecuencia: r.frecuencia || 'Semanal',
                                                viaPrincipal: r.viaPrincipal || ''
                                              });
                                            }}
                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                            title="Editar Ruta"
                                          >
                                            <Edit size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (editingRutaId === r.id) {
                                                setEditingRutaId(null);
                                                setNewRuta({ nombre: '', origen: '', destino: '', distancia: 10, frecuencia: 'Semanal', viaPrincipal: '' });
                                              }
                                              setRutasList(rutasList.filter(item => item.id !== r.id));
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                            title="Eliminar Ruta"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Formulario de Adición / Edición Ruta */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 block text-xs">
                                  {editingRutaId ? 'Editar Ruta Frecuente' : 'Agregar Nueva Ruta Frecuente'}
                                </span>
                                {editingRutaId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRutaId(null);
                                      setNewRuta({ nombre: '', origen: '', destino: '', distancia: 10, frecuencia: 'Semanal', viaPrincipal: '' });
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancelar edición
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre de la Ruta"
                                  value={newRuta.nombre}
                                  onChange={(e) => setNewRuta({ ...newRuta, nombre: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Origen"
                                  value={newRuta.origen}
                                  onChange={(e) => setNewRuta({ ...newRuta, origen: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Destino"
                                  value={newRuta.destino}
                                  onChange={(e) => setNewRuta({ ...newRuta, destino: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="number"
                                  placeholder="Kilómetros"
                                  value={newRuta.distancia || ''}
                                  onChange={(e) => setNewRuta({ ...newRuta, distancia: parseInt(e.target.value) || 0 })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Frecuencia (ej: Diaria, 4 veces/mes)"
                                  value={newRuta.frecuencia}
                                  onChange={(e) => setNewRuta({ ...newRuta, frecuencia: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Vías principales utilizadas"
                                  value={newRuta.viaPrincipal}
                                  onChange={(e) => setNewRuta({ ...newRuta, viaPrincipal: e.target.value })}
                                  className="p-1.5 border border-gray-200 rounded text-[11px]"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newRuta.nombre || !newRuta.origen || !newRuta.destino) {
                                      alert('Por favor complete nombre, origen y destino de la ruta.');
                                      return;
                                    }
                                    if (editingRutaId) {
                                      setRutasList(rutasList.map(r => r.id === editingRutaId ? { ...newRuta, id: editingRutaId } : r));
                                      setEditingRutaId(null);
                                    } else {
                                      setRutasList([...rutasList, { ...newRuta, id: Date.now() }]);
                                    }
                                    setNewRuta({ nombre: '', origen: '', destino: '', distancia: 10, frecuencia: 'Semanal', viaPrincipal: '' });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                                >
                                  {editingRutaId ? <Check size={12} /> : <Plus size={12} />}
                                  {editingRutaId ? 'Actualizar Ruta' : 'Guardar Ruta'}
                                </button>
                                {editingRutaId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRutaId(null);
                                      setNewRuta({ nombre: '', origen: '', destino: '', distancia: 10, frecuencia: 'Semanal', viaPrincipal: '' });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB F: EMERGENCIAS */}
                        {activeDiagTab === 'emergencias' && (
                          <div className="space-y-6">
                            {/* Trained personnel count block */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200/50 flex flex-col justify-between">
                                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Colaboradores Capacitados</span>
                                <div className="mt-2 flex items-baseline gap-2">
                                  <input
                                    type="number"
                                    value={emergenciasCapacitados}
                                    onChange={(e) => setEmergenciasCapacitados(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-16 px-1.5 py-0.5 border border-emerald-300 rounded font-bold text-lg text-emerald-900 bg-white"
                                  />
                                  <span className="text-xs text-emerald-700 font-semibold">colaboradores capacitados en el Plan de Emergencias Viales</span>
                                </div>
                              </div>

                              <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-200/50 flex flex-col justify-between">
                                <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">Equipamiento de Primeros Auxilios</span>
                                <div className="mt-2 text-xs text-sky-800">
                                  Hay <strong className="text-base text-sky-950">{primerosAuxiliosList.length}</strong> tipos de equipos de primeros auxilios y elementos de rescate vial registrados y vigentes.
                                </div>
                              </div>

                              <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-200/50 flex flex-col justify-between">
                                <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">Simulacros de Emergencia</span>
                                <div className="mt-2 text-xs text-purple-800">
                                  Se han realizado y evaluado <strong className="text-base text-purple-950">{simulacrosList.length}</strong> simulacros de atención a emergencias viales.
                                </div>
                              </div>
                            </div>

                            {/* List of Equipment */}
                            <div className="space-y-3">
                              <span className="font-bold text-gray-800 text-xs block">Descripción y Equipamiento de Primeros Auxilios / Elementos para Atención de Siniestros</span>
                              <div className="overflow-x-auto border border-gray-150 rounded-lg">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold">
                                      <th className="p-2.5">Equipamiento / Elementos</th>
                                      <th className="p-2.5">Cantidad Dispuesta</th>
                                      <th className="p-2.5">Descripción de Ubicación / Uso</th>
                                      <th className="p-2.5 text-center">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {primerosAuxiliosList.map((eq) => (
                                      <tr key={eq.id} className={`hover:bg-gray-50/50 ${editingEquipoId === eq.id ? 'bg-amber-50/60' : ''}`}>
                                        <td className="p-2.5 font-bold text-gray-900">{eq.equipo}</td>
                                        <td className="p-2.5 font-semibold text-emerald-800">{eq.cantidad}</td>
                                        <td className="p-2.5 leading-tight">{eq.descripcion}</td>
                                        <td className="p-2.5 text-center whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingEquipoId(eq.id);
                                                setNewEquipo({
                                                  equipo: eq.equipo || '',
                                                  cantidad: eq.cantidad || '',
                                                  descripcion: eq.descripcion || ''
                                                });
                                              }}
                                              className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                              title="Editar Equipamiento"
                                            >
                                              <Edit size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (editingEquipoId === eq.id) {
                                                  setEditingEquipoId(null);
                                                  setNewEquipo({ equipo: '', cantidad: '', descripcion: '' });
                                                }
                                                setPrimerosAuxiliosList(primerosAuxiliosList.filter(item => item.id !== eq.id));
                                              }}
                                              className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                              title="Eliminar Equipamiento"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Formulario Agregar / Editar Equipo */}
                              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-2 text-[10.5px]">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-800 text-[11px]">
                                    {editingEquipoId ? 'Editar Equipamiento' : 'Agregar Equipamiento'}
                                  </span>
                                  {editingEquipoId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingEquipoId(null);
                                        setNewEquipo({ equipo: '', cantidad: '', descripcion: '' });
                                      }}
                                      className="text-[9.5px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                    >
                                      Cancelar edición
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nombre del Equipo (ej: Camillas de rescate)"
                                    value={newEquipo.equipo}
                                    onChange={(e) => setNewEquipo({ ...newEquipo, equipo: e.target.value })}
                                    className="p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Cantidad (ej: 5 botiquines)"
                                    value={newEquipo.cantidad}
                                    onChange={(e) => setNewEquipo({ ...newEquipo, cantidad: e.target.value })}
                                    className="p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Descripción corta de ubicación o estado"
                                      value={newEquipo.descripcion}
                                      onChange={(e) => setNewEquipo({ ...newEquipo, descripcion: e.target.value })}
                                      className="p-1.5 border border-gray-200 rounded flex-1 text-[10.5px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newEquipo.equipo || !newEquipo.cantidad) {
                                          alert('Por favor complete equipo y cantidad.');
                                          return;
                                        }
                                        if (editingEquipoId) {
                                          setPrimerosAuxiliosList(primerosAuxiliosList.map(item => item.id === editingEquipoId ? { ...newEquipo, id: editingEquipoId } : item));
                                          setEditingEquipoId(null);
                                        } else {
                                          setPrimerosAuxiliosList([...primerosAuxiliosList, { ...newEquipo, id: Date.now() }]);
                                        }
                                        setNewEquipo({ equipo: '', cantidad: '', descripcion: '' });
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 rounded cursor-pointer flex items-center justify-center"
                                    >
                                      {editingEquipoId ? <Check size={12} /> : <Plus size={12} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* List of Simulation Drills */}
                            <div className="space-y-3 pt-2">
                              <span className="font-bold text-gray-800 text-xs block">Registro Histórico de Simulacros de Atención de Emergencias Viales Realizados</span>
                              <div className="overflow-x-auto border border-gray-150 rounded-lg">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold">
                                      <th className="p-2.5">Tipo / Escenario del Simulacro</th>
                                      <th className="p-2.5">Fecha de Realización</th>
                                      <th className="p-2.5">Observaciones y Lecciones Aprendidas</th>
                                      <th className="p-2.5 text-center">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {simulacrosList.map((sim) => (
                                      <tr key={sim.id} className={`hover:bg-gray-50/50 ${editingSimulacroId === sim.id ? 'bg-amber-50/60' : ''}`}>
                                        <td className="p-2.5 font-bold text-gray-900 leading-tight">{sim.tipo}</td>
                                        <td className="p-2.5 font-mono text-[10px] font-bold text-gray-800">{sim.fecha}</td>
                                        <td className="p-2.5 leading-tight">{sim.observaciones}</td>
                                        <td className="p-2.5 text-center whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSimulacroId(sim.id);
                                                setNewSimulacro({
                                                  tipo: sim.tipo || '',
                                                  fecha: sim.fecha || '2026-06-01',
                                                  observaciones: sim.observaciones || ''
                                                });
                                              }}
                                              className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer transition-colors"
                                              title="Editar Simulacro"
                                            >
                                              <Edit size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (editingSimulacroId === sim.id) {
                                                  setEditingSimulacroId(null);
                                                  setNewSimulacro({ tipo: '', fecha: '2026-06-01', observaciones: '' });
                                                }
                                                setSimulacrosList(simulacrosList.filter(item => item.id !== sim.id));
                                              }}
                                              className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors"
                                              title="Eliminar Simulacro"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Formulario Agregar / Editar Simulacro */}
                              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-2 text-[10.5px]">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-800 text-[11px]">
                                    {editingSimulacroId ? 'Editar Simulacro Realizado' : 'Agregar Simulacro Realizado'}
                                  </span>
                                  {editingSimulacroId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSimulacroId(null);
                                        setNewSimulacro({ tipo: '', fecha: '2026-06-01', observaciones: '' });
                                      }}
                                      className="text-[9.5px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                    >
                                      Cancelar edición
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Tipo o Escenario (ej: Volcamiento con lesionado)"
                                    value={newSimulacro.tipo}
                                    onChange={(e) => setNewSimulacro({ ...newSimulacro, tipo: e.target.value })}
                                    className="p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                  <input
                                    type="date"
                                    value={newSimulacro.fecha}
                                    onChange={(e) => setNewSimulacro({ ...newSimulacro, fecha: e.target.value })}
                                    className="p-1.5 border border-gray-200 rounded text-[10.5px]"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Lecciones aprendidas o reporte de tiempos"
                                      value={newSimulacro.observaciones}
                                      onChange={(e) => setNewSimulacro({ ...newSimulacro, observaciones: e.target.value })}
                                      className="p-1.5 border border-gray-200 rounded flex-1 text-[10.5px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newSimulacro.tipo) {
                                          alert('Por favor complete el tipo de simulacro.');
                                          return;
                                        }
                                        if (editingSimulacroId) {
                                          setSimulacrosList(simulacrosList.map(item => item.id === editingSimulacroId ? { ...newSimulacro, id: editingSimulacroId } : item));
                                          setEditingSimulacroId(null);
                                        } else {
                                          setSimulacrosList([...simulacrosList, { ...newSimulacro, id: Date.now() }]);
                                        }
                                        setNewSimulacro({ tipo: '', fecha: '2026-06-01', observaciones: '' });
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 rounded cursor-pointer flex items-center justify-center"
                                    >
                                      {editingSimulacroId ? <Check size={12} /> : <Plus size={12} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DEMO PASO 6: Caracterización, evaluación y control de riesgos */}
                  {activeStep.id === 6 && (
                    <div className="space-y-6" id="demo-paso-5-riesgos">
                      {/* Intro normativo */}
                      <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 flex gap-3 text-xs text-emerald-950">
                        <Activity size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold">Caracterización, Evaluación y Control de Riesgos Viales</h4>
                          <p className="mt-1 text-gray-600 leading-relaxed">
                            En conformidad con el <strong>Paso 6</strong> de la Metodología de la Resolución 40595, esta sección permite identificar las actividades, productos y servicios de la organización, asociar sus impactos en seguridad vial para todos los actores, evaluar cuantitativamente el riesgo basándose en el <strong>Nivel de Exposición</strong> y el <strong>Nivel de Probabilidad</strong>, y finalmente asignar un <strong>Tratamiento del Riesgo</strong> con controles operacionales robustos.
                          </p>
                        </div>
                      </div>

                      {/* Tarjeta de Estadísticas de la Matriz */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-150 text-center shadow-xs">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Riesgos</span>
                          <span className="text-xl font-black text-gray-900 block mt-1">{risksList.length}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-red-100 text-center shadow-xs">
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block">Riesgos Críticos</span>
                          <span className="text-xl font-black text-red-600 block mt-1">
                            {risksList.filter(r => r.nivelRiesgoCategoria === 'Crítico').length}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 text-center shadow-xs">
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Riesgos Moderados</span>
                          <span className="text-xl font-black text-amber-600 block mt-1">
                            {risksList.filter(r => r.nivelRiesgoCategoria === 'Moderado').length}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center shadow-xs">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Riesgos Bajos</span>
                          <span className="text-xl font-black text-emerald-600 block mt-1">
                            {risksList.filter(r => r.nivelRiesgoCategoria === 'Bajo').length}
                          </span>
                        </div>
                      </div>

                      {/* Tablas de la metodología según imágenes */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                        <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                          <ClipboardList size={14} className="text-emerald-600" />
                          Metodología de Evaluación y Tablas de Referencia (Resolución 40595)
                        </span>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Tabla de Exposición */}
                          <div className="space-y-2">
                            <span className="text-[10.5px] font-bold text-gray-700 block">Tabla 3. Nivel de Exposición (NE)</span>
                            <div className="overflow-x-auto border border-gray-150 rounded text-[10px]">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-bold">
                                    <th className="p-1.5 text-center">Nivel</th>
                                    <th className="p-1.5 text-center">Valor</th>
                                    <th className="p-1.5">Descripción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">Frecuente</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">3</td>
                                    <td className="p-1.5 leading-tight">La exposición riesgo vial se presenta más de 6 horas al día.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">Ocasional</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">2</td>
                                    <td className="p-1.5 leading-tight">La exposición riesgo vial se presenta entre 3 y 6 horas al día.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">Esporádica</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">1</td>
                                    <td className="p-1.5 leading-tight">La exposición riesgo vial se presenta menos de 3 horas al día.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Tabla de Probabilidad */}
                          <div className="space-y-2">
                            <span className="text-[10.5px] font-bold text-gray-700 block">Tabla 4. Nivel de Probabilidad (NP)</span>
                            <div className="overflow-x-auto border border-gray-150 rounded text-[10px]">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-bold">
                                    <th className="p-1.5 text-center">Nivel</th>
                                    <th className="p-1.5 text-center">Valor</th>
                                    <th className="p-1.5">Descripción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">Muy Probable</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">3</td>
                                    <td className="p-1.5 leading-tight">No se tienen establecidos controles eficaces.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">Poco Probable</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">2</td>
                                    <td className="p-1.5 leading-tight">Se tienen controles, pero su eficacia es baja.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1.5 font-bold text-center bg-gray-50">No es Probable</td>
                                    <td className="p-1.5 text-center font-bold text-gray-900 bg-amber-50">1</td>
                                    <td className="p-1.5 leading-tight">Se tienen controles eficaces.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Matriz de Nivel de Riesgo (NR) */}
                          <div className="space-y-2">
                            <span className="text-[10.5px] font-bold text-gray-700 block">Matriz de Evaluación de Riesgos (NR = NE x NP)</span>
                            <div className="overflow-x-auto border border-gray-150 rounded text-[10px] bg-gray-50 p-1">
                              <table className="w-full border-collapse text-[9.5px] text-center bg-white font-semibold">
                                <thead>
                                  <tr className="bg-sky-50 text-sky-950 border-b border-gray-150 text-[9px]">
                                    <th colSpan={2} rowSpan={2} className="p-1 font-bold border border-gray-200">NIVEL DE RIESGO</th>
                                    <th colSpan={3} className="p-1 font-extrabold border border-gray-200 bg-blue-100/50">NIVEL DE PROBABILIDAD (NP)</th>
                                  </tr>
                                  <tr className="bg-gray-50 text-gray-600 text-[8.5px]">
                                    <th className="p-1 border border-gray-200 w-1/4">1<br/>No es Probable</th>
                                    <th className="p-1 border border-gray-200 w-1/4">2<br/>Poco Probable</th>
                                    <th className="p-1 border border-gray-200 w-1/4">3<br/>Muy Probable</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td rowSpan={3} className="bg-purple-50 text-purple-950 font-black border border-gray-200 w-12 py-1.5 text-[8px]">NE</td>
                                    <td className="p-1 bg-gray-50 border border-gray-200 font-bold">Frecuente (3)</td>
                                    <td className="p-1 bg-amber-400 text-amber-950 font-black border border-gray-200">3<br/>(Moderado)</td>
                                    <td className="p-1 bg-red-600 text-white font-black border border-gray-200">6<br/>(Crítico)</td>
                                    <td className="p-1 bg-red-600 text-white font-black border border-gray-200">9<br/>(Crítico)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1 bg-gray-50 border border-gray-200 font-bold">Ocasional (2)</td>
                                    <td className="p-1 bg-emerald-600 text-white font-black border border-gray-200">2<br/>(Bajo)</td>
                                    <td className="p-1 bg-amber-400 text-amber-950 font-black border border-gray-200">4<br/>(Moderado)</td>
                                    <td className="p-1 bg-red-600 text-white font-black border border-gray-200">6<br/>(Crítico)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1 bg-gray-50 border border-gray-200 font-bold">Esporádica (1)</td>
                                    <td className="p-1 bg-emerald-600 text-white font-black border border-gray-200">1<br/>(Bajo)</td>
                                    <td className="p-1 bg-emerald-600 text-white font-black border border-gray-200">2<br/>(Bajo)</td>
                                    <td className="p-1 bg-amber-400 text-amber-950 font-black border border-gray-200">3<br/>(Moderado)</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Controles de Filtros e interactividad */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-150 pb-3">
                          <span className="font-extrabold text-xs text-gray-950 flex items-center gap-1.5">
                            <Activity size={15} className="text-emerald-600" />
                            Matriz IPER de Riesgos Viales - Registros de la Organización
                          </span>
                          
                          {/* Filtros */}
                          <div className="flex flex-wrap gap-2 text-[10.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 font-bold">Actor Vial:</span>
                              <select
                                value={riskFilterActor}
                                onChange={(e) => setRiskFilterActor(e.target.value)}
                                className="p-1.5 border border-gray-200 rounded text-[10.5px] bg-white"
                              >
                                <option value="TODOS">Todos los actores</option>
                                <option value="Conductor">Conductor</option>
                                <option value="Motociclista">Motociclista</option>
                                <option value="Ciclista">Ciclista</option>
                                <option value="Peatón">Peatón</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 font-bold">Factor Seguro:</span>
                              <select
                                value={riskFilterFactor}
                                onChange={(e) => setRiskFilterFactor(e.target.value)}
                                className="p-1.5 border border-gray-200 rounded text-[10.5px] bg-white"
                              >
                                <option value="TODOS">Todos los factores</option>
                                <option value="Comportamiento seguro">Comportamiento seguro</option>
                                <option value="Vehículos seguros">Vehículos seguros</option>
                                <option value="Velocidades seguras">Velocidades seguras</option>
                                <option value="Entorno o infraestructura vial">Entorno o infraestructura vial</option>
                                <option value="Viajes seguros">Viajes seguros</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* TABLA DE RIESGOS VIALES */}
                        <div className="overflow-x-auto border border-gray-150 rounded-lg">
                          <table className="w-full text-left border-collapse text-[10.5px]">
                            <thead>
                              <tr className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold text-center">
                                <th className="p-2 text-left">Actividad & Servicio</th>
                                <th className="p-2 text-left">Riesgo / Impacto</th>
                                <th className="p-2">Actor Vial</th>
                                <th className="p-2 text-left">Factor & Variable de Riesgo</th>
                                <th className="p-2 w-10 text-center" title="Exposición (1-3)">NE</th>
                                <th className="p-2 w-10 text-center" title="Probabilidad (1-3)">NP</th>
                                <th className="p-2 text-center">Nivel Riesgo (NR)</th>
                                <th className="p-2">Tratamiento</th>
                                <th className="p-2 text-left">Controles Específicos Propuestos</th>
                                <th className="p-2 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                              {risksList
                                .filter(r => riskFilterActor === 'TODOS' || r.actorVial === riskFilterActor)
                                .filter(r => riskFilterFactor === 'TODOS' || r.factorSeguridad === riskFilterFactor)
                                .map((r) => {
                                  return (
                                    <tr key={r.id} className="hover:bg-gray-50/50">
                                      <td className="p-2 font-semibold text-gray-900 leading-tight">
                                        <div className="max-w-[150px] truncate font-bold" title={r.actividad}>{r.actividad}</div>
                                        <div className="text-[9px] text-gray-500 max-w-[150px] truncate" title={r.productoServicio}>{r.productoServicio}</div>
                                      </td>
                                      <td className="p-2 leading-tight">
                                        <div className="font-bold text-gray-800 max-w-[160px] whitespace-normal" title={r.riesgo}>{r.riesgo}</div>
                                        <div className="text-[9px] text-gray-500 mt-0.5 max-w-[160px] whitespace-normal" title={r.impacto}>{r.impacto}</div>
                                      </td>
                                      <td className="p-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider block uppercase ${
                                          r.actorVial === 'Conductor' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                          r.actorVial === 'Motociclista' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                          r.actorVial === 'Ciclista' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                          'bg-purple-50 text-purple-700 border border-purple-200'
                                        }`}>
                                          {r.actorVial}
                                        </span>
                                      </td>
                                      <td className="p-2 leading-tight">
                                        <div className="font-bold text-emerald-800 text-[9.5px]">{r.factorSeguridad}</div>
                                        <div className="text-[9px] text-gray-600 mt-0.5 italic max-w-[160px] whitespace-normal">{r.variableRiesgo}</div>
                                      </td>
                                      <td className="p-2 text-center font-bold text-gray-900 bg-gray-50/50 font-mono">{r.exposicion}</td>
                                      <td className="p-2 text-center font-bold text-gray-900 bg-gray-50/50 font-mono">{r.probabilidad}</td>
                                      <td className="p-2 text-center">
                                        <div className={`p-1 rounded-md font-black text-center border text-[10px] leading-tight ${
                                          r.nivelRiesgoCategoria === 'Crítico' ? 'bg-red-50 text-red-700 border-red-200 font-extrabold' :
                                          r.nivelRiesgoCategoria === 'Moderado' ? 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold' :
                                          'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold'
                                        }`}>
                                          <div className="text-xs">{r.nivelRiesgoValor}</div>
                                          <div className="text-[8px] uppercase tracking-wider">{r.nivelRiesgoCategoria}</div>
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <span className="font-extrabold text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                          {r.accionTratamiento}
                                        </span>
                                      </td>
                                      <td className="p-2 text-[9.5px] leading-tight max-w-[200px]" title={r.controlesPropuestos}>
                                        <p className="line-clamp-3 font-medium text-gray-800">{r.controlesPropuestos}</p>
                                      </td>
                                      <td className="p-2 text-center">
                                        <div className="flex gap-1 justify-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingRiskId(r.id);
                                              setNewRisk({
                                                actividad: r.actividad,
                                                productoServicio: r.productoServicio,
                                                riesgo: r.riesgo,
                                                impacto: r.impacto,
                                                actorVial: r.actorVial,
                                                factorSeguridad: r.factorSeguridad,
                                                variableRiesgo: r.variableRiesgo,
                                                exposicion: r.exposicion,
                                                probabilidad: r.probabilidad,
                                                accionTratamiento: r.accionTratamiento,
                                                controlesPropuestos: r.controlesPropuestos
                                              });
                                              document.getElementById('form-registro-riesgos')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="p-1 bg-gray-50 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer font-bold text-[9px]"
                                            title="Editar Riesgo"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setRisksList(risksList.filter(item => item.id !== r.id))}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                                            title="Eliminar Riesgo"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* FORMULARIO DE ADICIÓN / EDICIÓN */}
                      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 space-y-4 shadow-xs" id="form-registro-riesgos">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <PenTool size={14} className="text-emerald-600" />
                            {editingRiskId ? 'Editar Riesgo Vial Registrado' : 'Registrar Nuevo Riesgo Vial (Matriz IPER)'}
                          </h4>
                          {editingRiskId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRiskId(null);
                                setNewRisk({
                                  actividad: '', productoServicio: '', riesgo: '', impacto: '',
                                  actorVial: 'Conductor', factorSeguridad: 'Comportamiento seguro',
                                  variableRiesgo: 'Comportamiento: exceso de horas de conducción',
                                  exposicion: 2, probabilidad: 1, accionTratamiento: 'Modificar factores',
                                  controlesPropuestos: ''
                                });
                              }}
                              className="text-[10px] text-gray-500 underline hover:text-gray-800 font-bold"
                            >
                              Cancelar Edición
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                          {/* Columna 1 */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-gray-600 font-bold mb-1">Actividad de la Organización</label>
                              <input
                                type="text"
                                value={newRisk.actividad}
                                onChange={(e) => setNewRisk({ ...newRisk, actividad: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                placeholder="ej. Transporte nocturno de carga intermunicipal o Distribución última milla"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 font-bold mb-1">Producto o Servicio Generado</label>
                              <input
                                type="text"
                                value={newRisk.productoServicio}
                                onChange={(e) => setNewRisk({ ...newRisk, productoServicio: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                placeholder="ej. Despacho y entrega de materias primas pesadas o Paquetería express"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Actor Vial</label>
                                <select
                                  value={newRisk.actorVial}
                                  onChange={(e) => setNewRisk({ ...newRisk, actorVial: e.target.value as any })}
                                  className="w-full p-2 border border-gray-200 bg-white rounded text-[11px]"
                                >
                                  <option value="Conductor">Conductor</option>
                                  <option value="Motociclista">Motociclista</option>
                                  <option value="Ciclista">Ciclista</option>
                                  <option value="Peatón">Peatón</option>
                                  <option value="Varios">Varios Actores</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Factor del Sistema Seguro</label>
                                <select
                                  value={newRisk.factorSeguridad}
                                  onChange={(e) => {
                                    const fs = e.target.value;
                                    let defaultVar = '';
                                    if (fs === 'Comportamiento seguro') defaultVar = 'Comportamiento: exceso de horas de conducción, distracción o fatiga';
                                    else if (fs === 'Vehículos seguros') defaultVar = 'Vehículos: deficiencias en la inspección preoperacional o retrasos en mantenimiento';
                                    else if (fs === 'Velocidades seguras') defaultVar = 'Velocidad: exceso de velocidad o desaceleraciones bruscas';
                                    else if (fs === 'Entorno o infraestructura vial') defaultVar = 'Entorno: derrumbes, lluvia, vías con huecos o iluminación deficiente';
                                    else if (fs === 'Viajes seguros') defaultVar = 'Viajes: errores en la planificación de rutas o falta de controles operacionales';

                                    setNewRisk({ ...newRisk, factorSeguridad: fs as any, variableRiesgo: defaultVar });
                                  }}
                                  className="w-full p-2 border border-gray-200 bg-white rounded text-[11px]"
                                >
                                  <option value="Comportamiento seguro">Comportamiento seguro</option>
                                  <option value="Vehículos seguros">Vehículos seguros</option>
                                  <option value="Velocidades seguras">Velocidades seguras</option>
                                  <option value="Entorno o infraestructura vial">Entorno o infraestructura vial</option>
                                  <option value="Viajes seguros">Viajes seguros</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-gray-600 font-bold mb-1">Variable de Riesgo Crítico Asociada</label>
                              <input
                                type="text"
                                value={newRisk.variableRiesgo}
                                onChange={(e) => setNewRisk({ ...newRisk, variableRiesgo: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded text-[11px] font-semibold text-emerald-800"
                                placeholder="ej. Comportamiento: no uso de casco homologado, distracción, celular"
                              />
                            </div>
                          </div>

                          {/* Columna 2 */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Peligro / Riesgo Específico</label>
                                <input
                                  type="text"
                                  value={newRisk.riesgo}
                                  onChange={(e) => setNewRisk({ ...newRisk, riesgo: e.target.value })}
                                  className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                  placeholder="ej. Choque por alcance en vía lluviosa"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Impactos / Daños Potenciales</label>
                                <input
                                  type="text"
                                  value={newRisk.impacto}
                                  onChange={(e) => setNewRisk({ ...newRisk, impacto: e.target.value })}
                                  className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                  placeholder="ej. Muerte, traumatismo encéfalo-craneano, daños"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                              <div>
                                <label className="block text-gray-700 font-black mb-1">NE (Exposición)</label>
                                <select
                                  value={newRisk.exposicion}
                                  onChange={(e) => setNewRisk({ ...newRisk, exposicion: parseInt(e.target.value) as any })}
                                  className="w-full p-1.5 border border-gray-300 bg-white rounded text-[11px] font-bold"
                                >
                                  <option value={1}>1 - Esporádica (&lt;3h/día)</option>
                                  <option value={2}>2 - Ocasional (3-6h/día)</option>
                                  <option value={3}>3 - Frecuente (&gt;6h/día)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-gray-700 font-black mb-1">NP (Probabilidad)</label>
                                <select
                                  value={newRisk.probabilidad}
                                  onChange={(e) => setNewRisk({ ...newRisk, probabilidad: parseInt(e.target.value) as any })}
                                  className="w-full p-1.5 border border-gray-300 bg-white rounded text-[11px] font-bold"
                                >
                                  <option value={1}>1 - No es Probable (Controles eficaces)</option>
                                  <option value={2}>2 - Poco Probable (Baja eficacia)</option>
                                  <option value={3}>3 - Muy Probable (Sin controles eficaces)</option>
                                </select>
                              </div>

                              {/* Cálculo en vivo de Vista Previa */}
                              <div>
                                <span className="block text-gray-600 font-bold mb-1 text-center">Riesgo Calculado</span>
                                <div className={`p-1 rounded text-center text-[10px] font-black border ${
                                  newRisk.exposicion * newRisk.probabilidad >= 6 ? 'bg-red-50 text-red-700 border-red-200' :
                                  newRisk.exposicion * newRisk.probabilidad >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  Val: {newRisk.exposicion * newRisk.probabilidad}<br/>
                                  {newRisk.exposicion * newRisk.probabilidad >= 6 ? 'I: CRÍTICO' :
                                   newRisk.exposicion * newRisk.probabilidad >= 3 ? 'II: MODERADO' : 'III: BAJO'}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Acción de Tratamiento del Riesgo</label>
                                <select
                                  value={newRisk.accionTratamiento}
                                  onChange={(e) => setNewRisk({ ...newRisk, accionTratamiento: e.target.value as any })}
                                  className="w-full p-2 border border-gray-200 bg-white rounded text-[11px]"
                                >
                                  <option value="Evitar">Evitar el riesgo</option>
                                  <option value="Aceptar">Aceptar el riesgo</option>
                                  <option value="Eliminar fuente">Eliminar la fuente que lo ocasiona</option>
                                  <option value="Modificar factores">Modificar los factores de exposición y probabilidad</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Controles Específicos a Implementar</label>
                                <textarea
                                  value={newRisk.controlesPropuestos}
                                  onChange={(e) => setNewRisk({ ...newRisk, controlesPropuestos: e.target.value })}
                                  rows={1}
                                  className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                  placeholder="ej. Auditorías semanales de GPS, instalación de defensas, descansos..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newRisk.actividad || !newRisk.riesgo || !newRisk.impacto) {
                                alert('Por favor complete la actividad, el riesgo y el impacto antes de guardar.');
                                return;
                              }

                              const val = newRisk.exposicion * newRisk.probabilidad;
                              let cat: 'Bajo' | 'Moderado' | 'Crítico' = 'Bajo';
                              if (val >= 6) cat = 'Crítico';
                              else if (val >= 3) cat = 'Moderado';

                              if (editingRiskId !== null) {
                                // Update existing
                                setRisksList(risksList.map(item => item.id === editingRiskId ? {
                                  ...item,
                                  ...newRisk,
                                  nivelRiesgoValor: val,
                                  nivelRiesgoCategoria: cat
                                } : item));
                                setEditingRiskId(null);
                              } else {
                                // Add new
                                setRisksList([...risksList, {
                                  id: Date.now(),
                                  ...newRisk,
                                  nivelRiesgoValor: val,
                                  nivelRiesgoCategoria: cat
                                }]);
                              }

                              // Reset
                              setNewRisk({
                                actividad: '', productoServicio: '', riesgo: '', impacto: '',
                                actorVial: 'Conductor', factorSeguridad: 'Comportamiento seguro',
                                variableRiesgo: 'Comportamiento: exceso de horas de conducción',
                                exposicion: 2, probabilidad: 1, accionTratamiento: 'Modificar factores',
                                controlesPropuestos: ''
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs shadow-md transition-all"
                          >
                            <Plus size={14} />
                            {editingRiskId ? 'Actualizar Registro de Riesgo' : 'Agregar Riesgo a Matriz IPER'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DEMO PASO 7: Objetivos y metas del PESV */}
                  {activeStep.id === 7 && (() => {
                    const selectedObjectiveObj = objectivesList.find(o => o.id === selectedObjectiveForChart) || objectivesList[0] || null;
                    const sortedValues = selectedObjectiveObj 
                      ? [...selectedObjectiveObj.valoresAnuales].sort((a, b) => a.year - b.year)
                      : [];
                    const targetValue = selectedObjectiveObj ? selectedObjectiveObj.metaValor : 100;
                    const actualValues = sortedValues.map(v => v.value);
                    const maxVal = Math.max(targetValue, ...actualValues, 10);
                    const axisMax = Math.ceil(maxVal * 1.15);

                    const gridSteps = 4;
                    const gridLines = Array.from({ length: gridSteps + 1 }).map((_, idx) => {
                      const val = (axisMax * idx) / gridSteps;
                      const y = 160 - (idx / gridSteps) * 140;
                      return { value: Number(val.toFixed(1)), y };
                    });

                    const pointsCount = sortedValues.length;
                    const chartPoints = sortedValues.map((item, idx) => {
                      const x = pointsCount <= 1 ? 250 : 60 + (idx * 390) / (pointsCount - 1);
                      const y = 160 - (item.value / axisMax) * 140;
                      return { ...item, x, y };
                    });

                    const pathD = chartPoints.reduce((acc, pt, idx) => {
                      return acc + `${idx === 0 ? 'M' : 'L'} ${pt.x},${pt.y} `;
                    }, '');

                    const targetY = 160 - (targetValue / axisMax) * 140;

                    return (
                      <div className="space-y-6" id="demo-paso-6-objetivos">
                        {/* Intro normativo */}
                        <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-100 flex gap-3 text-xs text-sky-950">
                          <Shield size={24} className="text-sky-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-sky-900">Objetivos y Metas del PESV (Paso 7 de la Metodología)</h4>
                            <p className="mt-1 text-gray-600 leading-relaxed">
                              En conformidad con la metodología de la <strong>Resolución 40595</strong>, la organización debe establecer objetivos medibles y metas claras enfocadas a reducir la siniestralidad, lesiones laborales y mejorar los comportamientos viales. Aplica obligatoriamente para los niveles <strong>Básico, Estándar y Avanzado</strong>.
                            </p>
                          </div>
                        </div>

                        {/* Integración con Módulo de Indicadores: Indicador 4 CM PESV */}
                        {(() => {
                          const totalObj = objectivesList.length;
                          const metObj = objectivesList.filter(o => {
                            const latest = o.valoresAnuales?.[o.valoresAnuales.length - 1]?.value;
                            if (latest === undefined) return false;
                            return o.unidadMedida === 'Siniestros' ? latest <= o.metaValor : latest >= o.metaValor;
                          }).length;
                          const pct = totalObj > 0 ? Math.round((metObj / totalObj) * 100) : 100;
                          return (
                            <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-4 rounded-xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                              <div className="flex items-center gap-3">
                                <span className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                                  <Activity size={18} />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                      Indicador Oficial 4: CM PESV
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-600">
                                      (MA(t) / TM(t)) * 100
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 mt-1">
                                    Metas alcanzadas: <strong className="text-emerald-900">{metObj} de {totalObj}</strong> definidas • Cumplimiento actual: <strong className="text-emerald-700 font-black">{pct}%</strong>.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const step20 = PESV_STEPS.find(s => s.id === 20);
                                  if (step20) {
                                    setActiveStep(step20);
                                  } else if (onNavigateToIndicators) {
                                    onNavigateToIndicators();
                                  } else {
                                    window.dispatchEvent(new CustomEvent('pesv_navigate_tab', { detail: { tab: 'dashboard' } }));
                                  }
                                }}
                                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                              >
                                <span>Ir a Medición y Tablero de Indicadores (Paso 20)</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          );
                        })()}

                        {/* Layout de Dashboard con Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Columna Izquierda: Lista de Objetivos (Interactive Selection) */}
                          <div className="lg:col-span-5 space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                              <span className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wider block border-b border-gray-100 pb-2">
                                Objetivos Estratégicos del PESV
                              </span>
                              
                              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                {objectivesList.map((o) => {
                                  const isSelected = selectedObjectiveObj?.id === o.id;
                                  const latestVal = o.valoresAnuales.length > 0 
                                    ? [...o.valoresAnuales].sort((a, b) => b.year - a.year)[0].value 
                                    : null;
                                  
                                  // Determine status
                                  const isGoalMet = latestVal !== null && (
                                    o.unidadMedida === 'Siniestros' 
                                      ? latestVal <= o.metaValor 
                                      : latestVal >= o.metaValor
                                  );

                                  return (
                                    <div
                                      key={o.id}
                                      onClick={() => setSelectedObjectiveForChart(o.id)}
                                      className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                                        isSelected 
                                          ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300 shadow-sm' 
                                          : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start gap-1">
                                        <span className="font-bold text-[11.5px] text-gray-900 leading-tight block">
                                          {o.objetivo}
                                        </span>
                                        {latestVal !== null && (
                                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wide uppercase shrink-0 ${
                                            isGoalMet 
                                              ? 'bg-emerald-100 text-emerald-800' 
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {isGoalMet ? 'Cumplido' : 'En Proceso'}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                                        <strong>Meta:</strong> {o.meta}
                                      </p>

                                      {/* Indicadores Oficiales Vinculados al Objetivo */}
                                      {(() => {
                                        const linkedIds = o.indicadoresOficialesIds && o.indicadoresOficialesIds.length > 0
                                          ? o.indicadoresOficialesIds
                                          : (o.indicadorOficialId ? [o.indicadorOficialId] : []);
                                        if (linkedIds.length === 0) return null;
                                        return (
                                          <div className="mt-2 pt-1.5 border-t border-gray-100 space-y-1">
                                            <div className="flex items-center justify-between text-[8.5px] text-gray-500 font-extrabold uppercase tracking-tight">
                                              <span>Mide {linkedIds.length} {linkedIds.length === 1 ? 'indicador normativo' : 'indicadores normativos'}:</span>
                                              <span className="font-mono text-sky-700">Res. 40595</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {linkedIds.map(indId => {
                                                const ind = PESV_OFFICIAL_INDICATORS.find(i => i.id === indId);
                                                if (!ind) return null;
                                                return (
                                                  <span
                                                    key={ind.id}
                                                    title={`${ind.code} - ${ind.nombre} (${ind.tipo})`}
                                                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black ${
                                                      ind.tipo === 'resultado'
                                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                                                    }`}
                                                  >
                                                    #{ind.id} {ind.code}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-200/50 text-[10px]">
                                        <div className="text-gray-600">
                                          Meta Numérica: <span className="font-black text-gray-900">{o.metaValor}{o.unidadMedida}</span>
                                        </div>
                                        <div className="text-gray-600">
                                          Último: <span className="font-black text-sky-700">{latestVal !== null ? `${latestVal}${o.unidadMedida}` : 'N/A'}</span>
                                        </div>
                                      </div>

                                      {/* Mini Acciones */}
                                      <div className="flex gap-2 justify-end mt-2 pt-1.5 border-t border-dashed border-gray-200">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingObjectiveId(o.id);
                                            const linked = o.indicadoresOficialesIds && o.indicadoresOficialesIds.length > 0
                                              ? o.indicadoresOficialesIds
                                              : (o.indicadorOficialId ? [o.indicadorOficialId] : []);
                                            setSelectedFormIndicatorIds(linked);
                                            setNewObjective({
                                              objetivo: o.objetivo,
                                              meta: o.meta,
                                              indicador: o.indicador,
                                              unidadMedida: o.unidadMedida,
                                              metaValor: o.metaValor,
                                              indicadoresOficialesIds: linked,
                                              indicadoresOficialesCodigos: o.indicadoresOficialesCodigos
                                            });
                                            setTempYearValues([...o.valoresAnuales]);
                                            document.getElementById('form-registro-objetivos')?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="text-[9px] font-bold text-sky-700 hover:underline cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = objectivesList.filter(item => item.id !== o.id);
                                            setObjectivesList(updated);
                                            if (selectedObjectiveForChart === o.id && updated.length > 0) {
                                              setSelectedObjectiveForChart(updated[0].id);
                                            }
                                          }}
                                          className="text-[9px] font-bold text-red-600 hover:underline cursor-pointer"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Columna Derecha: Gráfica de Seguimiento & Valores del Año */}
                          <div className="lg:col-span-7 space-y-4">
                            {selectedObjectiveObj ? (
                              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-5" id="objective-chart-panel">
                                <div className="border-b border-gray-100 pb-3 space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <div className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Visualización Estratégica • Paso 7</div>
                                      <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">{selectedObjectiveObj.objetivo}</h3>
                                    </div>
                                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold shrink-0">
                                      Meta: {selectedObjectiveObj.metaValor}{selectedObjectiveObj.unidadMedida}
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-gray-500 leading-snug">
                                    <strong>Meta del Objetivo:</strong> {selectedObjectiveObj.meta}
                                  </p>
                                  <p className="text-[10.5px] text-gray-600 leading-snug">
                                    <strong>Fórmula(s) / Indicador:</strong> <span className="font-mono text-gray-800">{selectedObjectiveObj.indicador}</span>
                                  </p>

                                  {/* Tarjetas de Indicadores Oficiales Vinculados */}
                                  {(() => {
                                    const linkedIds = selectedObjectiveObj.indicadoresOficialesIds && selectedObjectiveObj.indicadoresOficialesIds.length > 0
                                      ? selectedObjectiveObj.indicadoresOficialesIds
                                      : (selectedObjectiveObj.indicadorOficialId ? [selectedObjectiveObj.indicadorOficialId] : []);
                                    if (linkedIds.length === 0) return null;
                                    return (
                                      <div className="bg-gradient-to-r from-sky-50/70 to-emerald-50/70 p-3 rounded-xl border border-sky-100 space-y-2 mt-2">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="font-extrabold text-sky-950 uppercase tracking-tight flex items-center gap-1.5">
                                            <Target size={13} className="text-sky-600" />
                                            Indicadores de la Resolución 40595 que Mide este Objetivo ({linkedIds.length}):
                                          </span>
                                          <span className="text-[9px] text-gray-500 font-bold">Medición en Paso 20</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {linkedIds.map(indId => {
                                            const ind = PESV_OFFICIAL_INDICATORS.find(i => i.id === indId);
                                            if (!ind) return null;
                                            return (
                                              <div key={ind.id} className="bg-white p-2.5 rounded-lg border border-gray-200/80 shadow-2xs flex flex-col justify-between text-[10px] space-y-2">
                                                <div>
                                                  <div className="flex items-center justify-between gap-1 mb-1">
                                                    <span className="font-mono font-black text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-[9.5px]">
                                                      #{ind.id} {ind.code}
                                                    </span>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                                      ind.tipo === 'resultado' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                                                    }`}>
                                                      {ind.tipo}
                                                    </span>
                                                  </div>
                                                  <p className="font-bold text-gray-800 leading-tight">
                                                    {ind.nombre}
                                                  </p>
                                                  <p className="font-mono text-[9px] text-gray-500 mt-1 truncate" title={ind.formula}>
                                                    {ind.formula}
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => navigateToIndicatorInStep20(ind.id)}
                                                  className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded flex items-center justify-between cursor-pointer border border-emerald-200 transition-colors"
                                                  title={`Ir a medir el indicador ${ind.code} en el Paso 20`}
                                                >
                                                  <span>Medir en Paso 20</span>
                                                  <ArrowRight size={10} />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* SVG Graph */}
                                <div className="relative bg-gray-50/50 p-3 rounded-lg border border-gray-150">
                                  <div className="absolute top-2 right-3 flex items-center gap-4 text-[9px] font-bold animate-pulse">
                                    <div className="flex items-center gap-1">
                                      <span className="w-2.5 h-0.5 bg-sky-500 inline-block"></span>
                                      <span className="text-gray-600">Histórico de Logros</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="w-2.5 h-0.5 border-t border-dashed border-red-500 inline-block"></span>
                                      <span className="text-red-500">Meta: {selectedObjectiveObj.metaValor}{selectedObjectiveObj.unidadMedida}</span>
                                    </div>
                                  </div>

                                  <div className="h-56 w-full">
                                    {sortedValues.length === 0 ? (
                                      <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                                        No hay valores anuales registrados para generar la gráfica.
                                      </div>
                                    ) : (
                                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                                        {/* Dynamic Grid Lines */}
                                        {gridLines.map((line, idx) => (
                                          <g key={idx}>
                                            <line 
                                              x1="45" 
                                              y1={line.y} 
                                              x2="475" 
                                              y2={line.y} 
                                              stroke={idx === 0 ? '#cbd5e1' : '#f1f5f9'} 
                                              strokeWidth={idx === 0 ? 1.5 : 1} 
                                            />
                                            <text 
                                              x="20" 
                                              y={line.y + 3} 
                                              className="text-[9px] fill-gray-400 font-mono text-right" 
                                              textAnchor="end"
                                            >
                                              {line.value}{selectedObjectiveObj.unidadMedida}
                                            </text>
                                          </g>
                                        ))}

                                        {/* Goal / Meta Dotted Red Line */}
                                        <line 
                                          x1="45" 
                                          y1={targetY} 
                                          x2="475" 
                                          y2={targetY} 
                                          stroke="#ef4444" 
                                          strokeWidth="1.5" 
                                          strokeDasharray="4 4" 
                                        />

                                        {/* Actual solid trend line */}
                                        {pathD && (
                                          <path
                                            d={pathD}
                                            fill="none"
                                            stroke="#0284c7"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        )}

                                        {/* Actual points */}
                                        {chartPoints.map((pt, idx) => (
                                          <g key={idx}>
                                            <circle 
                                              cx={pt.x} 
                                              cy={pt.y} 
                                              r="5" 
                                              fill="#ffffff" 
                                              stroke="#0284c7" 
                                              strokeWidth="2.5" 
                                            />
                                            {/* Value Label above node */}
                                            <text 
                                              x={pt.x} 
                                              y={pt.y - 10} 
                                              className="text-[10px] font-black fill-sky-950 font-mono" 
                                              textAnchor="middle"
                                            >
                                              {pt.value}{selectedObjectiveObj.unidadMedida}
                                            </text>
                                            {/* X Axis Label (Year) */}
                                            <text 
                                              x={pt.x} 
                                              y="185" 
                                              className="text-[10px] font-bold fill-gray-500" 
                                              textAnchor="middle"
                                            >
                                              {pt.year}
                                            </text>
                                          </g>
                                        ))}
                                      </svg>
                                    )}
                                  </div>
                                </div>

                                {/* Table layout underneath to quickly add/edit year values */}
                                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                                  <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-200">
                                    <Calendar size={13} className="text-sky-600" />
                                    Valores Alcanzados por Año para este Objetivo
                                  </span>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* List of current values */}
                                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto text-[10.5px]">
                                      {selectedObjectiveObj.valoresAnuales.length === 0 ? (
                                        <div className="text-gray-400 italic">No hay registros cargados.</div>
                                      ) : (
                                        [...selectedObjectiveObj.valoresAnuales]
                                          .sort((a, b) => a.year - b.year)
                                          .map((item) => (
                                            <div key={item.year} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-gray-200">
                                              <span className="font-black text-gray-700">Año {item.year}:</span>
                                              <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-sky-800">{item.value}{selectedObjectiveObj.unidadMedida}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updatedAnuales = selectedObjectiveObj.valoresAnuales.filter(v => v.year !== item.year);
                                                    setObjectivesList(objectivesList.map(o => o.id === selectedObjectiveObj.id ? { ...o, valoresAnuales: updatedAnuales } : o));
                                                  }}
                                                  className="text-red-500 hover:text-red-700 font-bold ml-1 text-[11px] cursor-pointer"
                                                  title="Eliminar valor del año"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                      )}
                                    </div>

                                    {/* Mini-form to quickly add/update a year value */}
                                    <div className="bg-white p-2.5 rounded border border-gray-200 text-[10.5px] flex flex-col justify-between">
                                      <div className="font-bold text-gray-700 mb-1.5">Agregar / Actualizar Registro Anual</div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                          <label className="text-[9.5px] font-bold text-gray-500 block mb-0.5">Año</label>
                                          <input
                                            type="number"
                                            value={newYearInput}
                                            onChange={(e) => setNewYearInput(e.target.value)}
                                            className="w-full p-1 border border-gray-200 rounded text-[10.5px] font-mono text-center"
                                            placeholder="ej. 2027"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9.5px] font-bold text-gray-500 block mb-0.5">Valor ({selectedObjectiveObj.unidadMedida})</label>
                                          <input
                                            type="number"
                                            value={newValueInput}
                                            onChange={(e) => setNewValueInput(e.target.value)}
                                            className="w-full p-1 border border-gray-200 rounded text-[10.5px] font-mono text-center"
                                            placeholder="ej. 98"
                                          />
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const yearNum = parseInt(newYearInput);
                                          const valueNum = parseFloat(newValueInput);
                                          if (isNaN(yearNum) || isNaN(valueNum)) {
                                            alert('Por favor ingrese números válidos tanto para el año como para el valor.');
                                            return;
                                          }
                                          
                                          // Update or add year
                                          let updatedAnuales = [...selectedObjectiveObj.valoresAnuales];
                                          const existingIndex = updatedAnuales.findIndex(v => v.year === yearNum);
                                          if (existingIndex >= 0) {
                                            updatedAnuales[existingIndex].value = valueNum;
                                          } else {
                                            updatedAnuales.push({ year: yearNum, value: valueNum });
                                          }

                                          setObjectivesList(objectivesList.map(o => o.id === selectedObjectiveObj.id ? { ...o, valoresAnuales: updatedAnuales } : o));
                                          setNewValueInput('');
                                          setNewYearInput(String(yearNum + 1));
                                        }}
                                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-1.5 rounded text-[10px] cursor-pointer"
                                      >
                                        Registrar Logro Anual
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                                Seleccione un objetivo de la izquierda o cree uno nuevo para visualizar su gráfica de seguimiento.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* FORMULARIO DE CREACIÓN / EDICIÓN DE OBJETIVO */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4" id="form-registro-objetivos">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h4 className="text-xs font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider">
                              <PenTool size={14} className="text-sky-600" />
                              {editingObjectiveId ? 'Editar Objetivo Estratégico' : 'Crear Nuevo Objetivo del PESV'}
                            </h4>
                            {editingObjectiveId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingObjectiveId(null);
                                  setSelectedFormIndicatorIds([]);
                                  setShowIndicatorChecklist(false);
                                  setNewObjective({
                                    objetivo: '',
                                    meta: '',
                                    indicador: '',
                                    unidadMedida: '%',
                                    metaValor: 90,
                                    indicadoresOficialesIds: []
                                  });
                                  setTempYearValues([
                                    { year: 2024, value: 70 },
                                    { year: 2025, value: 80 },
                                    { year: 2026, value: 90 }
                                  ]);
                                }}
                                className="text-[10px] text-gray-500 underline hover:text-gray-800 font-bold"
                              >
                                Cancelar Edición
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                            {/* Inputs de definición */}
                            <div className="space-y-3">
                              {/* Selector de Indicadores Oficiales de la Resolución 40595 (Permite 1, 2 o más indicadores) */}
                              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-300 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <label className="block text-[11px] font-black uppercase text-emerald-950 flex items-center gap-1.5">
                                      <Target size={14} className="text-emerald-700 shrink-0" />
                                      Indicadores Normativos Asociados a este Objetivo (Resolución 40595):
                                    </label>
                                    <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                                      Un objetivo estratégico del PESV puede medir <strong>uno, dos o más indicadores oficiales</strong>. Seleccione de la lista desplegable los indicadores que apliquen:
                                    </p>
                                  </div>
                                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0">
                                    {selectedFormIndicatorIds.length} {selectedFormIndicatorIds.length === 1 ? 'indicador' : 'indicadores'}
                                  </span>
                                </div>

                                {/* Dropdown Selector */}
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const indId = Number(e.target.value);
                                    if (!indId) return;
                                    if (!selectedFormIndicatorIds.includes(indId)) {
                                      const updated = [...selectedFormIndicatorIds, indId];
                                      setSelectedFormIndicatorIds(updated);
                                      const selected = PESV_OFFICIAL_INDICATORS.find(i => i.id === indId);
                                      if (selected) {
                                        if (updated.length === 1 && !newObjective.objetivo) {
                                          setNewObjective(prev => ({
                                            ...prev,
                                            objetivo: `Gestión y seguimiento de ${selected.nombre.toLowerCase()}`,
                                            meta: `Cumplir la meta reglamentaria de ${selected.metaPredeterminada}${selected.unidad} en ${selected.code}`,
                                            indicador: `${selected.code}: ${selected.formula}`,
                                            unidadMedida: selected.unidad === '%' ? '%' : (selected.unidad === '$ COP' ? '$ COP' : 'Siniestros'),
                                            metaValor: selected.metaPredeterminada
                                          }));
                                        } else {
                                          setNewObjective(prev => {
                                            const hasCode = prev.indicador && prev.indicador.includes(selected.code);
                                            const newFormulaText = hasCode
                                              ? prev.indicador
                                              : (prev.indicador ? `${prev.indicador} | ${selected.code}: ${selected.formula}` : `${selected.code}: ${selected.formula}`);
                                            return {
                                              ...prev,
                                              indicador: newFormulaText
                                            };
                                          });
                                        }
                                      }
                                    }
                                  }}
                                  className="w-full p-2.5 border-2 border-emerald-400 focus:border-emerald-600 rounded-lg text-[11px] font-bold bg-white text-gray-900 cursor-pointer shadow-xs focus:ring-2 focus:ring-emerald-400"
                                >
                                  <option value="">-- Seleccionar y agregar indicador normativo a este objetivo (1 al 13) --</option>
                                  {PESV_OFFICIAL_INDICATORS.map(ind => {
                                    const isAlreadyAdded = selectedFormIndicatorIds.includes(ind.id);
                                    return (
                                      <option key={ind.id} value={ind.id} disabled={isAlreadyAdded}>
                                        {isAlreadyAdded ? '✓ [Ya vinculado] ' : '+ Agregar: '}Indicador {ind.id}: {ind.code} - {ind.nombre} ({ind.tipo.toUpperCase()}) [Meta: {ind.metaPredeterminada}{ind.unidad}]
                                      </option>
                                    );
                                  })}
                                </select>

                                {/* Chips y Detalle de Indicadores Seleccionados */}
                                {selectedFormIndicatorIds.length > 0 ? (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between text-[9.5px]">
                                      <span className="font-extrabold text-emerald-950 uppercase">
                                        Indicadores seleccionados ({selectedFormIndicatorIds.length}):
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const formulas = selectedFormIndicatorIds
                                            .map(id => PESV_OFFICIAL_INDICATORS.find(i => i.id === id))
                                            .filter(Boolean)
                                            .map(ind => `${ind!.code}: ${ind!.formula}`)
                                            .join(' | ');
                                          setNewObjective(prev => ({ ...prev, indicador: formulas }));
                                        }}
                                        className="text-emerald-800 hover:text-emerald-950 underline font-bold cursor-pointer"
                                      >
                                        Consolidar fórmulas en el campo indicador
                                      </button>
                                    </div>

                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                      {selectedFormIndicatorIds.map(indId => {
                                        const ind = PESV_OFFICIAL_INDICATORS.find(i => i.id === indId);
                                        if (!ind) return null;
                                        return (
                                          <div key={ind.id} className="bg-white p-2 rounded-lg border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-2 text-[10.5px]">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-mono font-black text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-[9.5px]">
                                                  #{ind.id} {ind.code}
                                                </span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                                  ind.tipo === 'resultado' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                                                }`}>
                                                  {ind.tipo}
                                                </span>
                                                <span className="font-bold text-gray-800 truncate">
                                                  {ind.nombre}
                                                </span>
                                              </div>
                                              <div className="font-mono text-[9px] text-gray-500 mt-0.5 truncate">
                                                Fórmula: {ind.formula}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setNewObjective(prev => ({
                                                    ...prev,
                                                    metaValor: ind.metaPredeterminada,
                                                    unidadMedida: ind.unidad === '%' ? '%' : (ind.unidad === '$ COP' ? '$ COP' : 'Siniestros')
                                                  }));
                                                }}
                                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-[8.5px] cursor-pointer"
                                                title={`Asignar la meta de este indicador (${ind.metaPredeterminada}${ind.unidad})`}
                                              >
                                                Meta: {ind.metaPredeterminada}{ind.unidad}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedFormIndicatorIds(selectedFormIndicatorIds.filter(id => id !== ind.id));
                                                }}
                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded font-bold cursor-pointer"
                                                title="Quitar este indicador del objetivo"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {selectedFormIndicatorIds.length >= 2 && (
                                      <div className="bg-sky-50/80 p-2 rounded-lg border border-sky-200 text-[9.5px] text-sky-900 flex items-start gap-1.5">
                                        <Info size={13} className="text-sky-600 shrink-0 mt-0.5" />
                                        <span>
                                          <strong>Objetivo Multi-Indicador:</strong> Este objetivo medirá de forma articulada <strong>{selectedFormIndicatorIds.length} indicadores normativos</strong>. Recuerde que el registro numérico de variables se realiza en el <strong>Paso 20 (Medición de Indicadores)</strong>.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2 bg-emerald-100/50 rounded-lg text-[9.5px] text-emerald-800 italic text-center">
                                    Utilice la lista desplegable para seleccionar uno, dos o más indicadores que respaldan este objetivo según su definición.
                                  </div>
                                )}

                                {/* Opción rápida: Catálogo Desplegable Completo de los 13 Indicadores */}
                                <div className="pt-1 border-t border-emerald-200/50">
                                  <button
                                    type="button"
                                    onClick={() => setShowIndicatorChecklist(!showIndicatorChecklist)}
                                    className="text-[9.5px] font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckSquare size={12} className="text-emerald-700" />
                                    <span>{showIndicatorChecklist ? 'Ocultar catálogo rápido de selección múltiple' : 'Abrir catálogo rápido de selección múltiple (13 indicadores)'}</span>
                                  </button>

                                  {showIndicatorChecklist && (
                                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-300 shadow-sm max-h-52 overflow-y-auto space-y-1.5">
                                      <div className="text-[10px] font-extrabold text-gray-700 mb-1 flex justify-between">
                                        <span>Marque o desmarque los indicadores que este objetivo medirá:</span>
                                        <span className="text-emerald-800">{selectedFormIndicatorIds.length} vinculados</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {PESV_OFFICIAL_INDICATORS.map(ind => {
                                          const isChecked = selectedFormIndicatorIds.includes(ind.id);
                                          return (
                                            <label
                                              key={ind.id}
                                              className={`flex items-start gap-2 p-1.5 rounded border text-[10px] cursor-pointer transition-colors ${
                                                isChecked ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setSelectedFormIndicatorIds(prev => [...prev, ind.id]);
                                                    if (!newObjective.indicador.includes(ind.code)) {
                                                      setNewObjective(prev => ({
                                                        ...prev,
                                                        indicador: prev.indicador ? `${prev.indicador} | ${ind.code}: ${ind.formula}` : `${ind.code}: ${ind.formula}`
                                                      }));
                                                    }
                                                  } else {
                                                    setSelectedFormIndicatorIds(prev => prev.filter(id => id !== ind.id));
                                                  }
                                                }}
                                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                              />
                                              <div className="leading-tight flex-1">
                                                <span className="font-mono font-bold text-gray-900 block">
                                                  #{ind.id} {ind.code} ({ind.tipo})
                                                </span>
                                                <span className="text-[9px] text-gray-600 block line-clamp-1">{ind.nombre}</span>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Objetivo del PESV</label>
                                <textarea
                                  value={newObjective.objetivo}
                                  onChange={(e) => setNewObjective({ ...newObjective, objetivo: e.target.value })}
                                  rows={2}
                                  className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                  placeholder="ej. Disminuir la siniestralidad vial mediante control telemático de velocidad"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-600 font-bold mb-1">Descripción de la Meta (Texto)</label>
                                <textarea
                                  value={newObjective.meta}
                                  onChange={(e) => setNewObjective({ ...newObjective, meta: e.target.value })}
                                  rows={1}
                                  className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                  placeholder="ej. Reducir los siniestros viales en un 15% comparado con el año base"
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                  <label className="block text-gray-600 font-bold mb-1">Unidad de Medida</label>
                                  <select
                                    value={newObjective.unidadMedida}
                                    onChange={(e) => setNewObjective({ ...newObjective, unidadMedida: e.target.value })}
                                    className="w-full p-2 border border-gray-200 bg-white rounded text-[11px]"
                                  >
                                    <option value="%">Porcentaje (%)</option>
                                    <option value="Siniestros">Siniestros (Cantidad)</option>
                                    <option value="Tasa">Tasa de Siniestralidad</option>
                                    <option value="Km">Kilómetros (Km)</option>
                                    <option value="Horas">Horas de Formación</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-gray-600 font-bold mb-1">Valor Meta</label>
                                  <input
                                    type="number"
                                    value={newObjective.metaValor}
                                    onChange={(e) => setNewObjective({ ...newObjective, metaValor: parseFloat(e.target.value) || 0 })}
                                    className="w-full p-2 border border-gray-200 rounded text-[11px] text-center font-bold"
                                    placeholder="ej. 95"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Configuración de años durante creación/edición */}
                            <div className="space-y-3 bg-gray-50/50 p-3 rounded-lg border border-gray-150 flex flex-col justify-between">
                              <div>
                                <label className="block text-gray-700 font-black mb-1.5 text-center">
                                  Pre-Cargar Valores Históricos de Seguimiento
                                </label>
                                
                                <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                                  {tempYearValues.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white px-2 py-1 rounded text-[10px] border border-gray-200">
                                      <span className="font-bold text-gray-600">Año {item.year}:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-black text-gray-900">{item.value}{newObjective.unidadMedida}</span>
                                        <button
                                          type="button"
                                          onClick={() => setTempYearValues(tempYearValues.filter((_, idx) => idx !== index))}
                                          className="text-red-500 hover:text-red-700 font-bold px-1"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Form to add to temp array */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const y = prompt('Ingrese el año:', String(new Date().getFullYear()));
                                    const v = prompt('Ingrese el valor alcanzado:', '0');
                                    if (y && v) {
                                      const yn = parseInt(y);
                                      const vn = parseFloat(v);
                                      if (!isNaN(yn) && !isNaN(vn)) {
                                        setTempYearValues([...tempYearValues.filter(item => item.year !== yn), { year: yn, value: vn }]);
                                      }
                                    }
                                  }}
                                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 rounded text-[10px] cursor-pointer"
                                >
                                  + Agregar Año
                                </button>
                                
                                <div className="text-[10px] text-gray-400 flex items-center justify-center leading-tight">
                                  Define un valor por año para graficar la evolución.
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Inputs de indicador */}
                          <div className="grid grid-cols-1 gap-2 text-[11px]">
                            <div>
                              <label className="block text-gray-600 font-bold mb-1">Fórmula(s) del Indicador / Definición</label>
                              <input
                                type="text"
                                value={newObjective.indicador}
                                onChange={(e) => setNewObjective({ ...newObjective, indicador: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded text-[11px] font-mono"
                                placeholder="ej. (Siniestros año actual / Siniestros año anterior) * 100"
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (!newObjective.objetivo || !newObjective.meta || !newObjective.indicador) {
                                  alert('Por favor complete todos los campos básicos del objetivo.');
                                  return;
                                }

                                const linkedIds = selectedFormIndicatorIds;
                                const linkedCodes = linkedIds
                                  .map(id => PESV_OFFICIAL_INDICATORS.find(i => i.id === id)?.code || '')
                                  .filter(Boolean);

                                if (editingObjectiveId !== null) {
                                  // Update
                                  setObjectivesList(objectivesList.map(o => o.id === editingObjectiveId ? {
                                    ...o,
                                    ...newObjective,
                                    indicadoresOficialesIds: linkedIds,
                                    indicadoresOficialesCodigos: linkedCodes,
                                    indicadorOficialId: linkedIds[0] || undefined,
                                    indicadorOficialCodigo: linkedCodes[0] || undefined,
                                    valoresAnuales: tempYearValues
                                  } : o));
                                  setEditingObjectiveId(null);
                                } else {
                                  // Create
                                  const generatedId = Date.now();
                                  setObjectivesList([...objectivesList, {
                                    id: generatedId,
                                    ...newObjective,
                                    indicadoresOficialesIds: linkedIds,
                                    indicadoresOficialesCodigos: linkedCodes,
                                    indicadorOficialId: linkedIds[0] || undefined,
                                    indicadorOficialCodigo: linkedCodes[0] || undefined,
                                    valoresAnuales: tempYearValues
                                  }]);
                                  setSelectedObjectiveForChart(generatedId);
                                }

                                // Reset
                                setNewObjective({
                                  objetivo: '',
                                  meta: '',
                                  indicador: '',
                                  unidadMedida: '%',
                                  metaValor: 90,
                                  indicadoresOficialesIds: []
                                });
                                setSelectedFormIndicatorIds([]);
                                setShowIndicatorChecklist(false);
                                setTempYearValues([
                                  { year: 2024, value: 70 },
                                  { year: 2025, value: 80 },
                                  { year: 2026, value: 90 }
                                ]);
                              }}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-6 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs shadow-md transition-all"
                            >
                              <Plus size={14} />
                              {editingObjectiveId ? 'Actualizar Objetivo del PESV' : 'Agregar Objetivo al PESV'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* DEMO PASO 8: Programas de gestión de riesgos críticos y factores de desempeño */}
                  {activeStep.id === 8 && (() => {
                    const selectedProgram = riskPrograms.find(p => p.id === selectedProgramId) || riskPrograms[0] || null;
                    const totalAct = selectedProgram?.actividades.length || 0;
                    const doneAct = selectedProgram?.actividades.filter(a => a.estado === 'Realizado').length || 0;
                    const progressPercent = totalAct > 0 ? Math.round((doneAct / totalAct) * 100) : 0;

                    const presupuestoAsignado = selectedProgram?.presupuestoAsignado || 0;
                    const presupuestoEjecutado = selectedProgram?.presupuestoEjecutado || 0;
                    const ejecucionPresupuestalPct = presupuestoAsignado > 0
                      ? Math.min(100, Math.round((presupuestoEjecutado / presupuestoAsignado) * 100))
                      : 0;

                    const linkedPaso7Objective = selectedProgram?.objetivoPaso7Id
                      ? objectivesList.find(o => o.id === selectedProgram.objetivoPaso7Id)
                      : undefined;

                    const linkedPaso20Indicators = (selectedProgram?.indicadoresPaso20Ids || [])
                      .map(indId => PESV_OFFICIAL_INDICATORS.find(i => i.id === indId))
                      .filter(Boolean);

                    const updateSelectedProgram = (patch: Partial<PESVRiskProgram>) => {
                      if (!selectedProgram) return;
                      setRiskPrograms(prev =>
                        prev.map(p => (p.id === selectedProgram.id ? { ...p, ...patch } : p))
                      );
                    };

                    // Structured lists with automatic hydration from base fields so user can edit/delete/add freely
                    const lineamientosItems: string[] = selectedProgram?.lineamientosLista && selectedProgram.lineamientosLista.length > 0
                      ? selectedProgram.lineamientosLista
                      : (selectedProgram?.lineamientoBase ? [selectedProgram.lineamientoBase] : []);

                    const objetivosItems = selectedProgram?.objetivosLista && selectedProgram.objetivosLista.length > 0
                      ? selectedProgram.objetivosLista
                      : (selectedProgram?.objetivoEspecifico ? [{
                          id: `obj-init-${selectedProgram.id}`,
                          objetivo: selectedProgram.objetivoEspecifico,
                          meta: selectedProgram.metaMedible || '',
                          metaValor: selectedProgram.metaValor || '',
                          objetivoPaso7Id: selectedProgram.objetivoPaso7Id
                        }] : []);

                    const rubrosItems = selectedProgram?.rubrosPresupuesto && selectedProgram.rubrosPresupuesto.length > 0
                      ? selectedProgram.rubrosPresupuesto
                      : (selectedProgram?.detallePresupuesto ? [{
                          id: `rub-init-${selectedProgram.id}`,
                          rubro: 'Presupuesto general del programa',
                          recursos: selectedProgram.detallePresupuesto,
                          asignado: selectedProgram.presupuestoAsignado || 0,
                          ejecutado: selectedProgram.presupuestoEjecutado || 0
                        }] : []);

                    const mecanismosItems = selectedProgram?.mecanismosLista && selectedProgram.mecanismosLista.length > 0
                      ? selectedProgram.mecanismosLista
                      : (selectedProgram?.mecanismosSeguimiento ? [{
                          id: `mec-init-${selectedProgram.id}`,
                          estrategia: selectedProgram.mecanismosSeguimiento,
                          frecuencia: selectedProgram.frecuenciaSeguimiento || 'Mensual',
                          responsable: selectedProgram.responsableSeguimiento || 'Líder del PESV',
                          evidencia: 'Actas de seguimiento, reportes operativos y registros de control'
                        }] : []);

                    const handleExportProgramPDF = () => {
                      if (!selectedProgram) return;
                      const doc = new jsPDF('p', 'mm', 'a4');
                      const pageWidth = doc.internal.pageSize.getWidth();
                      let y = 14;

                      // Header Box
                      doc.setDrawColor(203, 213, 225);
                      doc.setFillColor(248, 250, 252);
                      doc.roundedRect(12, y, pageWidth - 24, 24, 2, 2, 'FD');

                      if (isImageLogo && companyLogo) {
                        try {
                          const format = companyLogo.includes('image/png') ? 'PNG' : 'JPEG';
                          doc.addImage(companyLogo, format, 15, y + 3, 18, 18);
                        } catch (e) {}
                      }

                      const textStartX = isImageLogo ? 37 : 16;
                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(10);
                      doc.setTextColor(15, 23, 42);
                      doc.text(companyName.toUpperCase(), textStartX, y + 8);

                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(8);
                      doc.setTextColor(71, 85, 105);
                      doc.text(`NIT: ${companyNit}  |  PASO 8 PESV - RESOLUCIÓN 40595 DE 2022`, textStartX, y + 13);

                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(9);
                      doc.setTextColor(3, 105, 161);
                      doc.text(selectedProgram.nombre.toUpperCase(), textStartX, y + 19);

                      y += 30;

                      const addSectionBlock = (numTitle: string, bodyLines: string[]) => {
                        if (y > 255) {
                          doc.addPage();
                          y = 16;
                        }
                        doc.setFillColor(240, 249, 255);
                        doc.setDrawColor(186, 230, 253);
                        doc.roundedRect(12, y, pageWidth - 24, 7, 1, 1, 'FD');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(12, 74, 110);
                        doc.text(numTitle, 15, y + 4.8);
                        y += 10;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(30, 41, 59);
                        bodyLines.forEach(line => {
                          const wrapped = doc.splitTextToSize(line, pageWidth - 28);
                          if (y + wrapped.length * 4 > 278) {
                            doc.addPage();
                            y = 16;
                          }
                          doc.text(wrapped, 14, y);
                          y += wrapped.length * 4 + 1.5;
                        });
                        y += 2;
                      };

                      addSectionBlock('1. LINEAMIENTO BASE O POLÍTICA DEL PESV (PASO 3)', [
                        ...lineamientosItems.map((l, i) => `• Lineamiento ${i + 1}: ${l}`),
                        `Objetivo General del Programa: ${selectedProgram.objetivoGeneral}`
                      ]);

                      addSectionBlock('2. ALCANCE DEL PROGRAMA (ACTORES VIALES, VEHÍCULOS Y PROCESOS)', [
                        `• Actores Viales Aplicables: ${selectedProgram.alcanceActores}`,
                        `• Vehículos Cubiertos: ${selectedProgram.alcanceVehiculos}`,
                        `• Procesos de la Organización: ${selectedProgram.alcanceProcesos}`,
                        `• Descripción de Cobertura Operativa: ${selectedProgram.alcanceDescripcion}`
                      ]);

                      addSectionBlock('3. OBJETIVOS Y METAS ESPECÍFICAS (ALINEADO CON EL PASO 7)', [
                        ...objetivosItems.map((o, i) => `• Objetivo ${i + 1}: ${o.objetivo} | Meta: ${o.meta} (${o.metaValor})`),
                        `• Objetivo Estratégico Paso 7 Vinculado: ${linkedPaso7Objective ? `${linkedPaso7Objective.objetivo} [Meta: ${linkedPaso7Objective.metaValor}${linkedPaso7Objective.unidadMedida}]` : 'Alineación directa con reducción de siniestralidad Paso 7'}`
                      ]);

                      addSectionBlock('4. INDICADORES Y FORMA DE MEDICIÓN (ALINEADO CON EL PASO 20)', [
                        `• Indicadores del Programa: ${selectedProgram.indicadoresMedicion}`,
                        `• Fórmula(s) de Medición: ${selectedProgram.formulaMedicion}`,
                        `• Frecuencia de Medición: ${selectedProgram.frecuenciaMedicion}  |  Fuente de Datos: ${selectedProgram.fuenteDatos}`,
                        `• Indicadores Oficiales Paso 20 Asociados: ${linkedPaso20Indicators.map(i => `${i?.code} (${i?.nombre})`).join(', ') || selectedProgram.indicadorGeneral}`
                      ]);

                      addSectionBlock('5. FACTORES DE DESEMPEÑO RELACIONADOS', [
                        `• Factores Evaluados: ${(selectedProgram.factoresDesempeno || []).join('  |  ')}`,
                        `• Criterio Operativo de Evaluación: ${selectedProgram.descripcionFactoresDesempeno}`
                      ]);

                      addSectionBlock('6. PRESUPUESTO Y RECURSOS FINANCIEROS ASIGNADOS', [
                        `• Presupuesto Total Asignado: $ ${presupuestoAsignado.toLocaleString('es-CO')} COP  |  Presupuesto Ejecutado: $ ${presupuestoEjecutado.toLocaleString('es-CO')} COP (${ejecucionPresupuestalPct}% ejecución)`,
                        ...rubrosItems.map((r, i) => `  ${i + 1}. ${r.rubro} (${r.recursos}) — Asignado: $${r.asignado.toLocaleString('es-CO')} | Ejecutado: $${r.ejecutado.toLocaleString('es-CO')}`)
                      ]);

                      addSectionBlock('7. MECANISMOS DE SEGUIMIENTO Y EVALUACIÓN DE EFECTIVIDAD',
                        mecanismosItems.map((m, i) =>
                          `• Mecanismo ${i + 1}: ${m.estrategia} | Periodicidad: ${m.frecuencia} | Responsable: ${m.responsable} | Evidencia: ${m.evidencia}`
                        )
                      );

                      addSectionBlock(`8. CRONOGRAMA DE ACTIVIDADES DEL PROGRAMA (${doneAct}/${totalAct} REALIZADAS - ${progressPercent}%)`,
                        selectedProgram.actividades.map((a, idx) =>
                          `${idx + 1}. [${a.estado.toUpperCase()}] ${a.actividad} — Resp: ${a.responsable} — Fecha: ${a.fechaRealizacion} — Verificación: ${a.verificacion}`
                        )
                      );

                      doc.save(`Ficha_Paso8_${selectedProgram.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
                    };

                    return (
                      <div className="space-y-6" id="demo-paso-8-programas">
                        {/* Intro normativo con acciones de creación de programa y exportación */}
                        <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-sky-950">
                          <div className="flex gap-3">
                            <Truck size={24} className="text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-extrabold text-sky-950 text-sm">
                                  Paso 8: Programas de Gestión de Riesgos Críticos y Factores de Desempeño
                                </h4>
                                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-black uppercase">
                                  100% Editable • Resolución 40595 de 2022
                                </span>
                              </div>
                              <p className="mt-1 text-gray-600 leading-relaxed">
                                Todos los elementos normativos de cada programa son <strong>directamente editables, redactables y personalizables</strong>: puede redactar, agregar o eliminar lineamientos de política (Paso 3), modificar el alcance, definir objetivos y metas (Paso 7), configurar indicadores (Paso 20), factores de desempeño, rubros de presupuesto, mecanismos de seguimiento y cronograma.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newId = Date.now();
                                const nextNum = riskPrograms.length + 1;
                                const nuevoProg: PESVRiskProgram = {
                                  id: newId,
                                  nombre: `${nextNum}. Nuevo Programa de Gestión de Riesgo Vial`,
                                  objetivoGeneral: 'Definir el objetivo general del programa orientado a la prevención y control del riesgo crítico.',
                                  indicadorGeneral: '(Actividades ejecutadas / Actividades programadas) * 100',
                                  lineamientoBase: policyCustomText || 'Política de Seguridad Vial de la Organización (Paso 3): Compromiso con la prevención de siniestros viales.',
                                  lineamientosLista: [
                                    policyCustomText || 'Política de Seguridad Vial de la Organización (Paso 3): Compromiso con la prevención de siniestros viales.'
                                  ],
                                  alcanceActores: 'Conductores, motociclistas, ciclistas y peatones de la organización.',
                                  alcanceVehiculos: 'Flota propia, contratista y vehículos de terceros al servicio de la empresa.',
                                  alcanceProcesos: 'Operaciones de transporte, logística y desplazamientos misionales.',
                                  alcanceDescripcion: 'Aplica a todas las sedes y rutas operativas de la organización.',
                                  objetivoEspecifico: 'Reducir la siniestralidad asociada al factor de riesgo crítico intervenido.',
                                  metaMedible: 'Cumplir al menos el 95% de las actividades y controles operativos del programa.',
                                  metaValor: '>= 95% Cumplimiento',
                                  objetivoPaso7Id: objectivesList[0]?.id,
                                  objetivosLista: [
                                    {
                                      id: `obj-${newId}-1`,
                                      objetivo: 'Reducir la siniestralidad asociada al factor de riesgo crítico intervenido.',
                                      meta: 'Cumplir al menos el 95% de las actividades y controles operativos del programa.',
                                      metaValor: '>= 95%',
                                      objetivoPaso7Id: objectivesList[0]?.id
                                    }
                                  ],
                                  indicadoresMedicion: 'CPlan PESV (Cumplimiento de actividades) y TSV(n) (Tasa de Siniestros Viales).',
                                  formulaMedicion: 'CPlan = (AEPlan(t) / APPlan(t)) * 100',
                                  frecuenciaMedicion: 'Mensual y Trimestral',
                                  fuenteDatos: 'Registros de control operativo, inspecciones y reportes del Comité PESV.',
                                  indicadoresPaso20Ids: [5, 1],
                                  factoresDesempeno: [
                                    'Comportamiento y competencias del conductor',
                                    'Inspección y mantenimiento preventivo vehicular'
                                  ],
                                  descripcionFactoresDesempeno: 'Evaluación periódica de los controles operativos y hábitos seguros en vía.',
                                  presupuestoAsignado: 5000000,
                                  presupuestoEjecutado: 0,
                                  detallePresupuesto: 'Recursos técnicos, pedagógicos y operativos asignados al programa.',
                                  rubrosPresupuesto: [
                                    {
                                      id: `rub-${newId}-1`,
                                      rubro: 'Capacitación y controles operativos del programa',
                                      recursos: 'Material pedagógico, equipos de medición y horas de formación',
                                      asignado: 5000000,
                                      ejecutado: 0
                                    }
                                  ],
                                  mecanismosSeguimiento: 'Auditoría periódica de controles en ruta y revisión trimestral por el Comité de Seguridad Vial.',
                                  frecuenciaSeguimiento: 'Mensual / Trimestral',
                                  responsableSeguimiento: 'Líder del PESV',
                                  mecanismosLista: [
                                    {
                                      id: `mec-${newId}-1`,
                                      estrategia: 'Revisión periódica de indicadores y controles operativos en el Comité de Seguridad Vial',
                                      frecuencia: 'Mensual',
                                      responsable: 'Líder del PESV',
                                      evidencia: 'Acta de reunión del Comité PESV e informe de indicadores'
                                    }
                                  ],
                                  actividades: []
                                };
                                setRiskPrograms([...riskPrograms, nuevoProg]);
                                setSelectedProgramId(newId);
                              }}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Nuevo Programa</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleExportProgramPDF}
                              className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                              title="Descargar Ficha Técnica Normativa del Programa en PDF con logo de la empresa"
                            >
                              <Download size={14} />
                              <span>Descargar Ficha PDF</span>
                            </button>
                          </div>
                        </div>

                        {/* Selector de Programas Críticos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 border-b border-gray-200 pb-3">
                          {riskPrograms.map((p) => {
                            const isSelected = p.id === selectedProgramId;
                            const total = p.actividades.length;
                            const done = p.actividades.filter(a => a.estado === 'Realizado').length;
                            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                            const pAsig = p.presupuestoAsignado || 0;

                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedProgramId(p.id);
                                  setEditingActivityId(null);
                                  setNewActivity({
                                    actividad: '',
                                    objetivo: '',
                                    responsable: '',
                                    fechaRealizacion: '',
                                    verificacion: '',
                                    indicadores: '',
                                    estado: 'Programado'
                                  });
                                }}
                                className={`p-3 rounded-xl text-left transition-all border text-[11px] font-bold cursor-pointer flex flex-col justify-between relative group ${
                                  isSelected
                                    ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-700/20'
                                    : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-200 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-2">
                                  <div className="line-clamp-2 leading-snug">{p.nombre}</div>
                                  {riskPrograms.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const remaining = riskPrograms.filter(item => item.id !== p.id);
                                        setRiskPrograms(remaining);
                                        if (selectedProgramId === p.id && remaining.length > 0) {
                                          setSelectedProgramId(remaining[0].id);
                                        }
                                      }}
                                      className={`p-1 rounded opacity-70 hover:opacity-100 cursor-pointer shrink-0 ${
                                        isSelected ? 'hover:bg-sky-800 text-sky-100' : 'hover:bg-red-50 text-red-500'
                                      }`}
                                      title="Eliminar este programa"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-1 pt-1.5 border-t border-current/10 w-full">
                                  <div className="flex justify-between items-center text-[10px] opacity-90 font-semibold">
                                    <span>Avance: {percent}%</span>
                                    <span>({done}/{total} act.)</span>
                                  </div>
                                  <div className={`text-[9.5px] font-mono ${isSelected ? 'text-sky-100' : 'text-emerald-700'}`}>
                                    Presupuesto: ${(pAsig / 1000000).toFixed(1)}M COP
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {selectedProgram && (
                          <div className="space-y-6">
                            {/* Cabecera Editable del Programa Seleccionado */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                              <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                                    Identificación y Propósito General del Programa (Editable)
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-bold">
                                    ✓ Guardado automático al redactar
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                                      Nombre del Programa de Gestión de Riesgo Crítico:
                                    </label>
                                    <input
                                      type="text"
                                      value={selectedProgram.nombre}
                                      onChange={(e) => updateSelectedProgram({ nombre: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-gray-300 focus:border-sky-600 rounded-lg font-extrabold text-sm text-gray-950 bg-gray-50/40 focus:bg-white transition-colors"
                                      placeholder="Nombre del programa..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                                      Responsable del Programa:
                                    </label>
                                    <input
                                      type="text"
                                      value={selectedProgram.responsableSeguimiento}
                                      onChange={(e) => updateSelectedProgram({ responsableSeguimiento: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-gray-300 focus:border-sky-600 rounded-lg font-bold text-xs text-gray-800 bg-gray-50/40 focus:bg-white transition-colors"
                                      placeholder="Cargo o responsable..."
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                                    Objetivo General del Programa (Redacción Libre):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={selectedProgram.objetivoGeneral}
                                    onChange={(e) => updateSelectedProgram({ objetivoGeneral: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 focus:border-sky-600 rounded-lg text-xs text-gray-700 leading-relaxed bg-gray-50/40 focus:bg-white transition-colors"
                                    placeholder="Redacte el objetivo general del programa..."
                                  />
                                </div>
                              </div>

                              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                                {/* Card Avance Actividades */}
                                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] text-emerald-800 font-extrabold uppercase tracking-wider block">
                                      Avance Cronograma
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                      <span className="text-2xl font-black text-emerald-950">{progressPercent}%</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-700 font-semibold block">
                                      {doneAct} de {totalAct} actividades
                                    </span>
                                  </div>
                                  <div className="w-full bg-emerald-200 rounded-full h-2 mt-3">
                                    <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                </div>

                                {/* Card Ejecución Presupuestal */}
                                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-2xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] text-indigo-800 font-extrabold uppercase tracking-wider block">
                                      Ejecución Presupuesto
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                      <span className="text-2xl font-black text-indigo-950">{ejecucionPresupuestalPct}%</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-700 font-mono font-bold block">
                                      ${(presupuestoEjecutado / 1000000).toFixed(1)}M / ${(presupuestoAsignado / 1000000).toFixed(1)}M
                                    </span>
                                  </div>
                                  <div className="w-full bg-indigo-200 rounded-full h-2 mt-3">
                                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${ejecucionPresupuestalPct}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ESTRUCTURA NORMATIVA INTERACTIVA DE LOS 7 ELEMENTOS DEL PROGRAMA */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                              {/* ELEMENTO 1: Lineamiento Base o Política (Vinculado al Paso 3: Política de Seguridad Vial) */}
                              <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between space-y-3">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">1</span>
                                      Lineamiento Base o Política
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const step3Policy = PESV_STEPS.find(s => s.id === 3);
                                        if (step3Policy) setActiveStep(step3Policy);
                                      }}
                                      className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 cursor-pointer flex items-center gap-1 transition-colors"
                                      title="Ir al Paso 3: Política de Seguridad Vial de la Organización"
                                    >
                                      <span>Ver Política PESV (Paso 3) →</span>
                                    </button>
                                  </div>

                                  <p className="text-[10.5px] text-gray-500">
                                    Redacte, edite o elimine los lineamientos o compromisos de la Política de Seguridad Vial (Paso 3) de los cuales se deriva este programa:
                                  </p>

                                  {/* Lista editable de lineamientos */}
                                  <div className="space-y-2">
                                    {lineamientosItems.map((lin, idx) => (
                                      <div key={idx} className="flex items-start gap-2 bg-sky-50/40 p-2 rounded-lg border border-sky-100">
                                        <textarea
                                          rows={2}
                                          value={lin}
                                          onChange={(e) => {
                                            const next = [...lineamientosItems];
                                            next[idx] = e.target.value;
                                            updateSelectedProgram({
                                              lineamientosLista: next,
                                              lineamientoBase: next.join(' | ')
                                            });
                                          }}
                                          className="flex-1 p-1.5 bg-white border border-gray-200 focus:border-sky-500 rounded text-[11px] text-gray-800 leading-snug"
                                          placeholder="Redacte el lineamiento o política base..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = lineamientosItems.filter((_, i) => i !== idx);
                                            updateSelectedProgram({
                                              lineamientosLista: next,
                                              lineamientoBase: next.join(' | ')
                                            });
                                          }}
                                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer shrink-0"
                                          title="Eliminar este lineamiento"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Botones para agregar lineamiento en blanco o importar de los compromisos de la Política (Paso 3) */}
                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...lineamientosItems, 'Nuevo lineamiento de política de seguridad vial...'];
                                        updateSelectedProgram({
                                          lineamientosLista: next,
                                          lineamientoBase: next.join(' | ')
                                        });
                                      }}
                                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={12} /> Agregar Lineamiento
                                    </button>

                                    {selectedCommitments.length > 0 && (
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (!e.target.value) return;
                                          const next = [...lineamientosItems, `Compromiso Política PESV (Paso 3): ${e.target.value}`];
                                          updateSelectedProgram({
                                            lineamientosLista: next,
                                            lineamientoBase: next.join(' | ')
                                          });
                                        }}
                                        className="flex-1 min-w-[180px] p-1.5 border border-emerald-300 bg-emerald-50/50 rounded-lg text-[10px] font-bold text-emerald-900 cursor-pointer"
                                      >
                                        <option value="">+ Importar compromiso de la Política (Paso 3)...</option>
                                        {selectedCommitments.map((comm, i) => (
                                          <option key={i} value={comm}>{comm}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ELEMENTO 2: Alcance (Actores Viales, Vehículos y Procesos) - 100% Editable Directamente */}
                              <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">2</span>
                                    Alcance del Programa (Actores Viales, Vehículos y Procesos)
                                  </span>
                                  <span className="text-[9.5px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    Edición Directa Habilitada
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                                  {/* Actores Viales */}
                                  <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200 space-y-1.5 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-1.5 font-extrabold text-gray-900 text-[10.5px]">
                                          <Users size={13} className="text-sky-600 shrink-0" />
                                          <span>Actores Viales</span>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => updateSelectedProgram({ alcanceActores: '' })}
                                          className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                          title="Limpiar campo"
                                        >
                                          Limpiar
                                        </button>
                                      </div>
                                      <textarea
                                        rows={3}
                                        value={selectedProgram.alcanceActores}
                                        onChange={(e) => updateSelectedProgram({ alcanceActores: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-200 focus:border-sky-600 rounded text-[10.5px] text-gray-800 leading-snug"
                                        placeholder="Redacte a qué actores viales aplica (conductores, motociclistas, ciclistas, peatones)..."
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {['Conductores', 'Motociclistas', 'Ciclistas', 'Peatones'].map(actor => (
                                        <button
                                          key={actor}
                                          type="button"
                                          onClick={() => {
                                            const curr = selectedProgram.alcanceActores || '';
                                            if (!curr.toLowerCase().includes(actor.toLowerCase())) {
                                              updateSelectedProgram({
                                                alcanceActores: curr ? `${curr}, ${actor}` : actor
                                              });
                                            }
                                          }}
                                          className="px-1.5 py-0.5 bg-white hover:bg-sky-50 text-sky-800 border border-gray-200 rounded text-[9px] font-bold cursor-pointer"
                                        >
                                          + {actor}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Vehículos Aplicables */}
                                  <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200 space-y-1.5 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-1.5 font-extrabold text-gray-900 text-[10.5px]">
                                          <Truck size={13} className="text-emerald-600 shrink-0" />
                                          <span>Vehículos Aplicables</span>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => updateSelectedProgram({ alcanceVehiculos: '' })}
                                          className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                          title="Limpiar campo"
                                        >
                                          Limpiar
                                        </button>
                                      </div>
                                      <textarea
                                        rows={3}
                                        value={selectedProgram.alcanceVehiculos}
                                        onChange={(e) => updateSelectedProgram({ alcanceVehiculos: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-200 focus:border-emerald-600 rounded text-[10.5px] text-gray-800 leading-snug"
                                        placeholder="Redacte a qué vehículos aplica (flota propia, contratistas, terceros, motos, camiones)..."
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {['Flota Propia', 'Contratistas', 'Terceros', 'Motos', 'Pesados'].map(veh => (
                                        <button
                                          key={veh}
                                          type="button"
                                          onClick={() => {
                                            const curr = selectedProgram.alcanceVehiculos || '';
                                            if (!curr.toLowerCase().includes(veh.toLowerCase())) {
                                              updateSelectedProgram({
                                                alcanceVehiculos: curr ? `${curr}, ${veh}` : veh
                                              });
                                            }
                                          }}
                                          className="px-1.5 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-gray-200 rounded text-[9px] font-bold cursor-pointer"
                                        >
                                          + {veh}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Procesos Organizacionales */}
                                  <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200 space-y-1.5 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-1.5 font-extrabold text-gray-900 text-[10.5px]">
                                          <Layers size={13} className="text-indigo-600 shrink-0" />
                                          <span>Procesos Organizacionales</span>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => updateSelectedProgram({ alcanceProcesos: '' })}
                                          className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                          title="Limpiar campo"
                                        >
                                          Limpiar
                                        </button>
                                      </div>
                                      <textarea
                                        rows={3}
                                        value={selectedProgram.alcanceProcesos}
                                        onChange={(e) => updateSelectedProgram({ alcanceProcesos: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-200 focus:border-indigo-600 rounded text-[10.5px] text-gray-800 leading-snug"
                                        placeholder="Redacte los procesos de la organización cubiertos..."
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {['Operaciones', 'Logística', 'Mantenimiento', 'Comercial', 'SST'].map(proc => (
                                        <button
                                          key={proc}
                                          type="button"
                                          onClick={() => {
                                            const curr = selectedProgram.alcanceProcesos || '';
                                            if (!curr.toLowerCase().includes(proc.toLowerCase())) {
                                              updateSelectedProgram({
                                                alcanceProcesos: curr ? `${curr}, ${proc}` : proc
                                              });
                                            }
                                          }}
                                          className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-gray-200 rounded text-[9px] font-bold cursor-pointer"
                                        >
                                          + {proc}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1">
                                    Descripción General de Cobertura Operativa del Alcance:
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedProgram.alcanceDescripcion}
                                    onChange={(e) => updateSelectedProgram({ alcanceDescripcion: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-gray-50/60 focus:bg-white border border-gray-200 focus:border-sky-600 rounded-lg text-[11px] text-gray-800"
                                    placeholder="Describa las rutas, sedes o condiciones operativas donde aplica el programa..."
                                  />
                                </div>
                              </div>

                              {/* ELEMENTO 3: Objetivos y Metas del Programa (Definición, Edición y Eliminación + Vínculo Paso 7) */}
                              <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">3</span>
                                      Objetivos y Metas del Programa (Alineado con Paso 7)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newObjItem = {
                                          id: `obj-${selectedProgram.id}-${Date.now()}`,
                                          objetivo: 'Nuevo objetivo específico del programa...',
                                          meta: 'Meta medible asociada al objetivo...',
                                          metaValor: '100%',
                                          objetivoPaso7Id: selectedProgram.objetivoPaso7Id
                                        };
                                        const nextList = [...objetivosItems, newObjItem];
                                        updateSelectedProgram({
                                          objetivosLista: nextList,
                                          objetivoEspecifico: nextList[0]?.objetivo || '',
                                          metaMedible: nextList[0]?.meta || '',
                                          metaValor: nextList[0]?.metaValor || ''
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={12} /> Agregar Objetivo
                                    </button>
                                  </div>

                                  {/* Lista de Objetivos y Metas del Programa (Cada uno editable y eliminable) */}
                                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                                    {objetivosItems.length === 0 ? (
                                      <div className="p-4 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
                                        No hay objetivos específicos definidos. Haga clic en "+ Agregar Objetivo" para redactar uno.
                                      </div>
                                    ) : (
                                      objetivosItems.map((objItem, idx) => (
                                        <div key={objItem.id} className="p-3 rounded-lg bg-gray-50/70 border border-gray-200 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-sky-800">
                                              Objetivo Específico #{idx + 1} del Programa
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const nextList = objetivosItems.filter(o => o.id !== objItem.id);
                                                updateSelectedProgram({
                                                  objetivosLista: nextList,
                                                  objetivoEspecifico: nextList[0]?.objetivo || '',
                                                  metaMedible: nextList[0]?.meta || '',
                                                  metaValor: nextList[0]?.metaValor || ''
                                                });
                                              }}
                                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                              title="Eliminar este objetivo del programa"
                                            >
                                              <Trash2 size={12} /> Eliminar
                                            </button>
                                          </div>

                                          <div>
                                            <label className="block text-[9.5px] font-bold text-gray-500 uppercase mb-0.5">
                                              Redacción del Objetivo Específico:
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={objItem.objetivo}
                                              onChange={(e) => {
                                                const nextList = objetivosItems.map(o =>
                                                  o.id === objItem.id ? { ...o, objetivo: e.target.value } : o
                                                );
                                                updateSelectedProgram({
                                                  objetivosLista: nextList,
                                                  objetivoEspecifico: nextList[0]?.objetivo || ''
                                                });
                                              }}
                                              className="w-full p-1.5 bg-white border border-gray-200 focus:border-sky-600 rounded text-[11px] text-gray-900 font-semibold leading-snug"
                                              placeholder="Redacte el objetivo específico del programa..."
                                            />
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div className="sm:col-span-2">
                                              <label className="block text-[9.5px] font-bold text-gray-500 uppercase mb-0.5">
                                                Meta Medible del Objetivo:
                                              </label>
                                              <input
                                                type="text"
                                                value={objItem.meta}
                                                onChange={(e) => {
                                                  const nextList = objetivosItems.map(o =>
                                                    o.id === objItem.id ? { ...o, meta: e.target.value } : o
                                                  );
                                                  updateSelectedProgram({
                                                    objetivosLista: nextList,
                                                    metaMedible: nextList[0]?.meta || ''
                                                  });
                                                }}
                                                className="w-full p-1.5 bg-white border border-gray-200 focus:border-sky-600 rounded text-[10.5px] text-gray-700"
                                                placeholder="Describa la meta cuantitativa..."
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[9.5px] font-bold text-gray-500 uppercase mb-0.5">
                                                Valor Meta:
                                              </label>
                                              <input
                                                type="text"
                                                value={objItem.metaValor}
                                                onChange={(e) => {
                                                  const nextList = objetivosItems.map(o =>
                                                    o.id === objItem.id ? { ...o, metaValor: e.target.value } : o
                                                  );
                                                  updateSelectedProgram({
                                                    objetivosLista: nextList,
                                                    metaValor: nextList[0]?.metaValor || ''
                                                  });
                                                }}
                                                className="w-full p-1.5 bg-white border border-gray-200 focus:border-sky-600 rounded text-[10.5px] font-mono font-bold text-emerald-800"
                                                placeholder="ej. <= 1.0%"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* Selector de Alineación con el Paso 7 */}
                                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-black text-emerald-900 uppercase flex items-center gap-1">
                                        <Target size={12} className="text-emerald-700" />
                                        Alineación con Objetivo Estratégico del Paso 7:
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const step7 = PESV_STEPS.find(s => s.id === 7);
                                          if (step7) setActiveStep(step7);
                                        }}
                                        className="font-bold text-emerald-800 hover:underline cursor-pointer"
                                      >
                                        Ir al Paso 7 →
                                      </button>
                                    </div>
                                    <select
                                      value={selectedProgram.objetivoPaso7Id || ''}
                                      onChange={(e) => updateSelectedProgram({ objetivoPaso7Id: Number(e.target.value) || undefined })}
                                      className="w-full p-1.5 bg-white border border-emerald-300 rounded text-[11px] font-bold text-emerald-950 cursor-pointer"
                                    >
                                      <option value="">-- Seleccionar Objetivo del Paso 7 con el que se alinea --</option>
                                      {objectivesList.map(obj => (
                                        <option key={obj.id} value={obj.id}>
                                          Objetivo #{obj.id}: {obj.objetivo} (Meta: {obj.metaValor}{obj.unidadMedida})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* ELEMENTO 4: Indicadores y Forma de Medición (Editable + Alineado con el Paso 20) */}
                              <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">4</span>
                                      Indicadores y Forma de Medición (Paso 20)
                                    </span>
                                    <span className="text-[9.5px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                      Editable
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-[11px]">
                                    <div>
                                      <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">
                                        Nombre / Descripción de Indicadores del Programa:
                                      </label>
                                      <input
                                        type="text"
                                        value={selectedProgram.indicadoresMedicion}
                                        onChange={(e) => updateSelectedProgram({ indicadoresMedicion: e.target.value })}
                                        className="w-full p-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-sky-600 rounded text-[11px] text-gray-800 font-semibold"
                                        placeholder="Describa los indicadores que miden el programa..."
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">
                                        Fórmula(s) Matemática(s) de Medición (Editable):
                                      </label>
                                      <input
                                        type="text"
                                        value={selectedProgram.formulaMedicion}
                                        onChange={(e) => updateSelectedProgram({ formulaMedicion: e.target.value, indicadorGeneral: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 text-sky-300 border border-slate-700 rounded-lg text-[11px] font-mono font-bold"
                                        placeholder="Ej. GVE = (#VIP / #VDL) * 100"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">
                                          Frecuencia de Medición:
                                        </label>
                                        <input
                                          type="text"
                                          value={selectedProgram.frecuenciaMedicion}
                                          onChange={(e) => updateSelectedProgram({ frecuenciaMedicion: e.target.value })}
                                          className="w-full p-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-sky-600 rounded text-[11px] text-gray-800"
                                          placeholder="Ej. Mensual y Acumulado Anual"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">
                                          Fuente de Datos / Verificación:
                                        </label>
                                        <input
                                          type="text"
                                          value={selectedProgram.fuenteDatos}
                                          onChange={(e) => updateSelectedProgram({ fuenteDatos: e.target.value })}
                                          className="w-full p-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-sky-600 rounded text-[11px] text-gray-800"
                                          placeholder="Ej. Plataforma GPS, bitácoras, SIMIT..."
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Vincular o desvincular Indicadores Oficiales del Paso 20 */}
                                  <div className="space-y-2 pt-1 border-t border-gray-100">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-extrabold uppercase text-gray-600">
                                        Indicadores del Paso 20 Vinculados ({linkedPaso20Indicators.length}):
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const idNum = Number(e.target.value);
                                          if (!idNum) return;
                                          const curr = selectedProgram.indicadoresPaso20Ids || [];
                                          if (!curr.includes(idNum)) {
                                            updateSelectedProgram({ indicadoresPaso20Ids: [...curr, idNum] });
                                          }
                                        }}
                                        className="p-1 border border-sky-300 bg-sky-50 rounded text-[10px] font-bold text-sky-900 cursor-pointer"
                                      >
                                        <option value="">+ Vincular Indicador del Paso 20...</option>
                                        {PESV_OFFICIAL_INDICATORS.map(ind => (
                                          <option
                                            key={ind.id}
                                            value={ind.id}
                                            disabled={(selectedProgram.indicadoresPaso20Ids || []).includes(ind.id)}
                                          >
                                            #{ind.id} {ind.code} - {ind.nombre}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {linkedPaso20Indicators.map((ind) => {
                                        if (!ind) return null;
                                        return (
                                          <div
                                            key={ind.id}
                                            className="p-2 rounded-lg border border-sky-200 bg-sky-50/50 flex items-center justify-between gap-1.5 text-[10px]"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div className="font-mono font-black text-sky-950 truncate">
                                                #{ind.id} {ind.code}
                                              </div>
                                              <div className="text-gray-600 truncate text-[9.5px]" title={ind.nombre}>
                                                {ind.nombre}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => navigateToIndicatorInStep20(ind.id)}
                                                className="px-2 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold text-[9px] cursor-pointer"
                                                title="Ir a medir este indicador en el Paso 20"
                                              >
                                                Medir →
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateSelectedProgram({
                                                    indicadoresPaso20Ids: (selectedProgram.indicadoresPaso20Ids || []).filter(id => id !== ind.id)
                                                  });
                                                }}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer font-bold"
                                                title="Desvincular este indicador"
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ELEMENTO 5: Factores de Desempeño Relacionados (Edición, Adición y Eliminación Directa) */}
                              <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">5</span>
                                      Factores de Desempeño
                                    </span>
                                    <Activity size={14} className="text-sky-600" />
                                  </div>

                                  {/* Lista editable y eliminable de factores */}
                                  <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                                    {(selectedProgram.factoresDesempeno || []).length === 0 ? (
                                      <div className="text-[10.5px] text-gray-400 italic p-2 text-center">
                                        Sin factores registrados. Agregue uno abajo.
                                      </div>
                                    ) : (
                                      (selectedProgram.factoresDesempeno || []).map((factor, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                          <input
                                            type="text"
                                            value={factor}
                                            onChange={(e) => {
                                              const next = [...selectedProgram.factoresDesempeno];
                                              next[idx] = e.target.value;
                                              updateSelectedProgram({ factoresDesempeno: next });
                                            }}
                                            className="flex-1 bg-white px-2 py-1 border border-gray-200 focus:border-sky-600 rounded text-[10.5px] font-semibold text-slate-800"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateSelectedProgram({
                                                factoresDesempeno: selectedProgram.factoresDesempeno.filter((_, i) => i !== idx)
                                              })
                                            }
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer shrink-0"
                                            title="Eliminar este factor de desempeño"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* Input para agregar nuevo factor de desempeño */}
                                  <div className="flex gap-1.5 pt-1">
                                    <input
                                      type="text"
                                      value={newFactorInput}
                                      onChange={(e) => setNewFactorInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newFactorInput.trim()) {
                                          e.preventDefault();
                                          updateSelectedProgram({
                                            factoresDesempeno: [...(selectedProgram.factoresDesempeno || []), newFactorInput.trim()]
                                          });
                                          setNewFactorInput('');
                                        }
                                      }}
                                      placeholder="Nuevo factor (ej. Gestión de velocidad)..."
                                      className="flex-1 p-1.5 border border-gray-200 rounded-lg text-[10.5px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newFactorInput.trim()) return;
                                        updateSelectedProgram({
                                          factoresDesempeno: [...(selectedProgram.factoresDesempeno || []), newFactorInput.trim()]
                                        });
                                        setNewFactorInput('');
                                      }}
                                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-extrabold text-[10px] cursor-pointer shrink-0"
                                    >
                                      + Agregar
                                    </button>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                  <label className="block text-[9.5px] font-extrabold text-gray-500 uppercase mb-1">
                                    Criterio de Evaluación Operativa de Factores:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={selectedProgram.descripcionFactoresDesempeno}
                                    onChange={(e) => updateSelectedProgram({ descripcionFactoresDesempeno: e.target.value })}
                                    className="w-full p-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-sky-600 rounded text-[10.5px] text-gray-700 leading-snug"
                                    placeholder="Describa cómo se evalúan estos factores de desempeño..."
                                  />
                                </div>
                              </div>

                              {/* ELEMENTO 6: Presupuesto y Recursos Financieros (Rubros Editables y Eliminables) */}
                              <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">6</span>
                                      Presupuesto y Recursos
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newRubro = {
                                          id: `rub-${selectedProgram.id}-${Date.now()}`,
                                          rubro: 'Nuevo rubro presupuestal',
                                          recursos: 'Descripción de recursos...',
                                          asignado: 1000000,
                                          ejecutado: 0
                                        };
                                        const nextRubros = [...rubrosItems, newRubro];
                                        const totalAsig = nextRubros.reduce((acc, r) => acc + (Number(r.asignado) || 0), 0);
                                        const totalEjec = nextRubros.reduce((acc, r) => acc + (Number(r.ejecutado) || 0), 0);
                                        updateSelectedProgram({
                                          rubrosPresupuesto: nextRubros,
                                          presupuestoAsignado: totalAsig,
                                          presupuestoEjecutado: totalEjec,
                                          detallePresupuesto: nextRubros.map(r => `${r.rubro}: $${r.asignado.toLocaleString('es-CO')}`).join(', ')
                                        });
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={11} /> Agregar Rubro
                                    </button>
                                  </div>

                                  {/* Totales Editables o Calculados */}
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                                      <label className="text-[9px] font-bold text-emerald-800 uppercase block">Asignado ($ COP)</label>
                                      <input
                                        type="number"
                                        value={selectedProgram.presupuestoAsignado}
                                        onChange={(e) => updateSelectedProgram({ presupuestoAsignado: Number(e.target.value) || 0 })}
                                        className="w-full mt-0.5 bg-white px-2 py-1 border border-emerald-300 rounded font-mono font-black text-xs text-emerald-950"
                                      />
                                    </div>
                                    <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-200">
                                      <label className="text-[9px] font-bold text-sky-800 uppercase block">Ejecutado ({ejecucionPresupuestalPct}%)</label>
                                      <input
                                        type="number"
                                        value={selectedProgram.presupuestoEjecutado}
                                        onChange={(e) => updateSelectedProgram({ presupuestoEjecutado: Number(e.target.value) || 0 })}
                                        className="w-full mt-0.5 bg-white px-2 py-1 border border-sky-300 rounded font-mono font-black text-xs text-sky-950"
                                      />
                                    </div>
                                  </div>

                                  {/* Desglose de Rubros Editable */}
                                  <div className="space-y-2 max-h-[165px] overflow-y-auto pr-1">
                                    {rubrosItems.map((item) => (
                                      <div key={item.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5 text-[10px]">
                                        <div className="flex items-center justify-between gap-1">
                                          <input
                                            type="text"
                                            value={item.rubro}
                                            onChange={(e) => {
                                              const nextRubros = rubrosItems.map(r =>
                                                r.id === item.id ? { ...r, rubro: e.target.value } : r
                                              );
                                              updateSelectedProgram({
                                                rubrosPresupuesto: nextRubros,
                                                detallePresupuesto: nextRubros.map(r => `${r.rubro} (${r.recursos})`).join(' | ')
                                              });
                                            }}
                                            className="flex-1 bg-white px-2 py-1 border border-gray-200 rounded font-bold text-gray-900"
                                            placeholder="Concepto o rubro..."
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextRubros = rubrosItems.filter(r => r.id !== item.id);
                                              const totalAsig = nextRubros.reduce((acc, r) => acc + (Number(r.asignado) || 0), 0);
                                              const totalEjec = nextRubros.reduce((acc, r) => acc + (Number(r.ejecutado) || 0), 0);
                                              updateSelectedProgram({
                                                rubrosPresupuesto: nextRubros,
                                                presupuestoAsignado: totalAsig,
                                                presupuestoEjecutado: totalEjec,
                                                detallePresupuesto: nextRubros.map(r => `${r.rubro} (${r.recursos})`).join(' | ')
                                              });
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                            title="Eliminar rubro presupuestal"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>

                                        <input
                                          type="text"
                                          value={item.recursos}
                                          onChange={(e) => {
                                            const nextRubros = rubrosItems.map(r =>
                                              r.id === item.id ? { ...r, recursos: e.target.value } : r
                                            );
                                            updateSelectedProgram({
                                              rubrosPresupuesto: nextRubros,
                                              detallePresupuesto: nextRubros.map(r => `${r.rubro} (${r.recursos})`).join(' | ')
                                            });
                                          }}
                                          className="w-full bg-white px-2 py-1 border border-gray-200 rounded text-gray-600"
                                          placeholder="Detalle de recursos técnicos/financieros..."
                                        />

                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div>
                                            <span className="text-[9px] text-gray-500 font-bold block">Asignado ($):</span>
                                            <input
                                              type="number"
                                              value={item.asignado}
                                              onChange={(e) => {
                                                const val = Number(e.target.value) || 0;
                                                const nextRubros = rubrosItems.map(r =>
                                                  r.id === item.id ? { ...r, asignado: val } : r
                                                );
                                                const totalAsig = nextRubros.reduce((acc, r) => acc + (Number(r.asignado) || 0), 0);
                                                updateSelectedProgram({
                                                  rubrosPresupuesto: nextRubros,
                                                  presupuestoAsignado: totalAsig
                                                });
                                              }}
                                              className="w-full bg-white px-1.5 py-0.5 border border-gray-200 rounded font-mono font-bold text-emerald-800"
                                            />
                                          </div>
                                          <div>
                                            <span className="text-[9px] text-gray-500 font-bold block">Ejecutado ($):</span>
                                            <input
                                              type="number"
                                              value={item.ejecutado}
                                              onChange={(e) => {
                                                const val = Number(e.target.value) || 0;
                                                const nextRubros = rubrosItems.map(r =>
                                                  r.id === item.id ? { ...r, ejecutado: val } : r
                                                );
                                                const totalEjec = nextRubros.reduce((acc, r) => acc + (Number(r.ejecutado) || 0), 0);
                                                updateSelectedProgram({
                                                  rubrosPresupuesto: nextRubros,
                                                  presupuestoEjecutado: totalEjec
                                                });
                                              }}
                                              className="w-full bg-white px-1.5 py-0.5 border border-gray-200 rounded font-mono font-bold text-sky-800"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500">
                                  <span>Saldo disponible:</span>
                                  <span className="font-mono font-bold text-gray-800">
                                    $ {Math.max(0, presupuestoAsignado - presupuestoEjecutado).toLocaleString('es-CO')} COP
                                  </span>
                                </div>
                              </div>

                              {/* ELEMENTO 7: Mecanismos de Seguimiento (Editable, Adicionable y Eliminable) */}
                              <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">7</span>
                                      Mecanismos de Seguimiento
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMec = {
                                          id: `mec-${selectedProgram.id}-${Date.now()}`,
                                          estrategia: 'Nueva estrategia o método de seguimiento...',
                                          frecuencia: 'Mensual',
                                          responsable: selectedProgram.responsableSeguimiento || 'Líder del PESV',
                                          evidencia: 'Informe de auditoría / Acta de seguimiento'
                                        };
                                        const nextMecs = [...mecanismosItems, newMec];
                                        updateSelectedProgram({
                                          mecanismosLista: nextMecs,
                                          mecanismosSeguimiento: nextMecs.map(m => m.estrategia).join(' | ')
                                        });
                                      }}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={11} /> Agregar Mecanismo
                                    </button>
                                  </div>

                                  <div className="space-y-2 max-h-[245px] overflow-y-auto pr-1">
                                    {mecanismosItems.map((mec, idx) => (
                                      <div key={mec.id} className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100 space-y-1.5 text-[10px]">
                                        <div className="flex items-center justify-between">
                                          <span className="font-black text-indigo-950 uppercase text-[9.5px]">
                                            Mecanismo #{idx + 1}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextMecs = mecanismosItems.filter(m => m.id !== mec.id);
                                              updateSelectedProgram({
                                                mecanismosLista: nextMecs,
                                                mecanismosSeguimiento: nextMecs.map(m => m.estrategia).join(' | '),
                                                frecuenciaSeguimiento: nextMecs[0]?.frecuencia || '',
                                                responsableSeguimiento: nextMecs[0]?.responsable || ''
                                              });
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer flex items-center gap-0.5 font-bold"
                                            title="Eliminar este mecanismo de seguimiento"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>

                                        <div>
                                          <label className="text-[9px] font-bold text-gray-500 uppercase block">Estrategia y Método de Seguimiento:</label>
                                          <textarea
                                            rows={2}
                                            value={mec.estrategia}
                                            onChange={(e) => {
                                              const nextMecs = mecanismosItems.map(m =>
                                                m.id === mec.id ? { ...m, estrategia: e.target.value } : m
                                              );
                                              updateSelectedProgram({
                                                mecanismosLista: nextMecs,
                                                mecanismosSeguimiento: nextMecs.map(m => m.estrategia).join(' | ')
                                              });
                                            }}
                                            className="w-full mt-0.5 p-1.5 bg-white border border-gray-200 rounded text-[10.5px] text-gray-800 leading-snug"
                                            placeholder="Redacte el método de seguimiento continuo..."
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase block">Periodicidad:</label>
                                            <input
                                              type="text"
                                              value={mec.frecuencia}
                                              onChange={(e) => {
                                                const nextMecs = mecanismosItems.map(m =>
                                                  m.id === mec.id ? { ...m, frecuencia: e.target.value } : m
                                                );
                                                updateSelectedProgram({
                                                  mecanismosLista: nextMecs,
                                                  frecuenciaSeguimiento: nextMecs[0]?.frecuencia || e.target.value
                                                });
                                              }}
                                              className="w-full bg-white px-2 py-1 border border-gray-200 rounded font-semibold text-indigo-900"
                                              placeholder="Ej. Semanal / Mensual"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase block">Responsable:</label>
                                            <input
                                              type="text"
                                              value={mec.responsable}
                                              onChange={(e) => {
                                                const nextMecs = mecanismosItems.map(m =>
                                                  m.id === mec.id ? { ...m, responsable: e.target.value } : m
                                                );
                                                updateSelectedProgram({
                                                  mecanismosLista: nextMecs,
                                                  responsableSeguimiento: nextMecs[0]?.responsable || e.target.value
                                                });
                                              }}
                                              className="w-full bg-white px-2 py-1 border border-gray-200 rounded font-semibold text-gray-800"
                                              placeholder="Cargo responsable..."
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ELEMENTO 8: Cronograma de Actividades del Programa */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                                <span className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-sky-700 text-white flex items-center justify-center font-black text-[10px]">8</span>
                                  Cronograma de Actividades del Programa
                                </span>
                                <div className="text-[10px] text-gray-500 font-semibold">
                                  Total: {selectedProgram.actividades.length} actividades planificadas ({doneAct} realizadas)
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-200">
                                      <th className="p-3">Actividad</th>
                                      <th className="p-3">Objetivo de Actividad</th>
                                      <th className="p-3">Responsable</th>
                                      <th className="p-3 text-center">Fecha Realización</th>
                                      <th className="p-3">Verificación</th>
                                      <th className="p-3">Indicadores</th>
                                      <th className="p-3 text-center">Estado</th>
                                      <th className="p-3 text-center">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-150">
                                    {selectedProgram.actividades.length === 0 ? (
                                      <tr>
                                        <td colSpan={8} className="p-6 text-center text-gray-400 italic">
                                          No hay actividades registradas en este programa. Utilice el formulario de abajo para agregar una.
                                        </td>
                                      </tr>
                                    ) : (
                                      selectedProgram.actividades.map((act) => (
                                        <tr key={act.id} className="hover:bg-gray-50/50">
                                          <td className="p-3 font-semibold text-gray-900 max-w-[200px] leading-snug">
                                            {act.actividad}
                                          </td>
                                          <td className="p-3 text-gray-600 max-w-[200px] leading-snug">
                                            {act.objetivo}
                                          </td>
                                          <td className="p-3 text-gray-600 font-medium">
                                            {act.responsable}
                                          </td>
                                          <td className="p-3 text-center font-mono text-gray-800 whitespace-nowrap">
                                            {act.fechaRealizacion || 'N/A'}
                                          </td>
                                          <td className="p-3 text-gray-600 max-w-[150px] leading-snug">
                                            {act.verificacion}
                                          </td>
                                          <td className="p-3 text-gray-600 max-w-[150px] leading-snug">
                                            {act.indicadores}
                                          </td>
                                          <td className="p-3 text-center whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                                              act.estado === 'Realizado'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : act.estado === 'En Ejecución'
                                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                                : act.estado === 'Cancelado'
                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                              {act.estado}
                                            </span>
                                          </td>
                                          <td className="p-3 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingActivityId(act.id);
                                                  setNewActivity({
                                                    actividad: act.actividad,
                                                    objetivo: act.objetivo,
                                                    responsable: act.responsable,
                                                    fechaRealizacion: act.fechaRealizacion,
                                                    verificacion: act.verificacion,
                                                    indicadores: act.indicadores,
                                                    estado: act.estado
                                                  });
                                                  document.getElementById('form-registro-actividades')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer"
                                              >
                                                Editar
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedActivities = selectedProgram.actividades.filter(a => a.id !== act.id);
                                                  setRiskPrograms(riskPrograms.map(p => p.id === selectedProgram.id ? { ...p, actividades: updatedActivities } : p));
                                                }}
                                                className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                                              >
                                                Eliminar
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Formulario de Creación/Edición de Actividad */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4" id="form-registro-actividades">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h4 className="text-xs font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider">
                                  <PenTool size={14} className="text-sky-600" />
                                  {editingActivityId ? 'Editar Actividad del Programa' : 'Crear Nueva Actividad / Plan de Trabajo'}
                                </h4>
                                {editingActivityId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingActivityId(null);
                                      setNewActivity({
                                        actividad: '',
                                        objetivo: '',
                                        responsable: '',
                                        fechaRealizacion: '',
                                        verificacion: '',
                                        indicadores: '',
                                        estado: 'Programado'
                                      });
                                    }}
                                    className="text-[10px] text-gray-500 underline hover:text-gray-800 font-bold"
                                  >
                                    Cancelar Edición
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-gray-600 font-bold mb-1">Nombre de la Actividad</label>
                                    <textarea
                                      value={newActivity.actividad}
                                      onChange={(e) => setNewActivity({ ...newActivity, actividad: e.target.value })}
                                      rows={2}
                                      className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                      placeholder="ej. Auditoría sorpresa de velocidad con cinemómetro en vía de acceso principal."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-gray-600 font-bold mb-1">Objetivo de la Actividad</label>
                                    <textarea
                                      value={newActivity.objetivo}
                                      onChange={(e) => setNewActivity({ ...newActivity, objetivo: e.target.value })}
                                      rows={2}
                                      className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                      placeholder="ej. Asegurar que ningún conductor supere los 30 km/h en zonas residenciales o de cargue."
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-gray-600 font-bold mb-1">Responsable</label>
                                      <input
                                        type="text"
                                        value={newActivity.responsable}
                                        onChange={(e) => setNewActivity({ ...newActivity, responsable: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded text-[11px]"
                                        placeholder="ej. Supervisor de Tráfico"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-gray-600 font-bold mb-1">Fecha de Realización</label>
                                      <input
                                        type="date"
                                        value={newActivity.fechaRealizacion}
                                        onChange={(e) => setNewActivity({ ...newActivity, fechaRealizacion: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded text-[11px] font-mono text-center"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3 flex flex-col justify-between">
                                  <div>
                                    <label className="block text-gray-600 font-bold mb-1">Método de Verificación</label>
                                    <textarea
                                      value={newActivity.verificacion}
                                      onChange={(e) => setNewActivity({ ...newActivity, verificacion: e.target.value })}
                                      rows={2}
                                      className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                      placeholder="ej. Reporte de lecturas de velocidad guardado y registro fotográfico en el file del vehículo."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-gray-600 font-bold mb-1">Fórmula de Indicadores del Programa / Actividad</label>
                                    <textarea
                                      value={newActivity.indicadores}
                                      onChange={(e) => setNewActivity({ ...newActivity, indicadores: e.target.value })}
                                      rows={1}
                                      className="w-full p-2 border border-gray-200 rounded text-[11px] leading-tight"
                                      placeholder="ej. % de exceso detectado = (Lecturas > 30 km/h / Total lecturas) * 100"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-gray-600 font-bold mb-1">Estado actual</label>
                                    <select
                                      value={newActivity.estado}
                                      onChange={(e) => setNewActivity({ ...newActivity, estado: e.target.value as any })}
                                      className="w-full p-2 border border-gray-200 bg-white rounded text-[11px] font-bold"
                                    >
                                      <option value="Programado">📌 Programado</option>
                                      <option value="En Ejecución">⚡ En Ejecución</option>
                                      <option value="Realizado">✅ Realizado</option>
                                      <option value="Cancelado">❌ Cancelado</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newActivity.actividad || !newActivity.objetivo || !newActivity.responsable) {
                                      alert('Por favor complete al menos la actividad, objetivo y responsable.');
                                      return;
                                    }

                                    let updatedActivities = [...selectedProgram.actividades];
                                    if (editingActivityId !== null) {
                                      // Update
                                      updatedActivities = updatedActivities.map(a => a.id === editingActivityId ? {
                                        ...a,
                                        ...newActivity
                                      } : a);
                                      setEditingActivityId(null);
                                    } else {
                                      // Create
                                      const genId = 'act-' + selectedProgram.id + '-' + Date.now();
                                      updatedActivities.push({
                                        id: genId,
                                        ...newActivity
                                      });
                                    }

                                    setRiskPrograms(riskPrograms.map(p => p.id === selectedProgram.id ? { ...p, actividades: updatedActivities } : p));

                                    // Reset Form
                                    setNewActivity({
                                      actividad: '',
                                      objetivo: '',
                                      responsable: '',
                                      fechaRealizacion: '',
                                      verificacion: '',
                                      indicadores: '',
                                      estado: 'Programado'
                                    });
                                  }}
                                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-6 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs shadow-md transition-all"
                                >
                                  <Plus size={14} />
                                  {editingActivityId ? 'Actualizar Actividad del Programa' : 'Agregar Actividad al Programa'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DEMO PASO 9: Plan anual de trabajo */}
                  {activeStep.id === 9 && (() => {
                    // Metrics calculations
                    const totalAct = annualPlanActivities.length;
                    const planeadasAct = annualPlanActivities.filter(a => a.estado === 'Planeada').length;
                    const enProcesoAct = annualPlanActivities.filter(a => a.estado === 'En proceso').length;
                    const ejecutadasAct = annualPlanActivities.filter(a => a.estado === 'Ejecutado').length;
                    
                    // Indicador Normativo de Cumplimiento: (Actividades Ejecutadas / Total de Actividades Planeadas) * 100
                    const cumplimientoPercent = totalAct > 0 ? Math.round((ejecutadasAct / totalAct) * 100) : 0;
                    const avancePonderado = totalAct > 0 ? Math.round(((ejecutadasAct + (enProcesoAct * 0.5)) / totalAct) * 100) : 0;

                    // Filtered list
                    const filteredPlan = annualPlanActivities.filter(a => {
                      const matchesStatus = planFilter === 'TODOS' || a.estado === planFilter;
                      const matchesFase = planFaseFilter === 'TODAS' || a.fase === planFaseFilter;
                      const matchesSearch = planSearch === '' || 
                        a.actividad.toLowerCase().includes(planSearch.toLowerCase()) ||
                        a.responsable.toLowerCase().includes(planSearch.toLowerCase()) ||
                        a.recursos.toLowerCase().includes(planSearch.toLowerCase());
                      return matchesStatus && matchesFase && matchesSearch;
                    });

                    const getStatusBadge = (estado: string) => {
                      switch (estado) {
                        case 'Ejecutado':
                          return {
                            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            dot: 'bg-emerald-500',
                            icon: '✅',
                            label: 'Ejecutado'
                          };
                        case 'En proceso':
                          return {
                            bg: 'bg-amber-50 text-amber-700 border-amber-200',
                            dot: 'bg-amber-500',
                            icon: '🔄',
                            label: 'En proceso'
                          };
                        case 'Planeada':
                        default:
                          return {
                            bg: 'bg-sky-50 text-sky-700 border-sky-200',
                            dot: 'bg-sky-500',
                            icon: '⏳',
                            label: 'Planeada'
                          };
                      }
                    };

                    const getSemaphore = (percent: number) => {
                      if (percent >= 80) return { color: 'text-emerald-700', bg: 'bg-emerald-500', badge: '🟢 Óptimo (Meta Cumplida)' };
                      if (percent >= 50) return { color: 'text-amber-700', bg: 'bg-amber-500', badge: '🟡 En Seguimiento / Aceptable' };
                      return { color: 'text-red-700', bg: 'bg-red-500', badge: '🔴 Atrasado / Requiere Aceleración' };
                    };

                    const semaforo = getSemaphore(cumplimientoPercent);

                    return (
                      <div className="space-y-6" id="paso-8-plan-trabajo-container">
                        {/* 1. Subheader Normativo Res. 40595 */}
                        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex items-start gap-3">
                          <CalendarDays className="text-sky-700 shrink-0 mt-0.5" size={20} />
                          <div className="text-xs text-sky-900 leading-relaxed">
                            <strong className="font-extrabold block text-sky-950 mb-0.5">Paso 8: Plan Anual de Trabajo del PESV (Resolución 40595 de 2022)</strong>
                            Este paso es <strong className="font-bold text-sky-950">obligatorio para los niveles Básico, Estándar y Avanzado</strong>. La organización debe documentar, programar, costear y monitorear el cronograma de actividades con sus responsables, recursos y fechas para garantizar la ejecución de las metas de seguridad vial.
                          </div>
                        </div>

                        {/* 2. INDICADOR DE CUMPLIMIENTO (ACTIVIDADES PLANEADAS VS. ACTIVIDADES EJECUTADAS) */}
                        <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <Target className="text-emerald-600" size={18} />
                              <div>
                                <h4 className="text-sm font-extrabold text-gray-900">Indicador de Cumplimiento del Plan Anual</h4>
                                <p className="text-[11px] text-gray-500 font-medium">Relación de Actividades Planeadas vs. Actividades Ejecutadas</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold border bg-gray-50 text-gray-700 border-gray-200">
                                {semaforo.badge}
                              </span>
                            </div>
                          </div>

                          {/* 4 Cards de Métricas */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-center">
                              <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Actividades</span>
                              <span className="text-2xl font-black text-slate-900 block mt-0.5">{totalAct}</span>
                              <span className="text-[10px] text-gray-500 font-medium">100% programado</span>
                            </div>
                            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-center">
                              <span className="text-[10px] uppercase font-bold text-sky-700 block">Planeadas (Pendientes)</span>
                              <span className="text-2xl font-black text-sky-800 block mt-0.5">{planeadasAct}</span>
                              <span className="text-[10px] text-sky-700 font-semibold">{totalAct > 0 ? Math.round((planeadasAct / totalAct) * 100) : 0}% del plan</span>
                            </div>
                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-center">
                              <span className="text-[10px] uppercase font-bold text-amber-700 block">En Proceso</span>
                              <span className="text-2xl font-black text-amber-800 block mt-0.5">{enProcesoAct}</span>
                              <span className="text-[10px] text-amber-700 font-semibold">{totalAct > 0 ? Math.round((enProcesoAct / totalAct) * 100) : 0}% en curso</span>
                            </div>
                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-center">
                              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Ejecutadas (Completadas)</span>
                              <span className="text-2xl font-black text-emerald-800 block mt-0.5">{ejecutadasAct}</span>
                              <span className="text-[10px] text-emerald-800 font-bold">{cumplimientoPercent}% cumplimiento</span>
                            </div>
                          </div>

                          {/* Barra de Progreso del Indicador */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                              <span className="flex items-center gap-1.5">
                                <span>Porcentaje de Cumplimiento Real:</span>
                                <strong className={`text-sm font-black ${semaforo.color}`}>{cumplimientoPercent}%</strong>
                                <span className="text-[10px] text-gray-500 font-normal">({ejecutadasAct} de {totalAct} ejecutadas)</span>
                              </span>
                              <span className="text-[11px] text-gray-600 font-semibold">
                                Avance Global (inc. En Proceso): <strong className="text-slate-900">{avancePonderado}%</strong>
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3.5 p-0.5 border border-gray-200 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${semaforo.bg}`}
                                style={{ width: `${Math.min(100, Math.max(cumplimientoPercent, 2))}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9.5px] text-gray-600 font-semibold pt-0.5">
                              <span>Fórmula: (N° Actividades Ejecutadas / N° Total Actividades Planeadas) × 100</span>
                              <span>Meta Normativa: 100% de ejecución</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. BARRA DE HERRAMIENTAS Y ACCIONES */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              id="btn-toggle-plan-form"
                              onClick={() => {
                                setShowPlanForm(!showPlanForm);
                                if (editingPlanActivityId) {
                                  setEditingPlanActivityId(null);
                                  setNewPlanActivity({
                                    actividad: '',
                                    responsable: '',
                                    recursos: '',
                                    fechaInicio: '',
                                    fechaFin: '',
                                    estado: 'Planeada',
                                    fase: 'Planificación',
                                    observaciones: ''
                                  });
                                }
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                            >
                              <Plus size={15} />
                              {showPlanForm ? 'Cerrar Formulario' : 'Ingresar Nueva Actividad'}
                            </button>

                            <button
                              type="button"
                              id="btn-print-plan"
                              onClick={() => setShowPlanPrintPreview(true)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                            >
                              <Printer size={14} />
                              Imprimir / Exportar Plan (PDF)
                            </button>
                          </div>

                          {/* Búsqueda */}
                          <div className="relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
                            <input
                              type="text"
                              value={planSearch}
                              onChange={(e) => setPlanSearch(e.target.value)}
                              placeholder="Buscar actividad, responsable..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* 4. FORMULARIO DE INGRESO Y EDICIÓN DE ACTIVIDADES */}
                        {showPlanForm && (
                          <div className="bg-emerald-50/30 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4 animate-fadeIn" id="form-plan-actividad">
                            <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                              <div className="flex items-center gap-2">
                                <Edit3 className="text-emerald-700" size={16} />
                                <h4 className="text-xs font-black text-slate-900 uppercase">
                                  {editingPlanActivityId ? 'Editar Actividad del Plan de Trabajo' : 'Formulario de Ingreso de Actividad'}
                                </h4>
                              </div>
                              {editingPlanActivityId && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                                  Editando ID: {editingPlanActivityId}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Nombre / Descripción de la Actividad */}
                              <div className="md:col-span-2">
                                <label className="block text-gray-700 font-bold mb-1">
                                  Nombre o Descripción de la Actividad <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="input-plan-actividad"
                                  value={newPlanActivity.actividad}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, actividad: e.target.value })}
                                  placeholder="ej. Capacitación en Manejo Defensivo y Prevención de Fatiga para Conductores"
                                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                />
                              </div>

                              {/* Responsable */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Responsable de Ejecución <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="input-plan-responsable"
                                  value={newPlanActivity.responsable}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, responsable: e.target.value })}
                                  placeholder="ej. Líder PESV / Coordinador SST"
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {['Líder PESV', 'Comité PESV', 'Jefe de Mantenimiento', 'Coordinador SST', 'Gerencia General'].map(resp => (
                                    <button
                                      key={resp}
                                      type="button"
                                      onClick={() => setNewPlanActivity({ ...newPlanActivity, responsable: resp })}
                                      className="text-[9.5px] bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 border border-gray-200 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    >
                                      + {resp}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Recursos Asignados */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Recursos Asignados (Financiero, Humano, Técnico, Logístico) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="input-plan-recursos"
                                  value={newPlanActivity.recursos}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, recursos: e.target.value })}
                                  placeholder="ej. Financiero: $2.500.000 / ARL / Software de inspección"
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {['Financiero / Presupuesto', 'Humano / Asesoría ARL', 'Técnico / Software', 'Logístico / Instalaciones'].map(rec => (
                                    <button
                                      key={rec}
                                      type="button"
                                      onClick={() => setNewPlanActivity({ ...newPlanActivity, recursos: rec })}
                                      className="text-[9.5px] bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 border border-gray-200 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    >
                                      + {rec}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Fecha de Inicio */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Fecha de Inicio <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  id="input-plan-fechainicio"
                                  value={newPlanActivity.fechaInicio}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, fechaInicio: e.target.value })}
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium cursor-pointer"
                                />
                              </div>

                              {/* Fecha Final / Límite */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Fecha Final / Límite <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  id="input-plan-fechafin"
                                  value={newPlanActivity.fechaFin}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, fechaFin: e.target.value })}
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium cursor-pointer"
                                />
                              </div>

                              {/* Estado */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Estado de la Actividad <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['Planeada', 'En proceso', 'Ejecutado'] as const).map(st => {
                                    const isSelected = newPlanActivity.estado === st;
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => setNewPlanActivity({ ...newPlanActivity, estado: st })}
                                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                          isSelected 
                                            ? st === 'Ejecutado' 
                                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                                              : st === 'En proceso' 
                                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                                              : 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        {st === 'Ejecutado' ? '✅ Ejecutado' : st === 'En proceso' ? '🔄 En proceso' : '⏳ Planeada'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Fase del PESV */}
                              <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                  Fase del Ciclo PHVA
                                </label>
                                <select
                                  value={newPlanActivity.fase || 'Planificación'}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, fase: e.target.value as any })}
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium cursor-pointer"
                                >
                                  <option value="Planificación">Fase 1: Planificación (Planear)</option>
                                  <option value="Implementación">Fase 2: Implementación y Ejecución (Hacer)</option>
                                  <option value="Seguimiento">Fase 3: Seguimiento por la Organización (Verificar)</option>
                                  <option value="Mejora">Fase 4: Mejora Continua (Actuar)</option>
                                </select>
                              </div>

                              {/* Observaciones */}
                              <div className="md:col-span-2">
                                <label className="block text-gray-700 font-bold mb-1">
                                  Observaciones / Entregables de Verificación
                                </label>
                                <input
                                  type="text"
                                  value={newPlanActivity.observaciones || ''}
                                  onChange={(e) => setNewPlanActivity({ ...newPlanActivity, observaciones: e.target.value })}
                                  placeholder="ej. Registro de firmas de asistencia, actas de evaluación o certificado de calibración"
                                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                />
                              </div>
                            </div>

                            {/* Botones de acción del formulario */}
                            <div className="flex justify-end items-center gap-2 pt-2 border-t border-emerald-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPlanForm(false);
                                  setEditingPlanActivityId(null);
                                  setNewPlanActivity({
                                    actividad: '',
                                    responsable: '',
                                    recursos: '',
                                    fechaInicio: '',
                                    fechaFin: '',
                                    estado: 'Planeada',
                                    fase: 'Planificación',
                                    observaciones: ''
                                  });
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 cursor-pointer text-xs transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                id="btn-save-plan-activity"
                                onClick={() => {
                                  if (!newPlanActivity.actividad.trim()) {
                                    alert('Por favor ingrese el nombre o descripción de la actividad.');
                                    return;
                                  }
                                  if (!newPlanActivity.responsable.trim()) {
                                    alert('Por favor especifique el responsable de la actividad.');
                                    return;
                                  }
                                  if (!newPlanActivity.fechaInicio || !newPlanActivity.fechaFin) {
                                    alert('Por favor defina la fecha de inicio y la fecha final.');
                                    return;
                                  }

                                  if (editingPlanActivityId) {
                                    setAnnualPlanActivities(prev => prev.map(item => 
                                      item.id === editingPlanActivityId ? { ...newPlanActivity, id: editingPlanActivityId } : item
                                    ));
                                    setEditingPlanActivityId(null);
                                  } else {
                                    const newId = `ACT-${String(annualPlanActivities.length + 1).padStart(3, '0')}`;
                                    setAnnualPlanActivities(prev => [...prev, { ...newPlanActivity, id: newId }]);
                                  }

                                  // Reset
                                  setNewPlanActivity({
                                    actividad: '',
                                    responsable: '',
                                    recursos: '',
                                    fechaInicio: '',
                                    fechaFin: '',
                                    estado: 'Planeada',
                                    fase: 'Planificación',
                                    observaciones: ''
                                  });
                                  setShowPlanForm(false);
                                }}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer text-xs transition-all flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                {editingPlanActivityId ? 'Actualizar Actividad' : 'Guardar Actividad en el Plan'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 5. TABLA Y LISTA DE ACTIVIDADES */}
                        <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                          {/* Filtros de Tabla */}
                          <div className="p-3.5 bg-gray-50/70 border-b border-gray-150 flex flex-wrap justify-between items-center gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="text-[11px] font-bold text-gray-500 mr-1 flex items-center gap-1">
                                <Filter size={12} /> Estado:
                              </span>
                              {(['TODOS', 'Planeada', 'En proceso', 'Ejecutado'] as const).map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setPlanFilter(st)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    planFilter === st
                                      ? 'bg-slate-900 text-white shadow-xs'
                                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  {st === 'TODOS' ? `Todos (${totalAct})` : st === 'Planeada' ? `Planeadas (${planeadasAct})` : st === 'En proceso' ? `En proceso (${enProcesoAct})` : `Ejecutadas (${ejecutadasAct})`}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[11px] font-bold text-gray-500">Fase:</span>
                              <select
                                value={planFaseFilter}
                                onChange={(e) => setPlanFaseFilter(e.target.value)}
                                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                <option value="TODAS">Todas las Fases</option>
                                <option value="Planificación">Planificación</option>
                                <option value="Implementación">Implementación</option>
                                <option value="Seguimiento">Seguimiento</option>
                                <option value="Mejora">Mejora</option>
                              </select>
                            </div>
                          </div>

                          {/* Listado */}
                          {filteredPlan.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 bg-gray-50/30">
                              <ClipboardList className="mx-auto mb-2 opacity-40 text-gray-400" size={32} />
                              <p className="font-bold text-xs text-gray-700">No se encontraron actividades con los filtros actuales.</p>
                              <p className="text-[11px] text-gray-400 mt-1">Haga clic en "Ingresar Nueva Actividad" para registrar una tarea en el plan.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/70 border-b border-gray-200 text-slate-700 font-extrabold uppercase text-[10px]">
                                    <th className="py-2.5 px-3">Código / Actividad</th>
                                    <th className="py-2.5 px-3">Fase</th>
                                    <th className="py-2.5 px-3">Responsable</th>
                                    <th className="py-2.5 px-3">Recursos</th>
                                    <th className="py-2.5 px-3">Cronograma</th>
                                    <th className="py-2.5 px-3 text-center">Estado</th>
                                    <th className="py-2.5 px-3 text-right">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {filteredPlan.map(act => {
                                    const stBadge = getStatusBadge(act.estado);
                                    return (
                                      <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 px-3">
                                          <div className="flex items-start gap-2">
                                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded shrink-0">
                                              {act.id}
                                            </span>
                                            <div>
                                              <p className="font-bold text-gray-900 leading-snug">{act.actividad}</p>
                                              {act.observaciones && (
                                                <p className="text-[10.5px] text-gray-500 italic mt-0.5">
                                                  Entregable: {act.observaciones}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                          <span className="text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                                            {act.fase || 'Planificación'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-gray-700 font-medium whitespace-nowrap">
                                          {act.responsable}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 text-[11px] max-w-[150px] truncate" title={act.recursos}>
                                          {act.recursos}
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                          <div className="text-[10.5px] text-gray-600 font-medium">
                                            <span>{act.fechaInicio}</span>
                                            <span className="text-gray-400 mx-1">➔</span>
                                            <strong className="text-slate-800">{act.fechaFin}</strong>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                          <div className="inline-flex items-center gap-1">
                                            <select
                                              value={act.estado}
                                              onChange={(e) => {
                                                const newSt = e.target.value as 'Planeada' | 'En proceso' | 'Ejecutado';
                                                setAnnualPlanActivities(prev => prev.map(a => a.id === act.id ? { ...a, estado: newSt } : a));
                                              }}
                                              className={`text-[10.5px] font-bold px-2 py-1 rounded-full border cursor-pointer ${stBadge.bg}`}
                                            >
                                              <option value="Planeada">⏳ Planeada</option>
                                              <option value="En proceso">🔄 En proceso</option>
                                              <option value="Ejecutado">✅ Ejecutado</option>
                                            </select>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingPlanActivityId(act.id);
                                                setNewPlanActivity({
                                                  actividad: act.actividad,
                                                  responsable: act.responsable,
                                                  recursos: act.recursos,
                                                  fechaInicio: act.fechaInicio,
                                                  fechaFin: act.fechaFin,
                                                  estado: act.estado,
                                                  fase: act.fase || 'Planificación',
                                                  observaciones: act.observaciones || ''
                                                });
                                                setShowPlanForm(true);
                                              }}
                                              title="Editar actividad"
                                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                            >
                                              <Edit size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (window.confirm(`¿Está seguro de eliminar la actividad "${act.actividad}"?`)) {
                                                  setAnnualPlanActivities(prev => prev.filter(a => a.id !== act.id));
                                                }
                                              }}
                                              title="Eliminar actividad"
                                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 6. MODAL DE IMPRESIÓN Y EXPORTACIÓN FORMAL DEL PLAN DE TRABAJO */}
                        {showPlanPrintPreview && (
                          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
                              <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                                <div>
                                  <h3 className="text-sm font-black text-slate-900 uppercase">Vista Formal: Plan Anual de Trabajo PESV</h3>
                                  <p className="text-xs text-gray-500">Documento Oficial para Auditoría (Resolución 40595 de 2022)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadPDF('pdf-annual-work-plan', `Plan_Anual_Trabajo_PESV_${companyName.replace(/\s+/g, '_')}.pdf`)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Download size={13} />
                                    Descargar PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowPlanPrintPreview(false)}
                                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              </div>

                              {/* Documento A4 Formato Formal */}
                              <div id="pdf-annual-work-plan" className="bg-white p-6 border border-gray-300 rounded-lg text-slate-900 font-sans space-y-5 text-xs">
                                {/* Encabezado Institucional */}
                                <div className="grid grid-cols-4 border border-gray-800 rounded text-center divide-x divide-gray-800">
                                  <div className="p-3 flex flex-col justify-center items-center">
                                    {isImageLogo ? (
                                      <img src={companyLogo} alt={companyName} className="h-10 max-w-[110px] object-contain mb-1" />
                                    ) : (
                                      <Shield className="text-emerald-700" size={32} />
                                    )}
                                    <span className="font-extrabold text-[10px] mt-1">PLAN ESTRATÉGICO DE SEGURIDAD VIAL</span>
                                  </div>
                                  <div className="col-span-2 p-3 flex flex-col justify-center">
                                    <h2 className="font-black text-sm uppercase">{companyName}</h2>
                                    <h3 className="font-bold text-xs text-gray-700 mt-0.5">PLAN ANUAL DE TRABAJO - PASO 8</h3>
                                    <span className="text-[10px] text-gray-500">Conforme a la Resolución 40595 de 2022</span>
                                  </div>
                                  <div className="p-3 text-[10px] flex flex-col justify-center text-left space-y-0.5">
                                    <div><strong>Código:</strong> PESV-PAT-001</div>
                                    <div><strong>Versión:</strong> 01</div>
                                    <div><strong>Fecha:</strong> {policyDate}</div>
                                    <div><strong>Nivel:</strong> {config.nivelCalculado}</div>
                                  </div>
                                </div>

                                {/* Resumen del Indicador de Cumplimiento */}
                                <div className="bg-slate-50 p-3 rounded border border-gray-300 flex justify-between items-center text-xs">
                                  <div>
                                    <strong className="block text-slate-900">Indicador de Cumplimiento del Plan:</strong>
                                    <span className="text-gray-600">Actividades Ejecutadas vs. Planeadas: </span>
                                    <strong className="text-emerald-700 font-black">{cumplimientoPercent}%</strong> ({ejecutadasAct} de {totalAct} completadas)
                                  </div>
                                  <div className="text-right text-[11px]">
                                    <div><strong>Planeadas:</strong> {planeadasAct} | <strong>En proceso:</strong> {enProcesoAct} | <strong>Ejecutadas:</strong> {ejecutadasAct}</div>
                                    <div className="text-gray-500">Avance Global Ponderado: {avancePonderado}%</div>
                                  </div>
                                </div>

                                {/* Tabla Consolidada de Actividades */}
                                <table className="w-full border border-gray-800 text-[10.5px] border-collapse">
                                  <thead>
                                    <tr className="bg-gray-200 text-gray-900 font-bold border-b border-gray-800 text-left divide-x divide-gray-800">
                                      <th className="p-1.5 w-12 text-center">Ítem</th>
                                      <th className="p-1.5">Actividad Programada</th>
                                      <th className="p-1.5">Fase</th>
                                      <th className="p-1.5">Responsable</th>
                                      <th className="p-1.5">Recursos Asignados</th>
                                      <th className="p-1.5">Periodo</th>
                                      <th className="p-1.5 text-center">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-300">
                                    {annualPlanActivities.map((item, idx) => (
                                      <tr key={item.id} className="divide-x divide-gray-300">
                                        <td className="p-1.5 text-center font-mono font-bold">{idx + 1}</td>
                                        <td className="p-1.5 font-medium">{item.actividad}</td>
                                        <td className="p-1.5 whitespace-nowrap">{item.fase || 'Planificación'}</td>
                                        <td className="p-1.5 whitespace-nowrap">{item.responsable}</td>
                                        <td className="p-1.5">{item.recursos}</td>
                                        <td className="p-1.5 whitespace-nowrap">{item.fechaInicio} a {item.fechaFin}</td>
                                        <td className="p-1.5 text-center font-bold">
                                          {item.estado === 'Ejecutado' ? '✅ Ejecutado' : item.estado === 'En proceso' ? '🔄 En proceso' : '⏳ Planeada'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {/* Firmas de Aprobación */}
                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-300">
                                  <div className="text-center">
                                    <div className="border-b border-gray-800 pb-1 mb-1 font-bold">
                                      {repSignatureImg1 ? (
                                        <img src={repSignatureImg1} alt="Firma" className="h-10 mx-auto object-contain" />
                                      ) : (
                                        <div className="h-10 flex items-center justify-center italic text-gray-400 font-mono text-[10px]">
                                          [Firma Digital Aprobada]
                                        </div>
                                      )}
                                      <span>{repLegal}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600 block">Representante Legal / Gerencia</span>
                                  </div>
                                  <div className="text-center">
                                    <div className="border-b border-gray-800 pb-1 mb-1 font-bold">
                                      {leaderSignatureImg ? (
                                        <img src={leaderSignatureImg} alt="Firma" className="h-10 mx-auto object-contain" />
                                      ) : (
                                        <div className="h-10 flex items-center justify-center italic text-gray-400 font-mono text-[10px]">
                                          [Firma Digital Líder PESV]
                                        </div>
                                      )}
                                      <span>{leaderName}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600 block">Líder del Diseño e Implementación del PESV</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DEMO PASO 10: Competencia y plan anual de formación con Integración Externa */}
                  {activeStep.id === 10 && (
                    <Step10TrainingModule
                      companyName={companyName}
                      companyLogo={companyLogo}
                      companyNit={companyNit}
                      repLegal={repLegal}
                      leaderName={leaderName}
                      repSignatureImg1={repSignatureImg1}
                      leaderSignatureImg={leaderSignatureImg}
                      onNavigateToIndicators={onNavigateToIndicators}
                    />
                  )}

                  {activeStep.id === 11 && (() => {
                    // Find selected evaluation
                    const currentEval = evaluacionesComportamiento.find(e => e.id === selectedEvalId) || evaluacionesComportamiento[0];
                    
                    // Count stats
                    const totalEvals = evaluacionesComportamiento.length;
                    const totalInfracciones = evaluacionesComportamiento.reduce((sum, ev) => sum + ev.infracciones.length, 0);
                    const totalQuejas = evaluacionesComportamiento.reduce((sum, ev) => sum + ev.quejas.length, 0);
                    
                    // Check active driver risk
                    const getRiskSemaphore = (ev: any) => {
                      if (!ev) return { label: 'Excelente (Bajo)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700', badge: '🟢' };
                      const score = (ev.infracciones?.length || 0) + (ev.quejas?.length || 0);
                      if (score === 0) return { label: 'Excelente (Bajo)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700', badge: '🟢' };
                      if (score <= 2) return { label: 'Atención (Medio)', color: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700', badge: '🟡' };
                      return { label: 'Crítico (Alto)', color: 'bg-red-100 text-red-800 border-red-200', text: 'text-red-700', badge: '🔴' };
                    };

                    const activeRisk = currentEval ? getRiskSemaphore(currentEval) : { label: 'N/A', color: 'bg-gray-100 text-gray-800', text: 'text-gray-600', badge: '⚪' };

                    return (
                      <div className="space-y-6" id="comportamiento-safe-container">
                        {/* Subheader descriptivo */}
                        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex items-start gap-3">
                          <Info size={18} className="text-sky-700 shrink-0 mt-0.5" />
                          <div className="text-xs text-sky-850 leading-relaxed">
                            <strong className="font-extrabold">Control Normativo (Nivel Avanzado / Paso 11):</strong> De acuerdo con la <strong className="font-bold">Resolución 40595 de 2022</strong>, la organización debe registrar, monitorear y documentar las conductas en vía, incluyendo <strong className="font-bold">Infracciones de Tránsito</strong> (comparendos) y <strong className="font-bold">Quejas de Seguridad Vial</strong> (reportes ciudadanos, internos o de supervisores) para cada uno de los conductores.
                          </div>
                        </div>

                        {/* Indicadores Rápidos */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm text-center">
                            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Conductores Evaluados</span>
                            <strong className="text-xl font-black text-slate-800 block">{totalEvals}</strong>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm text-center">
                            <span className="text-[10px] text-red-500 font-bold block uppercase tracking-wider">Infracciones Registradas</span>
                            <strong className="text-xl font-black text-red-600 block">{totalInfracciones}</strong>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm text-center">
                            <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wider">Quejas Recibidas</span>
                            <strong className="text-xl font-black text-amber-600 block">{totalQuejas}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Columna Izquierda: Listado de Evaluaciones / Conductores */}
                          <div className="lg:col-span-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[11px] font-extrabold text-gray-900 uppercase">Lista de Evaluaciones</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewEvalObj({
                                    nombre: '',
                                    cedula: '',
                                    cargo: '',
                                    periodoEvaluado: 'Primer Semestre 2026',
                                    fechaEvaluacion: '2026-06-25',
                                    observacionesGenerales: '',
                                    infracciones: [],
                                    quejas: [],
                                    compromisoFirmado: false,
                                    firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
                                    firmaEvaluadorImg: null,
                                    firmaConductor: '',
                                    firmaConductorImg: null,
                                    fechaFirma: '2026-06-25'
                                  });
                                  setShowEvalForm(true);
                                }}
                                className="text-[10px] bg-sky-600 hover:bg-sky-700 text-white font-black px-2 py-1 rounded cursor-pointer transition-all flex items-center gap-0.5"
                              >
                                <Plus size={10} /> Nuevo
                              </button>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {evaluacionesComportamiento.map((ev) => {
                                const rS = getRiskSemaphore(ev);
                                return (
                                  <button
                                    key={ev.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEvalId(ev.id);
                                      setShowEvalForm(false);
                                    }}
                                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex justify-between items-start gap-2 ${
                                      selectedEvalId === ev.id && !showEvalForm
                                        ? 'border-sky-600 bg-sky-50/30 font-bold shadow-sm'
                                        : 'border-gray-100 hover:bg-gray-50 bg-gray-50/30'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="text-gray-900 font-extrabold leading-tight">{ev.nombre}</div>
                                      <div className="text-gray-500 text-[10px]">{ev.cargo}</div>
                                      <div className="text-[9px] text-gray-400 font-mono">Periodo: {ev.periodoEvaluado}</div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-extrabold ${rS.color}`}>
                                        {rS.badge} {rS.label}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Caja de Código QR y Enlace Funcional para Compartir */}
                            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
                                  <Shield size={12} className="text-sky-700" />
                                  <span>Canales de Reporte y QR</span>
                                </div>
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  QR Activo
                                </span>
                              </div>

                              <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => setQrType('reporte')}
                                  className={`flex-1 text-[9.5px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                                    qrType === 'reporte' ? 'bg-sky-600 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  QR Cómo Conduzco
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQrType('evaluaciones')}
                                  className={`flex-1 text-[9.5px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                                    qrType === 'evaluaciones' ? 'bg-teal-600 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  QR Eval. Digital
                                </button>
                              </div>

                              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setShowStep11PortalModal(true)}
                                  className="cursor-pointer group relative"
                                  title="Clic para abrir el formulario digital interactivo"
                                >
                                  <canvas
                                    id="qrCodeCanvas"
                                    width={156}
                                    height={156}
                                    className="border border-gray-100 rounded-lg p-1 bg-white mx-auto transition-transform group-hover:scale-[1.02]"
                                    ref={(el) => {
                                      qrCanvasRef.current = el;
                                      if (el && shareLinkActive) {
                                        drawQrCodeOnCanvas(el, shareLinkActive, qrType);
                                      }
                                    }}
                                  />
                                </button>
                                <div className="text-center w-full space-y-1">
                                  <span className="text-[9.5px] font-bold text-slate-700 block">
                                    {qrType === 'reporte'
                                      ? 'Escanea con tu celular para reportar en vía'
                                      : `Evaluación Digital: ${currentEval?.nombre || 'Conductor'}`}
                                  </span>
                                  <a
                                    href={shareLinkActive}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-mono text-sky-700 hover:text-sky-900 hover:underline block truncate max-w-full px-2"
                                    title="Abrir enlace público en una nueva pestaña"
                                  >
                                    {shareLinkActive}
                                  </a>
                                </div>
                              </div>

                              {/* Botones principales de Descarga y Copia */}
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const canvas = qrCanvasRef.current || (document.getElementById('qrCodeCanvas') as HTMLCanvasElement);
                                    if (canvas) {
                                      const url = canvas.toDataURL('image/png');
                                      const link = document.createElement('a');
                                      link.download = `QR_PESV_${qrType === 'reporte' ? 'Como_Conduzco' : 'Evaluacion_Digital'}.png`;
                                      link.href = url;
                                      link.click();
                                    }
                                  }}
                                  className="text-[9.5px] bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-950"
                                >
                                  <Download size={11} /> Descargar QR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText?.(shareLinkActive);
                                    setCopiedShareLink(true);
                                    setTimeout(() => setCopiedShareLink(false), 2500);
                                  }}
                                  className={`text-[9.5px] font-extrabold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                                    copiedShareLink
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                  }`}
                                >
                                  {copiedShareLink ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  {copiedShareLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                                </button>
                              </div>

                              {/* Botones de Apertura Directa del Enlace / Portal */}
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setShowStep11PortalModal(true)}
                                  className={`text-[9.5px] text-white font-black py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs ${
                                    qrType === 'reporte'
                                      ? 'bg-sky-600 hover:bg-sky-700'
                                      : 'bg-teal-600 hover:bg-teal-700'
                                  }`}
                                >
                                  <Eye size={11} /> Abrir Formulario
                                </button>
                                <a
                                  href={shareLinkActive}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9.5px] bg-white hover:bg-sky-50 text-sky-800 font-extrabold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-sky-200"
                                >
                                  <ExternalLink size={11} /> Abrir Enlace
                                </a>
                              </div>
                            </div>

                            {showStep11PortalModal && (
                              <Step11PublicPortalModal
                                mode={qrType}
                                companyName={companyName}
                                companyNit={companyNit}
                                companyLogo={companyLogo}
                                initialDriverId={currentEval?.id}
                                initialDriverName={currentEval?.nombre}
                                evaluationsList={evaluacionesComportamiento}
                                onUpdateEvaluations={(updated) => setEvaluacionesComportamiento(updated)}
                                onClose={() => setShowStep11PortalModal(false)}
                              />
                            )}
                          </div>

                          {/* Columna Derecha: Formulario de Creación u Hoja de Detalle de Evaluación */}
                          <div className="lg:col-span-8">
                            {showEvalForm ? (
                              /* Formulario para registrar una nueva evaluación */
                              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm text-xs">
                                <div className="border-b border-gray-100 pb-2">
                                  <h4 className="text-[11px] font-extrabold text-sky-800 uppercase">Nueva Evaluación de Comportamiento</h4>
                                  <p className="text-[10px] text-gray-400">Ingrese los datos para habilitar el registro de comportamiento.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Nombre Completo del Conductor</label>
                                    <input
                                      type="text"
                                      placeholder="ej. Pedro Pablo Gómez"
                                      value={newEvalObj.nombre}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, nombre: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Cédula de Ciudadanía</label>
                                    <input
                                      type="text"
                                      placeholder="ej. CC 80.123.456"
                                      value={newEvalObj.cedula}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, cedula: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Cargo / Función</label>
                                    <input
                                      type="text"
                                      placeholder="ej. Conductor Distribución"
                                      value={newEvalObj.cargo}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, cargo: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Periodo Evaluado</label>
                                    <input
                                      type="text"
                                      value={newEvalObj.periodoEvaluado}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, periodoEvaluado: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Fecha de Registro</label>
                                    <input
                                      type="date"
                                      value={newEvalObj.fechaEvaluacion}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, fechaEvaluacion: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Firma del Evaluador (Texto)</label>
                                    <input
                                      type="text"
                                      value={newEvalObj.firmaEvaluador}
                                      onChange={(e) => setNewEvalObj({ ...newEvalObj, firmaEvaluador: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs font-serif italic text-sky-850"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end border-t border-gray-150 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => setShowEvalForm(false)}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newEvalObj.nombre || !newEvalObj.cedula) {
                                        alert('Por favor ingrese el nombre y la cédula del conductor.');
                                        return;
                                      }
                                      const genId = 'eval-' + Date.now();
                                      const created = {
                                        ...newEvalObj,
                                        id: genId,
                                        infracciones: [],
                                        quejas: []
                                      };
                                      setEvaluacionesComportamiento([...evaluacionesComportamiento, created]);
                                      setSelectedEvalId(genId);
                                      setShowEvalForm(false);
                                    }}
                                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded shadow-sm cursor-pointer"
                                  >
                                    Crear Registro de Comportamiento
                                  </button>
                                </div>
                              </div>
                            ) : currentEval ? (
                              /* Hoja Detallada del Conductor Seleccionado */
                              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5 shadow-sm text-xs">
                                <div className="border-b border-gray-100 pb-3 flex justify-between items-start">
                                  <div>
                                    <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">Registro de Verificación Vial</span>
                                    <h4 className="text-sm font-black text-slate-800 mt-1">{currentEval.nombre}</h4>
                                    <p className="text-[10px] text-gray-500">{currentEval.cargo} — {currentEval.cedula}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-gray-400 font-mono">Periodo Evaluado:</div>
                                    <div className="font-extrabold text-slate-800 text-[11px]">{currentEval.periodoEvaluado}</div>
                                    <div className="text-[9px] text-gray-400 font-mono">Evaluado: {currentEval.fechaEvaluacion}</div>
                                  </div>
                                </div>

                                {/* Semáforo de Comportamiento Seguro */}
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${activeRisk.color}`}>
                                  <div>
                                    <strong className="block text-[11px] font-extrabold uppercase">Calificación de Comportamiento Seguro</strong>
                                    <span className="text-[10px] leading-relaxed">Puntaje acumulado: <strong className="font-bold">{(currentEval.infracciones?.length || 0) + (currentEval.quejas?.length || 0)}</strong> incidentes/reportes en el periodo.</span>
                                  </div>
                                  <div className="text-center font-black shrink-0 px-2 py-1 text-xs uppercase bg-white/60 rounded border border-white/40">
                                    {activeRisk.badge} {activeRisk.label}
                                  </div>
                                </div>

                                {/* I. INFRACCIONES DE TRÁNSITO */}
                                <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50/20">
                                  <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                                    <h5 className="font-extrabold text-slate-700 uppercase text-[10px] flex items-center gap-1">
                                      <AlertTriangle size={12} className="text-red-500" />
                                      <span>Infracciones de Tránsito Cometidas</span>
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => setShowAddInfModal(true)}
                                      className="text-[9px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-black cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Plus size={8} /> Agregar Infracción
                                    </button>
                                  </div>

                                  {(currentEval.infracciones && currentEval.infracciones.length > 0) ? (
                                    <div className="space-y-2">
                                      {currentEval.infracciones.map((inf: any) => (
                                        <div key={inf.id} className="bg-white border border-gray-150 rounded p-2 text-[10px] space-y-1 relative">
                                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingInfractionId(inf.id);
                                                setNewInfraction({
                                                  fecha: inf.fecha || '2026-06-25',
                                                  codigoInfraccion: inf.codigoInfraccion || 'C29 (Exceso de velocidad)',
                                                  comparendoNo: inf.comparendoNo || '',
                                                  descripcion: inf.descripcion || '',
                                                  estado: inf.estado || 'Pendiente',
                                                  puntosAfectados: inf.puntosAfectados || 0
                                                });
                                                setShowAddInfModal(true);
                                              }}
                                              className="text-blue-500 hover:text-blue-700 cursor-pointer"
                                              title="Editar Infracción"
                                            >
                                              <Edit size={10} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = evaluacionesComportamiento.map(ev => {
                                                  if (ev.id === currentEval.id) {
                                                    return {
                                                      ...ev,
                                                      infracciones: ev.infracciones.filter((i: any) => i.id !== inf.id)
                                                    };
                                                  }
                                                  return ev;
                                                });
                                                setEvaluacionesComportamiento(updated);
                                              }}
                                              className="text-red-500 hover:text-red-700 cursor-pointer"
                                              title="Eliminar Infracción"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                          <div className="flex justify-between font-bold text-slate-800">
                                            <span>Comparendo: <span className="font-mono text-sky-800">{inf.comparendoNo || 'N/A'}</span></span>
                                            <span className="text-gray-400 font-mono text-[9px]">{inf.fecha}</span>
                                          </div>
                                          <div className="font-bold text-red-600">{inf.codigoInfraccion}</div>
                                          <div className="text-gray-500">{inf.descripcion}</div>
                                          <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[9px]">
                                            <span className="text-gray-400">Puntos Afectados en Licencia: <strong className="text-slate-800 font-bold">{inf.puntosAfectados} pts</strong></span>
                                            <span className={`px-1 rounded-full font-bold uppercase text-[8px] ${
                                              inf.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                              inf.estado === 'En Apelación' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                              'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>{inf.estado}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-emerald-600 bg-emerald-50/20 border border-dashed border-emerald-100 rounded-lg font-bold text-[10px]">
                                      ✓ No se registran infracciones de tránsito vigentes en este periodo evaluado.
                                    </div>
                                  )}
                                </div>

                                {/* II. QUEJAS DE COMPORTAMIENTO VIAL */}
                                <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50/20">
                                  <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                                    <h5 className="font-extrabold text-slate-700 uppercase text-[10px] flex items-center gap-1">
                                      <Users size={12} className="text-amber-500" />
                                      <span>Quejas y Reportes de Riesgo en Vía</span>
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => setShowAddCompModal(true)}
                                      className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-black cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Plus size={8} /> Agregar Queja
                                    </button>
                                  </div>

                                  {(currentEval.quejas && currentEval.quejas.length > 0) ? (
                                    <div className="space-y-2">
                                      {currentEval.quejas.map((q: any) => (
                                        <div key={q.id} className="bg-white border border-gray-150 rounded p-2 text-[10px] space-y-1 relative">
                                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingComplaintId(q.id);
                                                setNewComplaint({
                                                  fecha: q.fecha || '2026-06-25',
                                                  origen: q.origen || 'Ciudadano (Canal Cómo Conduzco)',
                                                  descripcion: q.descripcion || '',
                                                  nivelRiesgo: q.nivelRiesgo || 'Bajo',
                                                  accionTomada: q.accionTomada || ''
                                                });
                                                setShowAddCompModal(true);
                                              }}
                                              className="text-amber-600 hover:text-amber-800 cursor-pointer"
                                              title="Editar Queja / Reporte"
                                            >
                                              <Edit size={10} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = evaluacionesComportamiento.map(ev => {
                                                  if (ev.id === currentEval.id) {
                                                    return {
                                                      ...ev,
                                                      quejas: ev.quejas.filter((comp: any) => comp.id !== q.id)
                                                    };
                                                  }
                                                  return ev;
                                                });
                                                setEvaluacionesComportamiento(updated);
                                              }}
                                              className="text-red-500 hover:text-red-700 cursor-pointer"
                                              title="Eliminar Queja"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                          <div className="flex justify-between font-bold text-slate-800">
                                            <span className="text-amber-700 font-extrabold">Origen: {q.origen}</span>
                                            <span className="text-gray-400 font-mono text-[9px]">{q.fecha}</span>
                                          </div>
                                          <div className="text-slate-700">{q.descripcion}</div>
                                          <div className="bg-slate-50/80 p-1.5 rounded border border-gray-100 text-[9.5px]">
                                            <strong className="text-slate-600 block">Acción Tomada:</strong> {q.accionTomada}
                                          </div>
                                          <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[9px]">
                                            <span>Riesgo Evaluado: <strong className="text-slate-800 uppercase font-bold">{q.nivelRiesgo}</strong></span>
                                            <span className={`w-2 h-2 rounded-full ${
                                              q.nivelRiesgo === 'Alto' ? 'bg-red-500' :
                                              q.nivelRiesgo === 'Medio' ? 'bg-amber-500' :
                                              'bg-emerald-500'
                                            }`} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-emerald-600 bg-emerald-50/20 border border-dashed border-emerald-100 rounded-lg font-bold text-[10px]">
                                      ✓ No se registran quejas o reportes de comportamientos inseguros en la vía.
                                    </div>
                                  )}
                                </div>

                                {/* OBSERVACIONES GENERALES Y COMPROMISO */}
                                <div className="space-y-3 border-t border-gray-150 pt-3">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Observaciones Generales y Dictamen</label>
                                    <textarea
                                      rows={2}
                                      value={currentEval.observacionesGenerales}
                                      onChange={(e) => {
                                        const updated = evaluacionesComportamiento.map(ev => {
                                          if (ev.id === currentEval.id) {
                                            return { ...ev, observacionesGenerales: e.target.value };
                                          }
                                          return ev;
                                        });
                                        setEvaluacionesComportamiento(updated);
                                      }}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                      placeholder="Escriba el dictamen de comportamiento seguro..."
                                    />
                                  </div>

                                  <div className="flex items-start gap-2 bg-sky-50/40 p-2.5 rounded-lg border border-sky-100">
                                    <input
                                      type="checkbox"
                                      id={`chk-compromiso-${currentEval.id}`}
                                      checked={currentEval.compromisoFirmado}
                                      onChange={(e) => {
                                        const updated = evaluacionesComportamiento.map(ev => {
                                          if (ev.id === currentEval.id) {
                                            return { ...ev, compromisoFirmado: e.target.checked };
                                          }
                                          return ev;
                                        });
                                        setEvaluacionesComportamiento(updated);
                                      }}
                                      className="mt-0.5 rounded border-gray-350 text-sky-600 cursor-pointer"
                                    />
                                    <label htmlFor={`chk-compromiso-${currentEval.id}`} className="text-[10px] leading-snug text-sky-900 cursor-pointer select-none">
                                      <strong className="font-extrabold block">Suscripción de Compromiso Vial</strong>
                                      El conductor y el evaluador declaran que han revisado conjuntamente este reporte de comportamiento seguro y suscriben el compromiso vial formal de mejoramiento y observancia estricta de las normas del PESV.
                                    </label>
                                  </div>

                                  {/* FIRMAS DIGITALES */}
                                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                    {/* Firma del Evaluador */}
                                    <div className="space-y-1.5 border border-gray-100 rounded p-2 bg-gray-50/50">
                                      <div className="text-[9px] text-gray-500 font-bold uppercase">Firma del Evaluador</div>
                                      <div className="flex gap-1.5 items-center">
                                        <input
                                          type="text"
                                          value={currentEval.firmaEvaluadorImg ? 'Imagen cargada' : currentEval.firmaEvaluador}
                                          disabled={!!currentEval.firmaEvaluadorImg}
                                          onChange={(e) => {
                                            const updated = evaluacionesComportamiento.map(ev => {
                                              if (ev.id === currentEval.id) {
                                                return { ...ev, firmaEvaluador: e.target.value };
                                              }
                                              return ev;
                                            });
                                            setEvaluacionesComportamiento(updated);
                                          }}
                                          className="flex-1 p-1 border border-gray-200 rounded text-[10px] font-mono italic text-sky-850"
                                        />
                                        <label className="px-1.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded text-gray-700 text-[9px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-0.5">
                                          <Upload size={10} />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              handleSignatureUploadCallback(e, (base64) => {
                                                const updated = evaluacionesComportamiento.map(ev => {
                                                  if (ev.id === currentEval.id) {
                                                    return { ...ev, firmaEvaluadorImg: base64 };
                                                  }
                                                  return ev;
                                                });
                                                setEvaluacionesComportamiento(updated);
                                              });
                                            }}
                                          />
                                        </label>
                                        {currentEval.firmaEvaluadorImg && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = evaluacionesComportamiento.map(ev => {
                                                if (ev.id === currentEval.id) {
                                                  return { ...ev, firmaEvaluadorImg: null };
                                                }
                                                return ev;
                                              });
                                              setEvaluacionesComportamiento(updated);
                                            }}
                                            className="text-red-500 text-[9px] font-bold hover:underline cursor-pointer"
                                          >
                                            Quitar
                                          </button>
                                        )}
                                      </div>
                                      {currentEval.firmaEvaluadorImg ? (
                                        <img src={currentEval.firmaEvaluadorImg} alt="Evaluador" className="h-6 bg-white border rounded px-1 object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="font-serif italic text-xs text-sky-850 font-bold px-1 select-none">{currentEval.firmaEvaluador}</div>
                                      )}
                                    </div>

                                    {/* Firma del Conductor */}
                                    <div className="space-y-1.5 border border-gray-100 rounded p-2 bg-gray-50/50">
                                      <div className="text-[9px] text-gray-500 font-bold uppercase">Firma del Conductor</div>
                                      <div className="flex gap-1.5 items-center">
                                        <input
                                          type="text"
                                          value={currentEval.firmaConductorImg ? 'Imagen cargada' : currentEval.firmaConductor}
                                          disabled={!!currentEval.firmaConductorImg}
                                          placeholder="ej. Juan Montoya"
                                          onChange={(e) => {
                                            const updated = evaluacionesComportamiento.map(ev => {
                                              if (ev.id === currentEval.id) {
                                                return { ...ev, firmaConductor: e.target.value };
                                              }
                                              return ev;
                                            });
                                            setEvaluacionesComportamiento(updated);
                                          }}
                                          className="flex-1 p-1 border border-gray-200 rounded text-[10px] font-mono italic text-sky-850"
                                        />
                                        <label className="px-1.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded text-gray-700 text-[9px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-0.5">
                                          <Upload size={10} />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              handleSignatureUploadCallback(e, (base64) => {
                                                const updated = evaluacionesComportamiento.map(ev => {
                                                  if (ev.id === currentEval.id) {
                                                    return { ...ev, firmaConductorImg: base64 };
                                                  }
                                                  return ev;
                                                });
                                                setEvaluacionesComportamiento(updated);
                                              });
                                            }}
                                          />
                                        </label>
                                        {currentEval.firmaConductorImg && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = evaluacionesComportamiento.map(ev => {
                                                if (ev.id === currentEval.id) {
                                                  return { ...ev, firmaConductorImg: null };
                                                }
                                                return ev;
                                              });
                                              setEvaluacionesComportamiento(updated);
                                            }}
                                            className="text-red-500 text-[9px] font-bold hover:underline cursor-pointer"
                                          >
                                            Quitar
                                          </button>
                                        )}
                                      </div>
                                      {currentEval.firmaConductorImg ? (
                                        <img src={currentEval.firmaConductorImg} alt="Conductor" className="h-6 bg-white border rounded px-1 object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="font-serif italic text-xs text-sky-850 font-bold px-1 select-none">{currentEval.firmaConductor || 'Pendiente Firma'}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6">
                                <ClipboardList className="mx-auto mb-2 opacity-50" size={32} />
                                <p className="text-xs">Selecciona un conductor de la lista o crea uno nuevo para ver su formato de verificación de comportamiento seguro.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Modales para Agregar Infracción / Queja */}
                        {showAddInfModal && (
                          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 space-y-3 border border-gray-100 text-xs">
                              <div className="border-b border-gray-100 pb-1.5 flex justify-between items-center">
                                <h4 className="text-slate-800 font-extrabold uppercase text-[10px]">
                                  {editingInfractionId ? 'Editar Comparendo / Infracción' : 'Registrar Comparendo / Infracción de Tránsito'}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddInfModal(false);
                                    setEditingInfractionId(null);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-gray-500 font-bold mb-1">Código de Infracción</label>
                                  <select
                                    value={newInfraction.codigoInfraccion}
                                    onChange={(e) => setNewInfraction({ ...newInfraction, codigoInfraccion: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded text-xs cursor-pointer"
                                  >
                                    <option value="C29 (Exceso de velocidad)">C29 (Exceso de velocidad)</option>
                                    <option value="D02 (Semáforo en Rojo/Amarillo)">D02 (No detenerse ante semáforo en rojo)</option>
                                    <option value="C35 (No portar RTM vigente)">C35 (No portar revisión técnico-mecánica)</option>
                                    <option value="C02 (Estacionar en sitio prohibido)">C02 (Estacionar en sitio prohibido)</option>
                                    <option value="B01 (Conducir sin portar licencia)">B01 (Conducir sin portar licencia)</option>
                                    <option value="F (Conducir bajo efectos del alcohol)">F (Estado de embriaguez o alcoholemia)</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Fecha</label>
                                    <input
                                      type="date"
                                      value={newInfraction.fecha}
                                      onChange={(e) => setNewInfraction({ ...newInfraction, fecha: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Comparendo No.</label>
                                    <input
                                      type="text"
                                      placeholder="ej. 11001000..."
                                      value={newInfraction.comparendoNo}
                                      onChange={(e) => setNewInfraction({ ...newInfraction, comparendoNo: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-gray-500 font-bold mb-1">Descripción del Hecho</label>
                                  <textarea
                                    rows={2}
                                    value={newInfraction.descripcion}
                                    onChange={(e) => setNewInfraction({ ...newInfraction, descripcion: e.target.value })}
                                    placeholder="Detalles de la infracción en vía pública..."
                                    className="w-full p-2 border border-gray-200 rounded text-xs"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Estado</label>
                                    <select
                                      value={newInfraction.estado}
                                      onChange={(e) => setNewInfraction({ ...newInfraction, estado: e.target.value as any })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs cursor-pointer"
                                    >
                                      <option value="Pendiente">Pendiente</option>
                                      <option value="Pagada">Pagada</option>
                                      <option value="En Apelación">En Apelación</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Puntos Licencia</label>
                                    <input
                                      type="number"
                                      value={newInfraction.puntosAfectados}
                                      onChange={(e) => setNewInfraction({ ...newInfraction, puntosAfectados: parseInt(e.target.value) || 0 })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddInfModal(false);
                                    setEditingInfractionId(null);
                                  }}
                                  className="px-2.5 py-1.5 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                                >
                                  Cerrar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newInfraction.comparendoNo) {
                                      alert('Por favor ingrese el número de comparendo.');
                                      return;
                                    }
                                    const updated = evaluacionesComportamiento.map(ev => {
                                      if (ev.id === currentEval.id) {
                                        if (editingInfractionId) {
                                          return {
                                            ...ev,
                                            infracciones: ev.infracciones.map((i: any) => i.id === editingInfractionId ? {
                                              ...i,
                                              ...newInfraction
                                            } : i)
                                          };
                                        } else {
                                          return {
                                            ...ev,
                                            infracciones: [...ev.infracciones, { ...newInfraction, id: 'inf-' + Date.now() }]
                                          };
                                        }
                                      }
                                      return ev;
                                    });
                                    setEvaluacionesComportamiento(updated);
                                    setShowAddInfModal(false);
                                    setEditingInfractionId(null);
                                    setNewInfraction({
                                      fecha: '2026-06-25',
                                      codigoInfraccion: 'C29 (Exceso de velocidad)',
                                      comparendoNo: '',
                                      descripcion: '',
                                      estado: 'Pendiente',
                                      puntosAfectados: 0
                                    });
                                  }}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded cursor-pointer transition-all shadow-sm"
                                >
                                  {editingInfractionId ? 'Guardar Cambios' : 'Adicionar Infracción'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {showAddCompModal && (
                          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 space-y-3 border border-gray-100 text-xs">
                              <div className="border-b border-gray-100 pb-1.5 flex justify-between items-center">
                                <h4 className="text-slate-800 font-extrabold uppercase text-[10px]">
                                  {editingComplaintId ? 'Editar Reporte / Queja Vial' : 'Registrar Reporte / Queja Vial'}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddCompModal(false);
                                    setEditingComplaintId(null);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Fecha</label>
                                    <input
                                      type="date"
                                      value={newComplaint.fecha}
                                      onChange={(e) => setNewComplaint({ ...newComplaint, fecha: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-500 font-bold mb-1">Origen del Reporte</label>
                                    <select
                                      value={newComplaint.origen}
                                      onChange={(e) => setNewComplaint({ ...newComplaint, origen: e.target.value as any })}
                                      className="w-full p-2 border border-gray-200 rounded text-xs cursor-pointer"
                                    >
                                      <option value="Ciudadano (Canal Cómo Conduzco)">Ciudadano (Cómo Conduzco)</option>
                                      <option value="Compañero">Compañero</option>
                                      <option value="Supervisor">Supervisor</option>
                                      <option value="Cliente">Cliente</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-gray-500 font-bold mb-1">Conducta Insegura Reportada</label>
                                  <textarea
                                    rows={2}
                                    value={newComplaint.descripcion}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, descripcion: e.target.value })}
                                    placeholder="ej. Adelantamiento en curva prohibida o no uso de casco"
                                    className="w-full p-2 border border-gray-200 rounded text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-500 font-bold mb-1">Acción Correctiva Inmediata</label>
                                  <textarea
                                    rows={2}
                                    value={newComplaint.accionTomada}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, accionTomada: e.target.value })}
                                    placeholder="ej. Llamado de atención individual y compromiso de no repetición"
                                    className="w-full p-2 border border-gray-200 rounded text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-500 font-bold mb-1">Nivel de Riesgo Vial</label>
                                  <select
                                    value={newComplaint.nivelRiesgo}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, nivelRiesgo: e.target.value as any })}
                                    className="w-full p-2 border border-gray-200 rounded text-xs cursor-pointer"
                                  >
                                    <option value="Bajo">Bajo</option>
                                    <option value="Medio">Medio</option>
                                    <option value="Alto">Alto</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddCompModal(false);
                                    setEditingComplaintId(null);
                                  }}
                                  className="px-2.5 py-1.5 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                                >
                                  Cerrar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newComplaint.descripcion || !newComplaint.accionTomada) {
                                      alert('Por favor complete la descripción y la acción correctiva.');
                                      return;
                                    }
                                    const updated = evaluacionesComportamiento.map(ev => {
                                      if (ev.id === currentEval.id) {
                                        if (editingComplaintId) {
                                          return {
                                            ...ev,
                                            quejas: ev.quejas.map((q: any) => q.id === editingComplaintId ? {
                                              ...q,
                                              ...newComplaint
                                            } : q)
                                          };
                                        } else {
                                          return {
                                            ...ev,
                                            quejas: [...ev.quejas, { ...newComplaint, id: 'q-' + Date.now() }]
                                          };
                                        }
                                      }
                                      return ev;
                                    });
                                    setEvaluacionesComportamiento(updated);
                                    setShowAddCompModal(false);
                                    setEditingComplaintId(null);
                                    setNewComplaint({
                                      fecha: '2026-06-25',
                                      origen: 'Ciudadano (Canal Cómo Conduzco)',
                                      descripcion: '',
                                      nivelRiesgo: 'Bajo',
                                      accionTomada: ''
                                    });
                                  }}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded cursor-pointer transition-all shadow-sm"
                                >
                                  {editingComplaintId ? 'Guardar Cambios' : 'Adicionar Reporte'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DEMO PASO 12: Plan de preparación y respuesta ante emergencias viales */}
                  {activeStep.id === 12 && (
                    <Step12EmergencyModule
                      config={config}
                      companyName={companyName}
                      companyNit={companyNit}
                      companyLogo={companyLogo}
                    />
                  )}

                  {/* DEMO PASO 14: Vías seguras administradas por la organización */}
                  {activeStep.id === 14 && (
                    <Step14SafeRoadsModule
                      config={config}
                      companyName={companyName}
                      companyNit={companyNit}
                      companyLogo={companyLogo}
                    />
                  )}

                  {/* DEMO PASO 15: Planificación de desplazamientos laborales (alineado con Paso 5) */}
                  {activeStep.id === 15 && (
                    <Step15TripPlanningModule
                      config={config}
                      companyName={companyName}
                      companyNit={companyNit}
                      companyLogo={companyLogo}
                      frequentRoutesPaso5={rutasList}
                      onSyncRouteToPaso5={(newR) => {
                        setRutasList(prev => [...prev, newR]);
                      }}
                      onNavigateToPaso5={() => {
                        const step5 = PESV_STEPS.find(s => s.id === 5);
                        if (step5) setActiveStep(step5);
                      }}
                    />
                  )}

                  {/* DEMO PASO 16 Y PASO 17: Inspección de vehículos y Mantenimiento (Conectado a Aplicativo Externo) */}
                  {(activeStep.id === 16 || activeStep.id === 17) && (
                    <Step16And17MaintenanceModule
                      stepId={activeStep.id as 16 | 17}
                      config={config}
                      companyName={companyName}
                      companyNit={companyNit}
                      companyLogo={companyLogo}
                      onNavigateToStep={(stepId) => {
                        const target = PESV_STEPS.find(s => s.id === stepId);
                        if (target) setActiveStep(target);
                      }}
                      onNavigateToIndicators={() => {
                        const step20 = PESV_STEPS.find(s => s.id === 20);
                        if (step20) setActiveStep(step20);
                      }}
                    />
                  )}

                  {/* DEMO PASO 20: Indicadores y reporte de autogestión PESV */}
                  {activeStep.id === 20 && (
                    <Step20IndicatorsModule
                      config={config}
                      companyName={companyName}
                      companyLogo={companyLogo}
                      companyNit={companyNit}
                      repLegal={repLegal}
                      leaderName={leaderName}
                      repSignatureImg1={repSignatureImg1}
                      leaderSignatureImg={leaderSignatureImg}
                      onNavigateToStep={(stepId) => {
                        const target = PESV_STEPS.find(s => s.id === stepId);
                        if (target) setActiveStep(target);
                      }}
                    />
                  )}

                  {/* MENSAJE PARA OTROS PASOS */}
                  {activeStep.id !== 1 && activeStep.id !== 2 && activeStep.id !== 3 && activeStep.id !== 4 && activeStep.id !== 5 && activeStep.id !== 6 && activeStep.id !== 7 && activeStep.id !== 8 && activeStep.id !== 9 && activeStep.id !== 10 && activeStep.id !== 11 && activeStep.id !== 12 && activeStep.id !== 14 && activeStep.id !== 15 && activeStep.id !== 16 && activeStep.id !== 17 && activeStep.id !== 20 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 italic bg-white p-3 rounded-lg border border-gray-100 justify-center">
                      <Sparkles size={14} className="text-emerald-500" />
                      <span>El sistema tiene configurado el flujo automatizado para este paso. Explora las pestañas de Integraciones o Indicadores para ver la lógica ejecutándose en vivo.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Niveles Requeridos */}
            <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Niveles obligatorios:</span>
              <div className="flex gap-1.5">
                {['BÁSICO', 'ESTÁNDAR', 'AVANZADO'].map((lvl) => {
                  const isReq = activeStep.levels.includes(lvl as PESVLevel);
                  return (
                    <span
                      key={lvl}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isReq
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-400 border-gray-100 line-through opacity-60'
                      }`}
                    >
                      {lvl}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
            <ClipboardList className="mb-3 opacity-40" size={48} />
            <h3 className="text-base font-bold text-gray-800">Selecciona un Paso</h3>
            <p className="text-xs text-gray-500 mt-1">Utiliza la lista de la izquierda para explorar los requisitos de la Resolución 40595.</p>
          </div>
        )}
      </div>
    </div>
  );
}

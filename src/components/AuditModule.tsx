/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CompanyConfig, PESVLevel } from '../types';
import { PESV_STEPS } from '../data';
import {
  ClipboardCheck,
  Download,
  Award,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Save,
  FileText,
  Check,
  ShieldCheck,
  PenTool,
  Sparkles,
  Calendar,
  Plus,
  Users,
  Search,
  Layers,
  Eye,
  Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export type StepRatingType = 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE' | 'NO_APLICA';
export type FindingCategory =
  | 'CONFORMIDAD'
  | 'FORTALEZA'
  | 'OPORTUNIDAD_MEJORA'
  | 'NO_CONFORMIDAD_MENOR'
  | 'NO_CONFORMIDAD_MAYOR';

export interface AuditScheduleSession {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  fasePasos: string;
  procesoArea: string;
  auditorAsignado: string;
  auditadoCargo: string;
  modalidad: 'Presencial' | 'Virtual / Documental' | 'Inspección en Patio / Vía';
  estado: 'Programada' | 'Ejecutada';
}

export interface AuditPlanMetadata {
  planCode: string;
  reportCode: string;
  auditType: 'Auditoría Interna Anual PESV' | 'Auditoría Externa / Segunda Parte' | 'Auditoría Extraordinaria';
  openingDate: string;
  closingDate: string;
  auditObjective: string;
  auditScope: string;
  auditCriteria: string;
  supportAuditors: string;
  repLegalName: string;
  pesvLeaderName: string;
  executiveSummary: string;
  strengthsSummary: string;
  conclusionsAndRecommendations: string;
}

interface AuditModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
  repLegal?: string;
  leaderName?: string;
  embeddedInStep22?: boolean;
}

const DEFAULT_SCHEDULE_SESSIONS: AuditScheduleSession[] = [
  {
    id: 'ses-1',
    fecha: '2026-06-24',
    horaInicio: '08:00',
    horaFin: '10:30',
    fasePasos: 'Fase 1: Planificación del PESV (Pasos 1 al 8)',
    procesoArea: 'Alta Dirección, Comité de Seguridad Vial y Coordinación SST/PESV',
    auditorAsignado: 'Auditor Líder PESV',
    auditadoCargo: 'Representante Legal y Líder del PESV',
    modalidad: 'Presencial',
    estado: 'Ejecutada'
  },
  {
    id: 'ses-2',
    fecha: '2026-06-24',
    horaInicio: '10:45',
    horaFin: '13:00',
    fasePasos: 'Fase 2: Implementación y Ejecución (Pasos 9 al 15)',
    procesoArea: 'Talento Humano, Formación Vial, Emergencias, Rutas y Vías Seguras',
    auditorAsignado: 'Auditor Líder PESV',
    auditadoCargo: 'Coordinador HSEQ / Jefe de Tráfico y Operaciones',
    modalidad: 'Virtual / Documental',
    estado: 'Ejecutada'
  },
  {
    id: 'ses-3',
    fecha: '2026-06-25',
    horaInicio: '08:00',
    horaFin: '11:30',
    fasePasos: 'Fase 2: Inspección, Mantenimiento, Cambio y Archivo (Pasos 16 al 19)',
    procesoArea: 'Mantenimiento de Flota, Patio de Operaciones y Gestión de Contratistas',
    auditorAsignado: 'Auditor Líder PESV',
    auditadoCargo: 'Jefe de Mantenimiento y Compras / Contratación',
    modalidad: 'Inspección en Patio / Vía',
    estado: 'Ejecutada'
  },
  {
    id: 'ses-4',
    fecha: '2026-06-25',
    horaInicio: '14:00',
    horaFin: '17:00',
    fasePasos: 'Fase 3: Seguimiento (Pasos 20 al 22) y Fase 4: Mejora Continua (Pasos 23 al 24)',
    procesoArea: 'Indicadores PESV, Siniestralidad SST, Acciones ACPM y Comunicación Vial',
    auditorAsignado: 'Auditor Líder PESV',
    auditadoCargo: 'Líder del PESV y Comité de Seguridad Vial',
    modalidad: 'Presencial',
    estado: 'Ejecutada'
  }
];

export default function AuditModule({
  config,
  companyName: propCompanyName,
  companyNit = '901.452.883-1',
  companyLogo = '',
  repLegal = 'Ing. Diana Patricia Osorio',
  leaderName = 'Coordinador Líder PESV',
  embeddedInStep22 = false
}: AuditModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'VERIFICACION_24' | 'PLANIFICACION' | 'INFORME'>('VERIFICACION_24');

  // Filter mode: 'ALL_24' shows all 24 steps regardless of level, or filter by level
  const [verificationScope, setVerificationScope] = useState<'ALL_24' | PESVLevel>('ALL_24');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [searchStepQuery, setSearchStepQuery] = useState<string>('');

  const [auditLevel, setAuditLevel] = useState<PESVLevel>(() => {
    const saved = localStorage.getItem('pesv_audit_level');
    return (saved as PESVLevel) || config.nivelCalculado || 'AVANZADO';
  });

  useEffect(() => {
    if (!localStorage.getItem('pesv_audit_level')) {
      setAuditLevel(config.nivelCalculado);
    }
  }, [config.nivelCalculado]);

  const [companyName, setCompanyName] = useState<string>(() => {
    return propCompanyName || localStorage.getItem('pesv_audit_company') || 'Transportes Integrados de Colombia S.A.S.';
  });

  useEffect(() => {
    if (propCompanyName && propCompanyName !== 'Empresa Principal') {
      setCompanyName(propCompanyName);
    }
  }, [propCompanyName]);

  const [auditorName, setAuditorName] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_auditor') || 'Dra. Sandra Milena Gómez';
  });
  const [auditorCedula, setAuditorCedula] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_cedula') || 'CC 1.017.342.551';
  });
  const [auditorLicense, setAuditorLicense] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_license') || 'SST-2025-99882-COL';
  });
  const [auditDate, setAuditDate] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_date') || '2026-06-25';
  });

  // Plan & Report Metadata
  const [planMeta, setPlanMeta] = useState<AuditPlanMetadata>(() => {
    const saved = localStorage.getItem('pesv_audit_plan_meta');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      planCode: 'PLAN-AUD-PESV-2026-01',
      reportCode: 'INF-AUD-PESV-2026-01',
      auditType: 'Auditoría Interna Anual PESV',
      openingDate: '2026-06-24',
      closingDate: '2026-06-25',
      auditObjective:
        'Verificar el grado de conformidad, implementación y eficacia de los 24 pasos y las 4 fases del Plan Estratégico de Seguridad Vial (PESV) conforme a la metodología de la Resolución 40595 de 2022.',
      auditScope:
        'Abarca todos los procesos estratégicos, misionales y de apoyo, el 100% de la flota vehicular propia y contratada, conductores y las 4 fases del ciclo PHVA (Pasos 1 al 24).',
      auditCriteria:
        'Resolución 40595 de 2022 del Ministerio de Transporte, Ley 1503 de 2011, Decreto 1079 de 2015, Decreto 1252 de 2021 y Políticas Internas de Seguridad Vial.',
      supportAuditors: 'Ing. Carlos Andrés Mejía (Auditor Interno HSEQ)',
      repLegalName: repLegal,
      pesvLeaderName: leaderName,
      executiveSummary:
        'Durante el ejercicio de auditoría interna anual se verificaron las evidencias documentales, operativas y tecnológicas de los 24 pasos del PESV distribuidos en las 4 fases (Planificación, Implementación, Seguimiento y Mejora Continua), evidenciando un compromiso activo de la Alta Dirección y del Comité de Seguridad Vial.',
      strengthsSummary:
        '1. Integración tecnológica con aplicativos externos para el Plan de Formación (Paso 10), Inspección y Mantenimiento (Pasos 16 y 17) e Indicadores de Siniestralidad SST (Paso 21).\n2. Trazabilidad documental y formatos estandarizados para Gestión del Cambio (Paso 18), Mejora Continua ACPM (Paso 23) y Comunicación Vial (Paso 24).',
      conclusionsAndRecommendations:
        'Se recomienda mantener el seguimiento trimestral en el Comité de Seguridad Vial a las acciones preventivas y correctivas abiertas en el Paso 23 y continuar fortaleciendo la cultura de reporte preventivo de condiciones inseguras en ruta del Paso 24.'
    };
  });

  // Schedule sessions
  const [scheduleSessions, setScheduleSessions] = useState<AuditScheduleSession[]>(() => {
    const saved = localStorage.getItem('pesv_audit_schedule_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_SCHEDULE_SESSIONS;
  });

  // Step ratings across all 24 steps
  const [ratings, setRatings] = useState<Record<number, StepRatingType>>(() => {
    const saved = localStorage.getItem('pesv_audit_ratings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial: Record<number, StepRatingType> = {};
    PESV_STEPS.forEach((s) => {
      initial[s.id] = s.completed ? 'CUMPLE' : 'PARCIAL';
    });
    return initial;
  });

  // Step finding category
  const [findingTypes, setFindingTypes] = useState<Record<number, FindingCategory>>(() => {
    const saved = localStorage.getItem('pesv_audit_finding_types');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial: Record<number, FindingCategory> = {};
    PESV_STEPS.forEach((s) => {
      initial[s.id] = s.completed ? 'CONFORMIDAD' : 'OPORTUNIDAD_MEJORA';
    });
    return initial;
  });

  // Step evidence / observations
  const [observations, setObservations] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('pesv_audit_observations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial: Record<number, string> = {};
    PESV_STEPS.forEach((s) => {
      initial[s.id] = s.completed
        ? `Evidencia verificada conforme a la Resolución 40595 de 2022 (${s.automationSummary}).`
        : 'En proceso de consolidación documental y operativa; se vincula seguimiento en plan de mejora continua.';
    });
    return initial;
  });

  const [signature, setSignature] = useState<string | undefined>(() => {
    return localStorage.getItem('pesv_audit_signature') || undefined;
  });

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [newSession, setNewSession] = useState<Omit<AuditScheduleSession, 'id'>>({
    fecha: auditDate,
    horaInicio: '08:00',
    horaFin: '10:00',
    fasePasos: 'Fase 1: Planificación (Pasos 1 al 8)',
    procesoArea: '',
    auditorAsignado: auditorName,
    auditadoCargo: leaderName,
    modalidad: 'Presencial',
    estado: 'Programada'
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Subscribe to Firestore
  useEffect(() => {
    const docKey = `step22_audit_24steps_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const unsub = subscribeToSystemSetting(docKey, (cloudData) => {
      if (cloudData) {
        if (cloudData.auditorName) setAuditorName(cloudData.auditorName);
        if (cloudData.auditorCedula) setAuditorCedula(cloudData.auditorCedula);
        if (cloudData.auditorLicense) setAuditorLicense(cloudData.auditorLicense);
        if (cloudData.auditDate) setAuditDate(cloudData.auditDate);
        if (cloudData.planMeta) setPlanMeta(cloudData.planMeta);
        if (Array.isArray(cloudData.scheduleSessions)) setScheduleSessions(cloudData.scheduleSessions);
        if (cloudData.ratings) setRatings(cloudData.ratings);
        if (cloudData.findingTypes) setFindingTypes(cloudData.findingTypes);
        if (cloudData.observations) setObservations(cloudData.observations);
        if (cloudData.signature !== undefined) setSignature(cloudData.signature);
      }
    });
    return () => unsub();
  }, [companyNit]);

  // Persist to localStorage & Firestore
  useEffect(() => {
    localStorage.setItem('pesv_audit_level', auditLevel);
    localStorage.setItem('pesv_audit_company', companyName);
    localStorage.setItem('pesv_audit_auditor', auditorName);
    localStorage.setItem('pesv_audit_cedula', auditorCedula);
    localStorage.setItem('pesv_audit_license', auditorLicense);
    localStorage.setItem('pesv_audit_date', auditDate);
    localStorage.setItem('pesv_audit_plan_meta', JSON.stringify(planMeta));
    localStorage.setItem('pesv_audit_schedule_sessions', JSON.stringify(scheduleSessions));
    localStorage.setItem('pesv_audit_ratings', JSON.stringify(ratings));
    localStorage.setItem('pesv_audit_finding_types', JSON.stringify(findingTypes));
    localStorage.setItem('pesv_audit_observations', JSON.stringify(observations));
    if (signature) {
      localStorage.setItem('pesv_audit_signature', signature);
    } else {
      localStorage.removeItem('pesv_audit_signature');
    }

    const docKey = `step22_audit_24steps_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`;
    saveSystemSetting(docKey, {
      auditLevel,
      companyName,
      auditorName,
      auditorCedula,
      auditorLicense,
      auditDate,
      planMeta,
      scheduleSessions,
      ratings,
      findingTypes,
      observations,
      signature: signature || null,
      updatedAt: new Date().toISOString()
    }).catch(() => {});
  }, [
    auditLevel,
    companyName,
    auditorName,
    auditorCedula,
    auditorLicense,
    auditDate,
    planMeta,
    scheduleSessions,
    ratings,
    findingTypes,
    observations,
    signature,
    companyNit
  ]);

  // Steps to evaluate based on selected scope
  const stepsInScope =
    verificationScope === 'ALL_24'
      ? PESV_STEPS
      : PESV_STEPS.filter((step) => step.levels.includes(verificationScope));

  const visibleSteps = stepsInScope.filter((step) => {
    const matchesPhase = selectedPhaseFilter === 'ALL' || step.phase === selectedPhaseFilter;
    const matchesSearch =
      !searchStepQuery.trim() ||
      step.title.toLowerCase().includes(searchStepQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchStepQuery.toLowerCase()) ||
      String(step.id) === searchStepQuery.trim();
    return matchesPhase && matchesSearch;
  });

  const getRatingValue = (r?: StepRatingType) => {
    if (r === 'CUMPLE') return 100;
    if (r === 'PARCIAL') return 50;
    return 0;
  };

  // Exclude NO_APLICA from denominator
  const evaluableSteps = stepsInScope.filter((step) => ratings[step.id] !== 'NO_APLICA');
  const totalStepsCount = evaluableSteps.length;
  const gradedStepsCount = stepsInScope.filter((step) => ratings[step.id] !== undefined).length;

  const totalScore =
    totalStepsCount > 0
      ? evaluableSteps.reduce((acc, step) => acc + getRatingValue(ratings[step.id]), 0) / totalStepsCount
      : 0;

  // Phase scores (Fase 1, Fase 2, Fase 3, Fase 4)
  const getPhaseStats = (phaseNum: 1 | 2 | 3 | 4) => {
    const phaseSteps = PESV_STEPS.filter((s) => s.phase === phaseNum && ratings[s.id] !== 'NO_APLICA');
    if (phaseSteps.length === 0) return { count: 0, score: 100 };
    const sum = phaseSteps.reduce((acc, s) => acc + getRatingValue(ratings[s.id]), 0);
    return { count: phaseSteps.length, score: Math.round(sum / phaseSteps.length) };
  };

  const phase1Stats = getPhaseStats(1);
  const phase2Stats = getPhaseStats(2);
  const phase3Stats = getPhaseStats(3);
  const phase4Stats = getPhaseStats(4);

  // Findings counters across the 24 steps
  const ncMayoresCount = PESV_STEPS.filter((s) => findingTypes[s.id] === 'NO_CONFORMIDAD_MAYOR').length;
  const ncMenoresCount = PESV_STEPS.filter((s) => findingTypes[s.id] === 'NO_CONFORMIDAD_MENOR').length;
  const oportunidadesCount = PESV_STEPS.filter((s) => findingTypes[s.id] === 'OPORTUNIDAD_MEJORA').length;
  const fortalezasCount = PESV_STEPS.filter(
    (s) => findingTypes[s.id] === 'FORTALEZA' || findingTypes[s.id] === 'CONFORMIDAD'
  ).length;

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: 'SOBRESALIENTE (CUMPLE PESV)',
        bgColor: 'bg-emerald-100 border-emerald-200 text-emerald-800',
        icon: <ShieldCheck className="text-emerald-600" size={18} />,
        textColor: 'text-emerald-600'
      };
    } else if (score >= 60) {
      return {
        label: 'ACEPTABLE (CON PLAN DE MEJORA PHVA)',
        bgColor: 'bg-amber-100 border-amber-200 text-amber-800',
        icon: <AlertTriangle className="text-amber-600" size={18} />,
        textColor: 'text-amber-600'
      };
    } else {
      return {
        label: 'CRÍTICO (REQUIERE INTERVENCIÓN INMEDIATA)',
        bgColor: 'bg-red-100 border-red-200 text-red-800',
        icon: <ShieldAlert className="text-red-600" size={18} />,
        textColor: 'text-red-600'
      };
    }
  };

  const badge = getScoreBadge(totalScore);

  const handleMarkAllComplies = () => {
    const newRatings: Record<number, StepRatingType> = {};
    const newFindings: Record<number, FindingCategory> = {};
    const newObs: Record<number, string> = { ...observations };
    PESV_STEPS.forEach((step) => {
      newRatings[step.id] = 'CUMPLE';
      newFindings[step.id] = 'CONFORMIDAD';
      if (!newObs[step.id]) {
        newObs[step.id] = 'Evidencia revisada y validada conforme a la guía metodológica de la Resol. 40595.';
      }
    });
    setRatings(newRatings);
    setFindingTypes(newFindings);
    setObservations(newObs);
  };

  const handleResetAudit = () => {
    const emptyRatings: Record<number, StepRatingType> = {};
    PESV_STEPS.forEach((s) => {
      emptyRatings[s.id] = 'PARCIAL';
    });
    setRatings(emptyRatings);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.procesoArea.trim()) return;
    setScheduleSessions((prev) => [...prev, { ...newSession, id: `ses-${Date.now()}` }]);
    setShowSessionModal(false);
  };

  const handleDeleteSession = (id: string) => {
    setScheduleSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // Signature pad handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
    setIsSignatureModalOpen(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(undefined);
  };

  // PDF 1: Descargar Plan de Auditoría Interna (Paso 22)
  const handleDownloadAuditPlanPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, pageW - 28, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PLAN Y PROGRAMA DE AUDITORÍA ANUAL DEL PESV (PASO 22)', pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text(`${companyName.toUpperCase()} — NIT: ${companyNit}`, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Código Plan: ${planMeta.planCode} | Tipo: ${planMeta.auditType} | Fecha Apertura: ${planMeta.openingDate} | Cierre: ${planMeta.closingDate}`,
      pageW / 2,
      y,
      { align: 'center' }
    );

    y = 44;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1. FICHA TÉCNICA DE PLANIFICACIÓN DE LA AUDITORÍA', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`• Auditor Líder: ${auditorName} (${auditorCedula}) - Licencia SST: ${auditorLicense}`, 16, y);
    y += 4.5;
    doc.text(`• Equipo Auditor de Apoyo: ${planMeta.supportAuditors}`, 16, y);
    y += 4.5;
    doc.text(`• Nivel PESV de la Organización: ${config.nivelCalculado} (Verificación integral de los 24 Pasos / 4 Fases)`, 16, y);
    y += 6;

    const objLines = doc.splitTextToSize(`Objetivo de la Auditoría: ${planMeta.auditObjective}`, pageW - 32);
    doc.text(objLines, 16, y);
    y += objLines.length * 4.2 + 2;

    const scopeLines = doc.splitTextToSize(`Alcance de la Auditoría: ${planMeta.auditScope}`, pageW - 32);
    doc.text(scopeLines, 16, y);
    y += scopeLines.length * 4.2 + 2;

    const critLines = doc.splitTextToSize(`Criterios Normativos: ${planMeta.auditCriteria}`, pageW - 32);
    doc.text(critLines, 16, y);
    y += critLines.length * 4.2 + 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. CRONOGRAMA Y AGENDA DE SESIONES DE AUDITORÍA', 14, y);
    y += 6;

    scheduleSessions.forEach((ses, idx) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageW - 28, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `Sesión ${idx + 1}: ${ses.fecha} (${ses.horaInicio} - ${ses.horaFin}) | Modalidad: ${ses.modalidad} | Estado: ${ses.estado}`,
        16,
        y
      );
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Fase y Pasos Evaluados: ${ses.fasePasos}`, 16, y);
      y += 4;
      doc.text(`Proceso / Área Auditada: ${ses.procesoArea}`, 16, y);
      y += 4;
      doc.text(`Auditor: ${ses.auditorAsignado}   |   Auditado: ${ses.auditadoCargo}`, 16, y);
      y += 6;
    });

    y += 10;
    if (y > 235) {
      doc.addPage();
      y = 30;
    }
    doc.setDrawColor(148, 163, 184);
    doc.line(25, y + 12, 95, y + 12);
    doc.line(115, y + 12, 185, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(auditorName, 60, y + 17, { align: 'center' });
    doc.text(planMeta.pesvLeaderName, 150, y + 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Auditor Líder PESV - Lic. ${auditorLicense}`, 60, y + 21, { align: 'center' });
    doc.text('Líder del Diseño e Implementación del PESV', 150, y + 21, { align: 'center' });

    doc.save(`Plan_Auditoria_Anual_PESV_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  // PDF 2: Descargar Informe Oficial de Auditoría Anual con los 24 Pasos
  const handleDownloadReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text('INFORME OFICIAL DE AUDITORÍA INTERNA ANUAL PESV (PASO 22)', 12, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(
      `VERIFICACIÓN DE LOS 24 PASOS Y 4 FASES - RESOLUCIÓN 40595 DE 2022 | CÓDIGO: ${planMeta.reportCode}`,
      12,
      17
    );

    if (companyLogo && companyLogo.startsWith('data:image/')) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.rect(pageW - 36, 2, 24, 19, 'F');
        doc.addImage(companyLogo, pageW - 35, 3, 22, 17, undefined, 'FAST');
      } catch (e) {}
    }

    // Metadata box
    doc.setFillColor(248, 250, 252);
    doc.rect(12, 28, pageW - 24, 32, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(12, 28, pageW - 24, 32, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('1. DATOS DE CONTROL DE LA AUDITORÍA:', 15, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Empresa Auditada: ${companyName}`, 15, 40);
    doc.text(`NIT: ${companyNit}`, 15, 45);
    doc.text(`Auditor Líder: ${auditorName} (${auditorCedula})`, 15, 50);
    doc.text(`Licencia SST: ${auditorLicense}`, 15, 55);

    doc.text(`Fecha Informe: ${auditDate}`, 115, 40);
    doc.text(`Nivel PESV Organización: ${config.nivelCalculado}`, 115, 45);
    doc.text(`Pasos Evaluados: 24 Pasos Normativos (4 Fases)`, 115, 50);
    doc.text(`Hallazgos: ${ncMayoresCount} NC Mayor | ${ncMenoresCount} NC Menor | ${oportunidadesCount} OM`, 115, 55);

    // Score Summary Box
    doc.setFillColor(236, 253, 245);
    doc.rect(12, 64, pageW - 24, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70);
    doc.text(`CUMPLIMIENTO GLOBAL DEL PESV: ${totalScore.toFixed(1)}% — ${badge.label}`, 15, 71);
    doc.setFontSize(8);
    doc.text(
      `Fase 1 (Planear): ${phase1Stats.score}%   |   Fase 2 (Hacer): ${phase2Stats.score}%   |   Fase 3 (Verificar): ${phase3Stats.score}%   |   Fase 4 (Actuar): ${phase4Stats.score}%`,
      15,
      78
    );

    let currentY = 89;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('2. RESUMEN EJECUTIVO Y CONCLUSIONES DE AUDITORÍA:', 12, currentY);
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const execLines = doc.splitTextToSize(planMeta.executiveSummary, pageW - 24);
    doc.text(execLines, 12, currentY);
    currentY += execLines.length * 3.8 + 4;

    // Table Header for the 24 steps
    doc.setFillColor(15, 23, 42);
    doc.rect(12, currentY, pageW - 24, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PASO NORMATIVO (24 PASOS RESOLUCIÓN 40595 DE 2022)', 15, currentY + 4.8);
    doc.text('TIPO HALLAZGO', 132, currentY + 4.8);
    doc.text('DICTAMEN', 175, currentY + 4.8);

    currentY += 11;

    PESV_STEPS.forEach((step, index) => {
      if (currentY > 250) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(12, 14, pageW - 24, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('PASO NORMATIVO (24 PASOS RESOLUCIÓN 40595 DE 2022)', 15, 18.8);
        doc.text('TIPO HALLAZGO', 132, 18.8);
        doc.text('DICTAMEN', 175, 18.8);
        currentY = 26;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currentY - 4, pageW - 24, 11, 'F');
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.text(`Paso ${step.id} (Fase ${step.phase}): ${step.title}`, 14, currentY);

      const fType = (findingTypes[step.id] || 'CONFORMIDAD').replace(/_/g, ' ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(fType, 132, currentY);

      const rating = ratings[step.id] || 'NO_CUMPLE';
      let ratingLabel = 'NO CUMPLE (0%)';
      if (rating === 'CUMPLE') ratingLabel = 'CUMPLE (100%)';
      if (rating === 'PARCIAL') ratingLabel = 'PARCIAL (50%)';
      if (rating === 'NO_APLICA') ratingLabel = 'NO APLICA';

      doc.setFont('helvetica', 'bold');
      doc.text(ratingLabel, 175, currentY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const obsText = observations[step.id] || 'Sin observaciones registradas.';
      const splitObs = doc.splitTextToSize(`Evidencia / Hallazgo: ${obsText}`, 115);
      doc.text(splitObs[0] || '', 14, currentY + 4);

      currentY += 11;
    });

    if (currentY > 225) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY += 6;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('3. RECOMENDACIONES Y COMPROMISOS DE MEJORA CONTINUA:', 12, currentY);
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const recLines = doc.splitTextToSize(planMeta.conclusionsAndRecommendations, pageW - 24);
    doc.text(recLines, 12, currentY);
    currentY += recLines.length * 4 + 16;

    doc.setDrawColor(100, 116, 139);
    doc.line(20, currentY, 95, currentY);
    doc.line(115, currentY, 190, currentY);

    if (signature) {
      try {
        doc.addImage(signature, 'PNG', 35, currentY - 16, 42, 14);
      } catch (err) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(auditorName, 57.5, currentY + 5, { align: 'center' });
    doc.text(planMeta.repLegalName, 152.5, currentY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Auditor Líder PESV | Lic. SST: ${auditorLicense}`, 57.5, currentY + 9, { align: 'center' });
    doc.text('Representante Legal / Alta Dirección', 152.5, currentY + 9, { align: 'center' });

    doc.save(`Informe_Auditoria_Anual_24Pasos_PESV_${auditDate}.pdf`);
  };

  return (
    <div className="space-y-6" id="audit-module-root">
      {/* Cabecera Principal del Módulo Paso 22 */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Fase 3: Seguimiento por la Organización • Paso 22
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/15">
              Verificación Integral de los 24 Pasos (4 Fases PHVA)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 mt-1">
            <ClipboardCheck size={20} className="text-emerald-400" />
            Paso 22. Auditoría Anual Interna del PESV (Planificación, Verificación 24 Pasos e Informe)
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Planifique el programa de auditoría interna, evalúe el cumplimiento de los <strong>24 pasos normativos de la Resolución 40595 de 2022</strong> y genere el <strong>Informe Oficial de Auditoría Anual</strong> con dictamen por fase, clasificación de hallazgos y firmas digitales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleMarkAllComplies}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Check size={14} /> Aprobar 24 Pasos (100%)
          </button>
          <button
            type="button"
            onClick={handleDownloadAuditPlanPDF}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Calendar size={14} /> PDF Plan Auditoría
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-emerald-50 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Download size={14} /> PDF Informe Oficial
          </button>
        </div>
      </div>

      {/* Tarjetas de Cumplimiento por las 4 Fases y Puntaje Global */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">Puntaje Global PESV</span>
          <span className="text-2xl font-black text-emerald-950 mt-0.5 block">{totalScore.toFixed(1)}%</span>
          <span className="text-[10px] text-emerald-700 font-bold">{gradedStepsCount} de {totalStepsCount} pasos evaluados</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20">
          <span className="text-[10px] font-bold uppercase text-blue-700 block">Fase 1: Planear (1-8)</span>
          <span className="text-xl font-black text-blue-950 mt-0.5 block">{phase1Stats.score}%</span>
          <span className="text-[10px] text-blue-600 font-semibold">{phase1Stats.count} pasos verificados</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Fase 2: Hacer (9-19)</span>
          <span className="text-xl font-black text-emerald-950 mt-0.5 block">{phase2Stats.score}%</span>
          <span className="text-[10px] text-emerald-600 font-semibold">{phase2Stats.count} pasos verificados</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase text-indigo-700 block">Fase 3: Verificar (20-22)</span>
          <span className="text-xl font-black text-indigo-950 mt-0.5 block">{phase3Stats.score}%</span>
          <span className="text-[10px] text-indigo-600 font-semibold">{phase3Stats.count} pasos verificados</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase text-amber-800 block">Fase 4: Actuar (23-24)</span>
          <span className="text-xl font-black text-amber-950 mt-0.5 block">{phase4Stats.score}%</span>
          <span className="text-[10px] text-amber-700 font-semibold">{phase4Stats.count} pasos verificados</span>
        </div>
      </div>

      {/* Pestañas Internas del Módulo de Auditoría (Paso 22) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('VERIFICACION_24')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'VERIFICACION_24'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ClipboardCheck size={15} /> 1. Verificación de los 24 Pasos (Lista de Chequeo)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('PLANIFICACION')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'PLANIFICACION'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Calendar size={15} /> 2. Planificación y Cronograma de Auditoría ({scheduleSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('INFORME')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'INFORME'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FileText size={15} /> 3. Informe de Auditoría Interna y Dictamen Final
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]">
            NC Mayores: {ncMayoresCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
            NC Menores: {ncMenoresCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px]">
            Oportunidades: {oportunidadesCount}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PESTAÑA 1: LISTA DE VERIFICACIÓN DE LOS 24 PASOS                      */}
      {/* ===================================================================== */}
      {activeSubTab === 'VERIFICACION_24' && (
        <div className="space-y-4">
          {/* Controles de Filtro por Nivel, Fase y Búsqueda */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Todas las Fases (24 Pasos)' },
                { id: 1, label: 'Fase 1: Planificación (1-8)' },
                { id: 2, label: 'Fase 2: Implementación (9-19)' },
                { id: 3, label: 'Fase 3: Seguimiento (20-22)' },
                { id: 4, label: 'Fase 4: Mejora Continua (23-24)' }
              ].map((ph) => (
                <button
                  key={String(ph.id)}
                  type="button"
                  onClick={() => setSelectedPhaseFilter(ph.id as 'ALL' | 1 | 2 | 3 | 4)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPhaseFilter === ph.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {ph.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={verificationScope}
                onChange={(e) => setVerificationScope(e.target.value as 'ALL_24' | PESVLevel)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white text-slate-800"
              >
                <option value="ALL_24">Verificar los 24 Pasos Completos</option>
                <option value="BÁSICO">Solo Nivel BÁSICO (18 Pasos)</option>
                <option value="ESTÁNDAR">Solo Nivel ESTÁNDAR (22 Pasos)</option>
                <option value="AVANZADO">Solo Nivel AVANZADO (24 Pasos)</option>
              </select>

              <div className="relative min-w-[210px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchStepQuery}
                  onChange={(e) => setSearchStepQuery(e.target.value)}
                  placeholder="Buscar paso por N° o título..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Verificación de los 24 Pasos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-14 text-center">Paso</th>
                    <th className="py-3 px-3 w-72">Requisito Normativo (Resol. 40595)</th>
                    <th className="py-3 px-3 w-64 text-center">Calificación / Dictamen</th>
                    <th className="py-3 px-3 w-48">Clasificación Hallazgo</th>
                    <th className="py-3 px-3">Evidencia Objetiva / Hallazgos de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleSteps.map((step) => {
                    const currentRating = ratings[step.id] || 'NO_CUMPLE';
                    const currentFinding = findingTypes[step.id] || 'CONFORMIDAD';

                    return (
                      <tr key={step.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3.5 px-3 text-center font-black text-slate-900 font-mono border-r border-slate-100">
                          <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-xs">
                            {step.id}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 max-w-sm">
                          <div className="font-bold text-slate-900">{step.title}</div>
                          <div className="text-[10.5px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                            {step.description}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                step.phase === 1
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : step.phase === 2
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : step.phase === 3
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {step.phase === 1
                                ? 'Fase 1: Planear'
                                : step.phase === 2
                                ? 'Fase 2: Hacer'
                                : step.phase === 3
                                ? 'Fase 3: Verificar'
                                : 'Fase 4: Actuar'}
                            </span>
                            <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {step.levels.join(', ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-50 p-1 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                setRatings((prev) => ({ ...prev, [step.id]: 'CUMPLE' }));
                                setFindingTypes((prev) => ({ ...prev, [step.id]: 'CONFORMIDAD' }));
                              }}
                              className={`px-2 py-1 text-[9.5px] font-extrabold rounded cursor-pointer transition-all ${
                                currentRating === 'CUMPLE'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-gray-600 hover:bg-white'
                              }`}
                            >
                              Cumple (100%)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRatings((prev) => ({ ...prev, [step.id]: 'PARCIAL' }));
                                setFindingTypes((prev) => ({ ...prev, [step.id]: 'OPORTUNIDAD_MEJORA' }));
                              }}
                              className={`px-2 py-1 text-[9.5px] font-extrabold rounded cursor-pointer transition-all ${
                                currentRating === 'PARCIAL'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'text-gray-600 hover:bg-white'
                              }`}
                            >
                              Parcial (50%)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRatings((prev) => ({ ...prev, [step.id]: 'NO_CUMPLE' }));
                                setFindingTypes((prev) => ({ ...prev, [step.id]: 'NO_CONFORMIDAD_MAYOR' }));
                              }}
                              className={`px-2 py-1 text-[9.5px] font-extrabold rounded cursor-pointer transition-all ${
                                currentRating === 'NO_CUMPLE'
                                  ? 'bg-red-600 text-white shadow-2xs'
                                  : 'text-gray-600 hover:bg-white'
                              }`}
                            >
                              No Cumple (0%)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRatings((prev) => ({ ...prev, [step.id]: 'NO_APLICA' }));
                              }}
                              className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer transition-all ${
                                currentRating === 'NO_APLICA'
                                  ? 'bg-slate-700 text-white'
                                  : 'text-gray-500 hover:bg-white'
                              }`}
                            >
                              N/A
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <select
                            value={currentFinding}
                            onChange={(e) =>
                              setFindingTypes((prev) => ({
                                ...prev,
                                [step.id]: e.target.value as FindingCategory
                              }))
                            }
                            className={`w-full px-2 py-1.5 rounded-lg border text-[10.5px] font-bold ${
                              currentFinding === 'CONFORMIDAD' || currentFinding === 'FORTALEZA'
                                ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                                : currentFinding === 'OPORTUNIDAD_MEJORA'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : currentFinding === 'NO_CONFORMIDAD_MENOR'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            <option value="CONFORMIDAD">✓ Conformidad</option>
                            <option value="FORTALEZA">★ Fortaleza Destacada</option>
                            <option value="OPORTUNIDAD_MEJORA">• Oportunidad de Mejora</option>
                            <option value="NO_CONFORMIDAD_MENOR">⚠ No Conformidad Menor</option>
                            <option value="NO_CONFORMIDAD_MAYOR">✗ No Conformidad Mayor</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-3">
                          <textarea
                            rows={2}
                            value={observations[step.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setObservations((prev) => ({ ...prev, [step.id]: val }));
                            }}
                            placeholder="Describa la evidencia objetiva verificada o el hallazgo encontrado..."
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: PLANIFICACIÓN Y CRONOGRAMA DE AUDITORÍA                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'PLANIFICACION' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  1. Ficha de Planificación del Programa de Auditoría Interna (Paso 22)
                </h3>
                <p className="text-xs text-gray-500">
                  Defina el objetivo, alcance, criterios normativos, equipo auditor y fechas de apertura y cierre.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadAuditPlanPDF}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Descargar Plan de Auditoría PDF
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Código del Plan</label>
                <input
                  type="text"
                  value={planMeta.planCode}
                  onChange={(e) => setPlanMeta({ ...planMeta, planCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Auditoría</label>
                <select
                  value={planMeta.auditType}
                  onChange={(e) =>
                    setPlanMeta({ ...planMeta, auditType: e.target.value as AuditPlanMetadata['auditType'] })
                  }
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="Auditoría Interna Anual PESV">Auditoría Interna Anual PESV</option>
                  <option value="Auditoría Externa / Segunda Parte">Auditoría Externa / Segunda Parte</option>
                  <option value="Auditoría Extraordinaria">Auditoría Extraordinaria</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fecha Reunión Apertura</label>
                <input
                  type="date"
                  value={planMeta.openingDate}
                  onChange={(e) => setPlanMeta({ ...planMeta, openingDate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fecha Reunión Cierre</label>
                <input
                  type="date"
                  value={planMeta.closingDate}
                  onChange={(e) => {
                    setPlanMeta({ ...planMeta, closingDate: e.target.value });
                    setAuditDate(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Auditor Líder</label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Cédula Auditor Líder</label>
                <input
                  type="text"
                  value={auditorCedula}
                  onChange={(e) => setAuditorCedula(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Licencia SST Auditor</label>
                <input
                  type="text"
                  value={auditorLicense}
                  onChange={(e) => setAuditorLicense(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Auditores de Apoyo / Observadores</label>
                <input
                  type="text"
                  value={planMeta.supportAuditors}
                  onChange={(e) => setPlanMeta({ ...planMeta, supportAuditors: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Objetivo de la Auditoría</label>
                <textarea
                  rows={3}
                  value={planMeta.auditObjective}
                  onChange={(e) => setPlanMeta({ ...planMeta, auditObjective: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Alcance de la Auditoría (4 Fases / 24 Pasos)</label>
                <textarea
                  rows={3}
                  value={planMeta.auditScope}
                  onChange={(e) => setPlanMeta({ ...planMeta, auditScope: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Criterios de Auditoría (Normatividad)</label>
                <textarea
                  rows={3}
                  value={planMeta.auditCriteria}
                  onChange={(e) => setPlanMeta({ ...planMeta, auditCriteria: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Cronograma de Sesiones de Auditoría */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  2. Agenda y Cronograma de Sesiones de Auditoría por Fase y Proceso
                </h3>
                <p className="text-xs text-gray-500">
                  Distribución horaria para auditar las 4 fases del PESV y los responsables de cada proceso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Agregar Sesión al Plan
              </button>
            </div>

            <div className="space-y-2.5">
              {scheduleSessions.map((ses, idx) => (
                <div
                  key={ses.id}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        Sesión {idx + 1}: {ses.fecha} ({ses.horaInicio} - {ses.horaFin})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ses.modalidad}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ses.estado === 'Ejecutada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ses.estado}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{ses.fasePasos}</div>
                    <div className="text-gray-600">
                      <strong>Proceso Auditado:</strong> {ses.procesoArea} &nbsp;|&nbsp;{' '}
                      <strong>Auditado:</strong> {ses.auditadoCargo}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(ses.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 3: INFORME DE AUDITORÍA INTERNA Y DICTAMEN FINAL              */}
      {/* ===================================================================== */}
      {activeSubTab === 'INFORME' && (
        <div className="space-y-6">
          {/* Editor de Conclusiones y Firma del Informe */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Redacción del Informe de Auditoría Interna y Firma del Auditor (Paso 22)
                </h3>
                <p className="text-xs text-gray-500">
                  Personalice el resumen ejecutivo, fortalezas, conclusiones y firme digitalmente el informe anual.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool size={14} /> {signature ? 'Actualizar Firma Auditor' : 'Firmar Informe'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} /> Descargar Informe Oficial (PDF Carta)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Código del Informe</label>
                <input
                  type="text"
                  value={planMeta.reportCode}
                  onChange={(e) => setPlanMeta({ ...planMeta, reportCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Representante Legal (Receptor)</label>
                <input
                  type="text"
                  value={planMeta.repLegalName}
                  onChange={(e) => setPlanMeta({ ...planMeta, repLegalName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Líder del PESV</label>
                <input
                  type="text"
                  value={planMeta.pesvLeaderName}
                  onChange={(e) => setPlanMeta({ ...planMeta, pesvLeaderName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Resumen Ejecutivo de la Auditoría</label>
                <textarea
                  rows={3}
                  value={planMeta.executiveSummary}
                  onChange={(e) => setPlanMeta({ ...planMeta, executiveSummary: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fortalezas Identificadas en el PESV</label>
                <textarea
                  rows={3}
                  value={planMeta.strengthsSummary}
                  onChange={(e) => setPlanMeta({ ...planMeta, strengthsSummary: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Conclusiones y Recomendaciones (Paso 23)</label>
                <textarea
                  rows={3}
                  value={planMeta.conclusionsAndRecommendations}
                  onChange={(e) => setPlanMeta({ ...planMeta, conclusionsAndRecommendations: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Vista Previa Formato Carta del Informe Oficial de Auditoría */}
          <div className="bg-white p-8 sm:p-10 rounded-sm border border-gray-300 max-w-[820px] mx-auto shadow-md text-slate-800 text-xs space-y-5">
            <div className="border border-slate-800 bg-slate-50 p-4 text-center space-y-1 relative">
              <div className=" text-[9px] font-black uppercase tracking-widest text-emerald-700">
                SISTEMA DE GESTIÓN DE SEGURIDAD VIAL — RESOLUCIÓN 40595 DE 2022
              </div>
              <h3 className="text-sm font-black uppercase text-slate-900">{companyName}</h3>
              <div className="text-xs font-extrabold text-slate-800">
                INFORME OFICIAL DE AUDITORÍA INTERNA ANUAL DEL PESV (PASO 22)
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                CÓDIGO: {planMeta.reportCode} • FECHA: {auditDate} • NIT: {companyNit}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Cumplimiento Global</span>
                <strong className="text-sm text-emerald-700 font-black">{totalScore.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Auditor Líder</span>
                <strong>{auditorName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Licencia SST</span>
                <strong className="font-mono">{auditorLicense}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Hallazgos Detectados</span>
                <strong>
                  {ncMayoresCount} NC May | {ncMenoresCount} NC Men | {oportunidadesCount} OM
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black uppercase text-slate-900 border-b border-gray-200 pb-1">
                1. Resumen Ejecutivo y Alcance
              </h4>
              <p className="text-gray-700 leading-relaxed">{planMeta.executiveSummary}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black uppercase text-slate-900 border-b border-gray-200 pb-1">
                2. Resultado Consolidado por Fases del Ciclo PHVA (24 Pasos)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 border border-gray-200 rounded bg-blue-50/40">
                  <div className="text-[10px] font-bold text-blue-800">Fase 1: Planificación</div>
                  <div className="text-base font-black text-slate-900">{phase1Stats.score}%</div>
                  <div className="text-[9px] text-gray-500">Pasos 1 al 8</div>
                </div>
                <div className="p-2.5 border border-gray-200 rounded bg-emerald-50/40">
                  <div className="text-[10px] font-bold text-emerald-800">Fase 2: Implementación</div>
                  <div className="text-base font-black text-slate-900">{phase2Stats.score}%</div>
                  <div className="text-[9px] text-gray-500">Pasos 9 al 19</div>
                </div>
                <div className="p-2.5 border border-gray-200 rounded bg-indigo-50/40">
                  <div className="text-[10px] font-bold text-indigo-800">Fase 3: Seguimiento</div>
                  <div className="text-base font-black text-slate-900">{phase3Stats.score}%</div>
                  <div className="text-[9px] text-gray-500">Pasos 20 al 22</div>
                </div>
                <div className="p-2.5 border border-gray-200 rounded bg-amber-50/40">
                  <div className="text-[10px] font-bold text-amber-800">Fase 4: Mejora Continua</div>
                  <div className="text-base font-black text-slate-900">{phase4Stats.score}%</div>
                  <div className="text-[9px] text-gray-500">Pasos 23 al 24</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black uppercase text-slate-900 border-b border-gray-200 pb-1">
                3. Fortalezas y Conclusiones
              </h4>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{planMeta.strengthsSummary}</p>
              <p className="text-gray-700 leading-relaxed pt-1">{planMeta.conclusionsAndRecommendations}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 text-center">
              <div>
                {signature ? (
                  <img src={signature} alt="Firma Auditor" className="h-12 mx-auto object-contain mb-1" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-[10px] text-gray-400 italic">
                    [Sin firma digital adjunta]
                  </div>
                )}
                <div className="border-t border-slate-700 pt-1 font-bold text-slate-900">{auditorName}</div>
                <div className="text-[10px] text-gray-500">
                  Auditor Líder PESV • Licencia SST: {auditorLicense}
                </div>
              </div>
              <div>
                <div className="h-12" />
                <div className="border-t border-slate-700 pt-1 font-bold text-slate-900">
                  {planMeta.repLegalName}
                </div>
                <div className="text-[10px] text-gray-500">Representante Legal / Alta Dirección</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Sesión de Auditoría */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase">
                Programar Sesión en el Plan de Auditoría (Paso 22)
              </h3>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newSession.fecha}
                    onChange={(e) => setNewSession({ ...newSession, fecha: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={newSession.horaInicio}
                    onChange={(e) => setNewSession({ ...newSession, horaInicio: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={newSession.horaFin}
                    onChange={(e) => setNewSession({ ...newSession, horaFin: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Fase y Pasos a Auditar</label>
                <select
                  value={newSession.fasePasos}
                  onChange={(e) => setNewSession({ ...newSession, fasePasos: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="Fase 1: Planificación del PESV (Pasos 1 al 8)">Fase 1: Planificación del PESV (Pasos 1 al 8)</option>
                  <option value="Fase 2: Implementación y Ejecución (Pasos 9 al 19)">Fase 2: Implementación y Ejecución (Pasos 9 al 19)</option>
                  <option value="Fase 3: Seguimiento por la Organización (Pasos 20 al 22)">Fase 3: Seguimiento por la Organización (Pasos 20 al 22)</option>
                  <option value="Fase 4: Mejora Continua del PESV (Pasos 23 al 24)">Fase 4: Mejora Continua del PESV (Pasos 23 al 24)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Proceso / Área Auditada *</label>
                <input
                  type="text"
                  required
                  value={newSession.procesoArea}
                  onChange={(e) => setNewSession({ ...newSession, procesoArea: e.target.value })}
                  placeholder="Ej. Gestión de Mantenimiento Preventivo y Patio"
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Auditado (Cargo / Nombre)</label>
                  <input
                    type="text"
                    required
                    value={newSession.auditadoCargo}
                    onChange={(e) => setNewSession({ ...newSession, auditadoCargo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Modalidad</label>
                  <select
                    value={newSession.modalidad}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        modalidad: e.target.value as AuditScheduleSession['modalidad']
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual / Documental">Virtual / Documental</option>
                    <option value="Inspección en Patio / Vía">Inspección en Patio / Vía</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Firma Táctil del Auditor */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="text-emerald-600" size={15} />
                Firma Táctil del Auditor Líder
              </h3>
              <span className="text-[9.5px] text-gray-400 font-bold uppercase">Paso 22 PESV</span>
            </div>

            <div className="border border-slate-200 bg-slate-50 rounded-xl p-1 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={340}
                height={150}
                className="bg-white rounded-lg border border-slate-100 cursor-crosshair shadow-2xs touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex gap-2 justify-end text-xs font-bold">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Save size={13} /> Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

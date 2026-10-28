/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompanyConfig } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Megaphone,
  MessageSquare,
  RefreshCw,
  FileText,
  Users,
  Search,
  Check,
  Sparkles,
  Target,
  Send
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface Step23ActionItem {
  id: string;
  codigo: string;
  fechaRegistro: string;
  fuente: 'Auditoría Anual (Paso 22)' | 'Investigación Siniestro (Paso 13)' | 'Indicadores PESV (Paso 20)' | 'Inspección / Mantenimiento (Paso 16-17)' | 'Gestión del Cambio (Paso 18)' | 'Participación Colaboradores (Paso 24)';
  tipoAccion: 'PREVENTIVA' | 'CORRECTIVA' | 'MEJORA_CONTINUA';
  cicloPhva: 'PLANEAR' | 'HACER' | 'VERIFICAR' | 'ACTUAR';
  hallazgoDescripcion: string;
  causaRaiz: string;
  accionPropuesta: string;
  responsable: string;
  fechaCompromiso: string;
  criterioEficacia: string;
  estado: 'ABIERTA' | 'EN_EJECUCION' | 'CERRADA_EFICAZ';
}

export interface Step24CommunicationItem {
  id: string;
  codigo: string;
  fecha: string;
  mecanismo: 'Boletín / Cartelera Vial' | 'Charla Operativa 5 Minutos' | 'Campaña de Sensibilización' | 'Socialización Lección Aprendida' | 'Divulgación Política y Objetivos' | 'Comité / Reunión Conductores';
  tema: string;
  publicoObjetivo: string;
  canalDifusion: string;
  participantesCount: number;
  responsable: string;
  evidenciaSoporte: string;
  estado: 'EJECUTADO' | 'PROGRAMADO';
}

export interface Step24ParticipationReport {
  id: string;
  radicado: string;
  fecha: string;
  colaborador: string;
  cargoRol: string;
  tipoAporte: 'Reporte Condición Insegura en Ruta' | 'Novedad de Vehículo / Equipo' | 'Sugerencia de Mejora Vial' | 'Reporte de Incidente / Casi-Accidente';
  descripcion: string;
  respuestaComite: string;
  estado: 'ATENDIDO' | 'EN_ANALISIS';
}

interface Step23And24ImprovementModuleProps {
  stepId: 23 | 24;
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
  leaderName?: string;
  repLegal?: string;
  onNavigateToStep?: (stepId: number) => void;
}

const DEFAULT_STEP23_ACTIONS: Step23ActionItem[] = [
  {
    id: 'acp-1',
    codigo: 'ACPM-2026-001',
    fechaRegistro: '2026-03-10',
    fuente: 'Indicadores PESV (Paso 20)',
    tipoAccion: 'PREVENTIVA',
    cicloPhva: 'ACTUAR',
    hallazgoDescripcion: 'Incremento del 8% en alertas de exceso de velocidad en ruta troncal durante turno nocturno.',
    causaRaiz: 'Desconocimiento de nuevos tramos con geocercas de velocidad máxima de 60 km/h y presión por tiempos de entrega.',
    accionPropuesta: 'Reajustar tiempos del rutograma en Paso 15, recalibrar alertas sonoras GPS en cabina y realizar charla preoperacional obligatoria.',
    responsable: 'Coordinador PESV y Jefe de Tráfico',
    fechaCompromiso: '2026-04-15',
    criterioEficacia: 'Reducción de excesos de velocidad en más del 85% durante el trimestre siguiente verificada por telemetría.',
    estado: 'CERRADA_EFICAZ'
  },
  {
    id: 'acp-2',
    codigo: 'ACPM-2026-002',
    fechaRegistro: '2026-03-18',
    fuente: 'Auditoría Anual (Paso 22)',
    tipoAccion: 'CORRECTIVA',
    cicloPhva: 'HACER',
    hallazgoDescripcion: 'Se identificó que el 12% de los contratistas terceros no habían actualizado el soporte de inspección preoperacional diaria en plataforma.',
    causaRaiz: 'Falta de bloqueo automático de despacho cuando el conductor tercero omite el alistamiento preoperacional en el aplicativo.',
    accionPropuesta: 'Integrar validación obligatoria del Paso 16 antes de autorizar orden de cargue y capacitar a los contratistas en el uso del aplicativo móvil.',
    responsable: 'Líder del PESV / Operaciones',
    fechaCompromiso: '2026-04-30',
    criterioEficacia: '100% de despachos con inspección preoperacional diaria verificada antes de salida a ruta.',
    estado: 'EN_EJECUCION'
  },
  {
    id: 'acp-3',
    codigo: 'ACPM-2026-003',
    fechaRegistro: '2026-03-25',
    fuente: 'Participación Colaboradores (Paso 24)',
    tipoAccion: 'MEJORA_CONTINUA',
    cicloPhva: 'PLANEAR',
    hallazgoDescripcion: 'Propuesta de conductores para mejorar la iluminación y demarcación reflectiva en la bahía de parqueo y zona de maniobras en reversa.',
    causaRaiz: 'Baja visibilidad en maniobras de parqueo en horario de 18:00 a 21:00 horas en días de lluvia.',
    accionPropuesta: 'Instalar reflectores LED adicionales, topes llanta y pintura epóxica reflectiva de alto tráfico en las bahías del patio (Paso 14).',
    responsable: 'Coordinador SST / Mantenimiento Locativo',
    fechaCompromiso: '2026-05-10',
    criterioEficacia: 'Inspección de infraestructura vial interna al 100% de conformidad y cero incidentes en patio.',
    estado: 'EN_EJECUCION'
  }
];

const DEFAULT_STEP24_COMMS: Step24CommunicationItem[] = [
  {
    id: 'com-1',
    codigo: 'COM-PESV-001',
    fecha: '2026-02-10',
    mecanismo: 'Divulgación Política y Objetivos',
    tema: 'Socialización de la Política de Seguridad Vial, Objetivos y Metas PESV 2026',
    publicoObjetivo: 'Todos los colaboradores, conductores propios y contratistas',
    canalDifusion: 'Cartelera corporativa, correo institucional, WhatsApp corporativo y charla presencial',
    participantesCount: 45,
    responsable: 'Líder del PESV',
    evidenciaSoporte: 'Acta de divulgación firmada y registro fotográfico',
    estado: 'EJECUTADO'
  },
  {
    id: 'com-2',
    codigo: 'COM-PESV-002',
    fecha: '2026-03-05',
    mecanismo: 'Socialización Lección Aprendida',
    tema: 'Lección Aprendida: Prevención de microsueños, pausas activas cada 2 horas y distancia de seguimiento',
    publicoObjetivo: 'Conductores de flota pesada, liviana y motociclistas',
    canalDifusion: 'Boletín digital "Ruta Segura" y charla operativa de 5 minutos en despacho',
    participantesCount: 38,
    responsable: 'Comité de Seguridad Vial',
    evidenciaSoporte: 'Ficha de lección aprendida No. 02 y listado de asistencia',
    estado: 'EJECUTADO'
  },
  {
    id: 'com-3',
    codigo: 'COM-PESV-003',
    fecha: '2026-04-12',
    mecanismo: 'Campaña de Sensibilización',
    tema: 'Campaña "Cero Distracciones al Volante: Tu familia te espera en casa"',
    publicoObjetivo: 'Personal administrativo, comercial y operativo que realiza desplazamientos laborales',
    canalDifusion: 'Piezas gráficas digitales, protectores de pantalla y taller participativo',
    participantesCount: 52,
    responsable: 'Líder del PESV / ARL',
    evidenciaSoporte: 'Material pedagógico y evaluación de percepción vial',
    estado: 'PROGRAMADO'
  }
];

const DEFAULT_STEP24_PARTICIPATION: Step24ParticipationReport[] = [
  {
    id: 'part-1',
    radicado: 'PART-2026-001',
    fecha: '2026-03-14',
    colaborador: 'Carlos Andrés Ramírez',
    cargoRol: 'Conductor Vehículo Pesado',
    tipoAporte: 'Reporte Condición Insegura en Ruta',
    descripcion: 'Se reporta hundimiento de calzada y falta de señalización en el km 42 del corredor vial Norte, sector variante, especialmente riesgoso en lluvia.',
    respuestaComite: 'Se actualizó el rutograma (Paso 15) incluyendo el punto crítico, se envió alerta preventiva a toda la flota por grupo de difusión y se redujo límite de velocidad en el tramo a 40 km/h.',
    estado: 'ATENDIDO'
  },
  {
    id: 'part-2',
    radicado: 'PART-2026-002',
    fecha: '2026-03-22',
    colaborador: 'Laura Valentina Mendoza',
    cargoRol: 'Ejecutiva Comercial (Conductora Vehículo Liviano)',
    tipoAporte: 'Sugerencia de Mejora Vial',
    descripcion: 'Sugiere incluir kits de conos reflectivos retráctiles y linterna recargable de alta potencia en todos los vehículos livianos asignados a visitas regionales.',
    respuestaComite: 'Propuesta aprobada por el Comité de Seguridad Vial. Se incluyó la dotación en el presupuesto del Paso 4 y se verificará en la inspección preoperacional del Paso 16.',
    estado: 'ATENDIDO'
  }
];

export default function Step23And24ImprovementModule({
  stepId,
  config,
  companyName = 'Transportes y Logística S.A.S.',
  companyNit = '901.452.883-1',
  leaderName = 'Ing. Coordinador PESV',
  repLegal = 'Representante Legal',
  onNavigateToStep
}: Step23And24ImprovementModuleProps) {
  const storageKey = `pesv_fase4_data_${companyNit}`;

  const [actionsList, setActionsList] = useState<Step23ActionItem[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_step23`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_STEP23_ACTIONS;
  });

  const [commsList, setCommsList] = useState<Step24CommunicationItem[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_step24_comms`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_STEP24_COMMS;
  });

  const [participationList, setParticipationList] = useState<Step24ParticipationReport[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_step24_part`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_STEP24_PARTICIPATION;
  });

  const [filterType23, setFilterType23] = useState<string>('ALL');
  const [search23, setSearch23] = useState<string>('');
  const [showModal23, setShowModal23] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<Step23ActionItem | null>(null);

  const [activeTab24, setActiveTab24] = useState<'COMUNICACION' | 'PARTICIPACION'>('COMUNICACION');
  const [showCommModal, setShowCommModal] = useState<boolean>(false);
  const [showPartModal, setShowPartModal] = useState<boolean>(false);

  // Form states for Step 23
  const [form23, setForm23] = useState<Omit<Step23ActionItem, 'id'>>({
    codigo: `ACPM-2026-00${actionsList.length + 1}`,
    fechaRegistro: new Date().toISOString().split('T')[0],
    fuente: 'Auditoría Anual (Paso 22)',
    tipoAccion: 'CORRECTIVA',
    cicloPhva: 'ACTUAR',
    hallazgoDescripcion: '',
    causaRaiz: '',
    accionPropuesta: '',
    responsable: leaderName,
    fechaCompromiso: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    criterioEficacia: '',
    estado: 'EN_EJECUCION'
  });

  // Form states for Step 24 - Communication
  const [formComm, setFormComm] = useState<Omit<Step24CommunicationItem, 'id'>>({
    codigo: `COM-PESV-00${commsList.length + 1}`,
    fecha: new Date().toISOString().split('T')[0],
    mecanismo: 'Boletín / Cartelera Vial',
    tema: '',
    publicoObjetivo: 'Todos los actores viales de la organización',
    canalDifusion: 'Correo electrónico, cartelera y WhatsApp',
    participantesCount: 25,
    responsable: leaderName,
    evidenciaSoporte: 'Acta de socialización y registro de asistencia',
    estado: 'EJECUTADO'
  });

  // Form states for Step 24 - Participation
  const [formPart, setFormPart] = useState<Omit<Step24ParticipationReport, 'id'>>({
    radicado: `PART-2026-00${participationList.length + 1}`,
    fecha: new Date().toISOString().split('T')[0],
    colaborador: '',
    cargoRol: 'Conductor / Colaborador',
    tipoAporte: 'Reporte Condición Insegura en Ruta',
    descripcion: '',
    respuestaComite: '',
    estado: 'ATENDIDO'
  });

  // Subscribe to Firestore
  useEffect(() => {
    const unsub = subscribeToSystemSetting(
      `fase4_pesv_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`,
      (cloudData) => {
        if (cloudData) {
          if (Array.isArray(cloudData.actionsList)) setActionsList(cloudData.actionsList);
          if (Array.isArray(cloudData.commsList)) setCommsList(cloudData.commsList);
          if (Array.isArray(cloudData.participationList)) setParticipationList(cloudData.participationList);
        }
      }
    );
    return () => unsub();
  }, [companyNit]);

  const persistAll = (
    nextActions: Step23ActionItem[],
    nextComms: Step24CommunicationItem[],
    nextPart: Step24ParticipationReport[]
  ) => {
    localStorage.setItem(`${storageKey}_step23`, JSON.stringify(nextActions));
    localStorage.setItem(`${storageKey}_step24_comms`, JSON.stringify(nextComms));
    localStorage.setItem(`${storageKey}_step24_part`, JSON.stringify(nextPart));
    saveSystemSetting(`fase4_pesv_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`, {
      actionsList: nextActions,
      commsList: nextComms,
      participationList: nextPart,
      updatedAt: new Date().toISOString()
    }).catch(() => {});
  };

  // Handlers for Step 23
  const handleOpenNewAction = () => {
    setEditingAction(null);
    setForm23({
      codigo: `ACPM-2026-00${actionsList.length + 1}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
      fuente: 'Auditoría Anual (Paso 22)',
      tipoAccion: 'CORRECTIVA',
      cicloPhva: 'ACTUAR',
      hallazgoDescripcion: '',
      causaRaiz: '',
      accionPropuesta: '',
      responsable: leaderName,
      fechaCompromiso: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      criterioEficacia: 'Verificación documental y operativa de no recurrencia',
      estado: 'EN_EJECUCION'
    });
    setShowModal23(true);
  };

  const handleEditAction = (item: Step23ActionItem) => {
    setEditingAction(item);
    setForm23({
      codigo: item.codigo,
      fechaRegistro: item.fechaRegistro,
      fuente: item.fuente,
      tipoAccion: item.tipoAccion,
      cicloPhva: item.cicloPhva,
      hallazgoDescripcion: item.hallazgoDescripcion,
      causaRaiz: item.causaRaiz,
      accionPropuesta: item.accionPropuesta,
      responsable: item.responsable,
      fechaCompromiso: item.fechaCompromiso,
      criterioEficacia: item.criterioEficacia,
      estado: item.estado
    });
    setShowModal23(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form23.hallazgoDescripcion.trim() || !form23.accionPropuesta.trim()) return;

    let updated: Step23ActionItem[];
    if (editingAction) {
      updated = actionsList.map((a) =>
        a.id === editingAction.id ? { ...form23, id: editingAction.id } : a
      );
    } else {
      updated = [
        {
          ...form23,
          id: `acp-${Date.now()}`
        },
        ...actionsList
      ];
    }
    setActionsList(updated);
    persistAll(updated, commsList, participationList);
    setShowModal23(false);
  };

  const handleDeleteAction = (id: string) => {
    const updated = actionsList.filter((a) => a.id !== id);
    setActionsList(updated);
    persistAll(updated, commsList, participationList);
  };

  const handleToggleActionStatus = (id: string) => {
    const order: Step23ActionItem['estado'][] = ['ABIERTA', 'EN_EJECUCION', 'CERRADA_EFICAZ'];
    const updated = actionsList.map((a) => {
      if (a.id !== id) return a;
      const nextIdx = (order.indexOf(a.estado) + 1) % order.length;
      return { ...a, estado: order[nextIdx] };
    });
    setActionsList(updated);
    persistAll(updated, commsList, participationList);
  };

  // Handlers for Step 24
  const handleSaveComm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComm.tema.trim()) return;
    const updated: Step24CommunicationItem[] = [
      { ...formComm, id: `com-${Date.now()}` },
      ...commsList
    ];
    setCommsList(updated);
    persistAll(actionsList, updated, participationList);
    setShowCommModal(false);
  };

  const handleDeleteComm = (id: string) => {
    const updated = commsList.filter((c) => c.id !== id);
    setCommsList(updated);
    persistAll(actionsList, updated, participationList);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPart.colaborador.trim() || !formPart.descripcion.trim()) return;
    const updated: Step24ParticipationReport[] = [
      { ...formPart, id: `part-${Date.now()}` },
      ...participationList
    ];
    setParticipationList(updated);
    persistAll(actionsList, commsList, updated);
    setShowPartModal(false);
  };

  const handleDeletePart = (id: string) => {
    const updated = participationList.filter((p) => p.id !== id);
    setParticipationList(updated);
    persistAll(actionsList, commsList, updated);
  };

  // PDF Export for Step 23
  const exportStep23PDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header box
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, pageW - 28, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PLAN ESTRATÉGICO DE SEGURIDAD VIAL - FASE 4: MEJORA CONTINUA', pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text('PASO 23: MATRIZ DE MEJORA CONTINUA, ACCIONES PREVENTIVAS Y CORRECTIVAS', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Empresa: ${companyName} | NIT: ${companyNit} | Nivel PESV: ${config.nivelCalculado} | Fecha: ${new Date().toISOString().split('T')[0]}`, pageW / 2, y, { align: 'center' });

    y = 44;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN EJECUTIVO DE ACCIONES PHVA (RESOLUCIÓN 40595 DE 2022)', 14, y);
    y += 5;

    const prevCount = actionsList.filter(a => a.tipoAccion === 'PREVENTIVA').length;
    const corrCount = actionsList.filter(a => a.tipoAccion === 'CORRECTIVA').length;
    const mejCount = actionsList.filter(a => a.tipoAccion === 'MEJORA_CONTINUA').length;
    const closedCount = actionsList.filter(a => a.estado === 'CERRADA_EFICAZ').length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Total Acciones Registradas: ${actionsList.length}   |   Preventivas: ${prevCount}   |   Correctivas: ${corrCount}   |   Mejora Continua: ${mejCount}   |   Cerradas Eficaces: ${closedCount}`,
      14,
      y
    );
    y += 7;

    actionsList.forEach((item, index) => {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageW - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${index + 1}. [${item.codigo}] Tipo: ${item.tipoAccion.replace('_', ' ')} | Ciclo: ${item.cicloPhva} | Estado: ${item.estado.replace('_', ' ')}`,
        16,
        y
      );
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Fuente: ${item.fuente} | Fecha Registro: ${item.fechaRegistro} | Fecha Compromiso: ${item.fechaCompromiso} | Responsable: ${item.responsable}`, 16, y);
      y += 4.5;

      const hallazgoLines = doc.splitTextToSize(`Hallazgo / Oportunidad: ${item.hallazgoDescripcion}`, pageW - 32);
      doc.text(hallazgoLines, 16, y);
      y += hallazgoLines.length * 4;

      const causaLines = doc.splitTextToSize(`Causa Raíz: ${item.causaRaiz}`, pageW - 32);
      doc.text(causaLines, 16, y);
      y += causaLines.length * 4;

      const accionLines = doc.splitTextToSize(`Plan de Acción: ${item.accionPropuesta}`, pageW - 32);
      doc.setFont('helvetica', 'bold');
      doc.text(accionLines, 16, y);
      doc.setFont('helvetica', 'normal');
      y += accionLines.length * 4;

      const eficaciaLines = doc.splitTextToSize(`Verificación de Eficacia: ${item.criterioEficacia}`, pageW - 32);
      doc.text(eficaciaLines, 16, y);
      y += eficaciaLines.length * 4 + 4;
    });

    if (y > 235) {
      doc.addPage();
      y = 30;
    } else {
      y += 12;
    }

    doc.setDrawColor(148, 163, 184);
    doc.line(25, y + 12, 95, y + 12);
    doc.line(115, y + 12, 185, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(leaderName, 60, y + 17, { align: 'center' });
    doc.text(repLegal, 150, y + 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Líder del Diseño e Implementación del PESV', 60, y + 21, { align: 'center' });
    doc.text('Representante Legal / Alta Dirección', 150, y + 21, { align: 'center' });

    doc.save(`Paso23_Mejora_Continua_ACPM_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  // PDF Export for Step 24
  const exportStep24PDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, pageW - 28, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PLAN ESTRATÉGICO DE SEGURIDAD VIAL - FASE 4: MEJORA CONTINUA', pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text('PASO 24: MECANISMOS DE COMUNICACIÓN Y PARTICIPACIÓN EN SEGURIDAD VIAL', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Empresa: ${companyName} | NIT: ${companyNit} | Nivel PESV: ${config.nivelCalculado} | Fecha: ${new Date().toISOString().split('T')[0]}`, pageW / 2, y, { align: 'center' });

    y = 44;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. MATRIZ DE COMUNICACIÓN, CAMPAÑAS Y DIVULGACIÓN DE SEGURIDAD VIAL', 14, y);
    y += 6;

    commsList.forEach((c, idx) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageW - 28, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${idx + 1}. [${c.codigo}] ${c.mecanismo} (${c.fecha}) - Estado: ${c.estado}`, 16, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const tLines = doc.splitTextToSize(`Tema divulgado: ${c.tema}`, pageW - 32);
      doc.text(tLines, 16, y);
      y += tLines.length * 4;
      doc.text(`Público: ${c.publicoObjetivo} | Canal: ${c.canalDifusion} | Asistentes: ${c.participantesCount}`, 16, y);
      y += 4;
      doc.text(`Responsable: ${c.responsable} | Evidencia: ${c.evidenciaSoporte}`, 16, y);
      y += 6;
    });

    y += 3;
    if (y > 225) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. REGISTRO DE PARTICIPACIÓN Y REPORTE DE CONDICIONES VIALES POR COLABORADORES', 14, y);
    y += 6;

    participationList.forEach((p, idx) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(236, 253, 245);
      doc.rect(14, y - 4, pageW - 28, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${idx + 1}. [${p.radicado}] ${p.tipoAporte} | Fecha: ${p.fecha} | Estado: ${p.estado}`, 16, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Reportado por: ${p.colaborador} (${p.cargoRol})`, 16, y);
      y += 4;
      const descLines = doc.splitTextToSize(`Descripción del reporte/sugerencia: ${p.descripcion}`, pageW - 32);
      doc.text(descLines, 16, y);
      y += descLines.length * 4;
      const respLines = doc.splitTextToSize(`Respuesta y gestión del Comité PESV: ${p.respuestaComite}`, pageW - 32);
      doc.setFont('helvetica', 'bold');
      doc.text(respLines, 16, y);
      doc.setFont('helvetica', 'normal');
      y += respLines.length * 4 + 5;
    });

    if (y > 235) {
      doc.addPage();
      y = 30;
    } else {
      y += 10;
    }

    doc.setDrawColor(148, 163, 184);
    doc.line(25, y + 12, 95, y + 12);
    doc.line(115, y + 12, 185, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(leaderName, 60, y + 17, { align: 'center' });
    doc.text(repLegal, 150, y + 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Líder del Diseño e Implementación del PESV', 60, y + 21, { align: 'center' });
    doc.text('Representante Legal / Alta Dirección', 150, y + 21, { align: 'center' });

    doc.save(`Paso24_Comunicacion_y_Participacion_PESV_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  // Filtered actions for Step 23
  const filteredActions = actionsList.filter((item) => {
    const matchesType = filterType23 === 'ALL' || item.tipoAccion === filterType23;
    const matchesSearch =
      !search23.trim() ||
      item.codigo.toLowerCase().includes(search23.toLowerCase()) ||
      item.hallazgoDescripcion.toLowerCase().includes(search23.toLowerCase()) ||
      item.accionPropuesta.toLowerCase().includes(search23.toLowerCase()) ||
      item.responsable.toLowerCase().includes(search23.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ============================================================================
  // RENDER PASO 23: MEJORA CONTINUA, ACCIONES PREVENTIVAS Y CORRECTIVAS
  // ============================================================================
  if (stepId === 23) {
    const totalActions = actionsList.length;
    const preventivasCount = actionsList.filter((a) => a.tipoAccion === 'PREVENTIVA').length;
    const correctivasCount = actionsList.filter((a) => a.tipoAccion === 'CORRECTIVA').length;
    const mejoraCount = actionsList.filter((a) => a.tipoAccion === 'MEJORA_CONTINUA').length;
    const cerradasCount = actionsList.filter((a) => a.estado === 'CERRADA_EFICAZ').length;
    const eficaciaPct = totalActions > 0 ? Math.round((cerradasCount / totalActions) * 100) : 100;

    return (
      <div className="space-y-5" id="step23-improvement-module">
        {/* Banner Fase 4 - Paso 23 */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Fase 4: Mejora Continua del PESV
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Aplica para Todos los Niveles (Básico, Estándar, Avanzado)
              </span>
            </div>
            <h3 className="text-base font-black tracking-tight flex items-center gap-2 mt-1">
              <RefreshCw size={18} className="text-emerald-400" />
              Paso 23. Mejora continua, acciones preventivas y correctivas
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Definición e implementación de las acciones preventivas, correctivas y de mejora continua (Ciclo PHVA) derivadas de los resultados de la medición de indicadores, auditorías anuales, investigaciones de siniestros viales, inspecciones y sugerencias de los actores viales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewAction}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus size={15} /> Registrar Acción ACPM
            </button>
            <button
              type="button"
              onClick={exportStep23PDF}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} /> Descargar Matriz PDF
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Acciones PHVA</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalActions}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Matriz activa</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30">
            <span className="text-[10px] font-bold uppercase text-blue-700 block">Preventivas</span>
            <span className="text-xl font-black text-blue-900 mt-0.5 block">{preventivasCount}</span>
            <span className="text-[10px] text-blue-600 font-semibold">Anticipación del riesgo</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Correctivas</span>
            <span className="text-xl font-black text-amber-900 mt-0.5 block">{correctivasCount}</span>
            <span className="text-[10px] text-amber-700 font-semibold">Eliminación causa raíz</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/30">
            <span className="text-[10px] font-bold uppercase text-purple-700 block">Mejora Continua</span>
            <span className="text-xl font-black text-purple-900 mt-0.5 block">{mejoraCount}</span>
            <span className="text-[10px] text-purple-600 font-semibold">Optimización del PESV</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Eficacia Cierre</span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">{eficaciaPct}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold">{cerradasCount} de {totalActions} cerradas</span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todas las Acciones' },
              { id: 'PREVENTIVA', label: 'Preventivas' },
              { id: 'CORRECTIVA', label: 'Correctivas' },
              { id: 'MEJORA_CONTINUA', label: 'Mejora Continua' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType23(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType23 === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search23}
              onChange={(e) => setSearch23(e.target.value)}
              placeholder="Buscar por código, hallazgo o responsable..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Listado de Acciones Preventivas, Correctivas y de Mejora */}
        <div className="space-y-3">
          {filteredActions.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {item.codigo}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.tipoAccion === 'PREVENTIVA'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : item.tipoAccion === 'CORRECTIVA'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {item.tipoAccion === 'PREVENTIVA'
                      ? 'ACCIÓN PREVENTIVA'
                      : item.tipoAccion === 'CORRECTIVA'
                      ? 'ACCIÓN CORRECTIVA'
                      : 'MEJORA CONTINUA'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                    Ciclo PHVA: {item.cicloPhva}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Fuente: <strong className="text-gray-800">{item.fuente}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActionStatus(item.id)}
                    title="Clic para cambiar estado de la acción"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                      item.estado === 'CERRADA_EFICAZ'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.estado === 'EN_EJECUCION'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.estado === 'CERRADA_EFICAZ' ? (
                      <>
                        <CheckCircle2 size={12} /> Cerrada y Eficaz
                      </>
                    ) : item.estado === 'EN_EJECUCION' ? (
                      <>
                        <Clock size={12} /> En Ejecución
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} /> Abierta
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditAction(item)}
                    className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar acción"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAction(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar acción"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    1. Hallazgo / No Conformidad / Oportunidad
                  </span>
                  <p className="text-gray-800 leading-relaxed">{item.hallazgoDescripcion}</p>
                </div>
                <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    2. Análisis de Causa Raíz (5 Porqués / Espina de Pescado)
                  </span>
                  <p className="text-gray-700 leading-relaxed">{item.causaRaiz}</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                    3. Plan de Acción y Seguimiento de Eficacia
                  </span>
                  <p className="text-gray-900 font-semibold leading-relaxed">{item.accionPropuesta}</p>
                  <p className="text-[11px] text-emerald-800 mt-1.5">
                    <strong>Criterio Eficacia:</strong> {item.criterioEficacia}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 pt-1">
                <span>
                  Responsable: <strong className="text-gray-800">{item.responsable}</strong>
                </span>
                <div className="flex items-center gap-4">
                  <span>Fecha Apertura: <strong>{item.fechaRegistro}</strong></span>
                  <span>Fecha Compromiso Cierre: <strong className="text-emerald-700">{item.fechaCompromiso}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Crear/Editar Acción Paso 23 */}
        {showModal23 && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  {editingAction ? 'Editar Acción ACPM (Paso 23)' : 'Nueva Acción Preventiva, Correctiva o de Mejora (Paso 23)'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowModal23(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>

              <form onSubmit={handleSaveAction} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Código ACPM</label>
                    <input
                      type="text"
                      required
                      value={form23.codigo}
                      onChange={(e) => setForm23({ ...form23, codigo: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tipo de Acción</label>
                    <select
                      value={form23.tipoAccion}
                      onChange={(e) =>
                        setForm23({ ...form23, tipoAccion: e.target.value as Step23ActionItem['tipoAccion'] })
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="PREVENTIVA">Preventiva</option>
                      <option value="CORRECTIVA">Correctiva</option>
                      <option value="MEJORA_CONTINUA">Mejora Continua</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Etapa Ciclo PHVA</label>
                    <select
                      value={form23.cicloPhva}
                      onChange={(e) =>
                        setForm23({ ...form23, cicloPhva: e.target.value as Step23ActionItem['cicloPhva'] })
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="PLANEAR">PLANEAR</option>
                      <option value="HACER">HACER</option>
                      <option value="VERIFICAR">VERIFICAR</option>
                      <option value="ACTUAR">ACTUAR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Fuente del Hallazgo</label>
                    <select
                      value={form23.fuente}
                      onChange={(e) =>
                        setForm23({ ...form23, fuente: e.target.value as Step23ActionItem['fuente'] })
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="Auditoría Anual (Paso 22)">Auditoría Anual (Paso 22)</option>
                      <option value="Investigación Siniestro (Paso 13)">Investigación Siniestro (Paso 13)</option>
                      <option value="Indicadores PESV (Paso 20)">Indicadores PESV (Paso 20)</option>
                      <option value="Inspección / Mantenimiento (Paso 16-17)">Inspección / Mantenimiento (Paso 16-17)</option>
                      <option value="Gestión del Cambio (Paso 18)">Gestión del Cambio (Paso 18)</option>
                      <option value="Participación Colaboradores (Paso 24)">Participación Colaboradores (Paso 24)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Responsable de Ejecución</label>
                    <input
                      type="text"
                      required
                      value={form23.responsable}
                      onChange={(e) => setForm23({ ...form23, responsable: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Descripción del Hallazgo / No Conformidad / Oportunidad de Mejora</label>
                  <textarea
                    rows={2}
                    required
                    value={form23.hallazgoDescripcion}
                    onChange={(e) => setForm23({ ...form23, hallazgoDescripcion: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Análisis de Causa Raíz</label>
                  <textarea
                    rows={2}
                    required
                    value={form23.causaRaiz}
                    onChange={(e) => setForm23({ ...form23, causaRaiz: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Plan de Acción Detallado</label>
                  <textarea
                    rows={2}
                    required
                    value={form23.accionPropuesta}
                    onChange={(e) => setForm23({ ...form23, accionPropuesta: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Fecha Compromiso</label>
                    <input
                      type="date"
                      value={form23.fechaCompromiso}
                      onChange={(e) => setForm23({ ...form23, fechaCompromiso: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Estado</label>
                    <select
                      value={form23.estado}
                      onChange={(e) =>
                        setForm23({ ...form23, estado: e.target.value as Step23ActionItem['estado'] })
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="ABIERTA">Abierta</option>
                      <option value="EN_EJECUCION">En Ejecución</option>
                      <option value="CERRADA_EFICAZ">Cerrada y Eficaz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Criterio de Eficacia</label>
                    <input
                      type="text"
                      value={form23.criterioEficacia}
                      onChange={(e) => setForm23({ ...form23, criterioEficacia: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal23(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} /> Guardar Acción ACPM
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER PASO 24: MECANISMOS DE COMUNICACIÓN Y PARTICIPACIÓN
  // ============================================================================
  const totalParticipantes = commsList.reduce((acc, c) => acc + (Number(c.participantesCount) || 0), 0);

  return (
    <div className="space-y-5" id="step24-communication-module">
      {/* Banner Fase 4 - Paso 24 */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Fase 4: Mejora Continua del PESV
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Aplica para Todos los Niveles (Básico, Estándar, Avanzado)
            </span>
          </div>
          <h3 className="text-base font-black tracking-tight flex items-center gap-2 mt-1">
            <Megaphone size={18} className="text-emerald-400" />
            Paso 24. Mecanismos de comunicación y participación
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Garantiza que las políticas, objetivos, lecciones aprendidas de siniestros viales, boletines e indicadores sean comunicados a todos los niveles de la organización, y dispone de canales activos para recibir y gestionar propuestas y reportes de condiciones inseguras de los actores viales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCommModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} /> Registrar Comunicación / Campaña
          </button>
          <button
            type="button"
            onClick={() => setShowPartModal(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <MessageSquare size={14} /> Nuevo Reporte Participación
          </button>
          <button
            type="button"
            onClick={exportStep24PDF}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={14} /> Descargar Informe PDF
          </button>
        </div>
      </div>

      {/* KPIs Paso 24 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <span className="text-[10px] font-bold uppercase text-gray-400 block">Campañas y Boletines</span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">{commsList.length}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Comunicaciones oficiales</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Colaboradores Impactados</span>
          <span className="text-xl font-black text-emerald-900 mt-0.5 block">{totalParticipantes}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">Cobertura acumulada</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-sky-200 bg-sky-50/30">
          <span className="text-[10px] font-bold uppercase text-sky-700 block">Reportes y Sugerencias</span>
          <span className="text-xl font-black text-sky-900 mt-0.5 block">{participationList.length}</span>
          <span className="text-[10px] text-sky-700 font-semibold">Participación activa en vía</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/30">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Tasa de Respuesta Comité</span>
          <span className="text-xl font-black text-purple-900 mt-0.5 block">100%</span>
          <span className="text-[10px] text-purple-700 font-semibold">Retroalimentación cerrada</span>
        </div>
      </div>

      {/* Selector de Sub-pestañas Paso 24 */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab24('COMUNICACION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab24 === 'COMUNICACION'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Megaphone size={14} /> 1. Matriz de Comunicaciones, Boletines y Lecciones Aprendidas ({commsList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab24('PARTICIPACION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab24 === 'PARTICIPACION'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <MessageSquare size={14} /> 2. Buzón de Participación y Reporte de Condiciones Viales ({participationList.length})
        </button>
      </div>

      {activeTab24 === 'COMUNICACION' ? (
        <div className="space-y-3">
          {commsList.map((comm) => (
            <div
              key={comm.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {comm.codigo}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {comm.mecanismo}
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Fecha: {comm.fecha}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      comm.estado === 'EJECUTADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {comm.estado}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">{comm.tema}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1">
                  <div>
                    <strong className="text-gray-800">Público Objetivo:</strong> {comm.publicoObjetivo}
                  </div>
                  <div>
                    <strong className="text-gray-800">Canal:</strong> {comm.canalDifusion}
                  </div>
                  <div>
                    <strong className="text-gray-800">Evidencia:</strong> {comm.evidenciaSoporte}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
                <div className="text-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs font-black text-emerald-700 block">{comm.participantesCount}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-bold">Asistentes</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteComm(comm.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar registro"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {participationList.map((part) => (
            <div
              key={part.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-sky-300 transition-all space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    {part.radicado}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                    {part.tipoAporte}
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    {part.colaborador} <span className="text-gray-400 font-normal">({part.cargoRol})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">{part.fecha}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {part.estado}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePart(part.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Reporte / Sugerencia del Actor Vial
                  </span>
                  <p className="text-gray-800 leading-relaxed">{part.descripcion}</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                    Respuesta y Gestión del Comité / Líder PESV
                  </span>
                  <p className="text-gray-900 font-medium leading-relaxed">{part.respuestaComite}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Comunicación Paso 24 */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Registrar Mecanismo de Comunicación Vial (Paso 24)
              </h4>
              <button
                type="button"
                onClick={() => setShowCommModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveComm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={formComm.codigo}
                    onChange={(e) => setFormComm({ ...formComm, codigo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formComm.fecha}
                    onChange={(e) => setFormComm({ ...formComm, fecha: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mecanismo de Comunicación</label>
                <select
                  value={formComm.mecanismo}
                  onChange={(e) =>
                    setFormComm({ ...formComm, mecanismo: e.target.value as Step24CommunicationItem['mecanismo'] })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="Boletín / Cartelera Vial">Boletín / Cartelera Vial</option>
                  <option value="Charla Operativa 5 Minutos">Charla Operativa 5 Minutos</option>
                  <option value="Campaña de Sensibilización">Campaña de Sensibilización</option>
                  <option value="Socialización Lección Aprendida">Socialización Lección Aprendida</option>
                  <option value="Divulgación Política y Objetivos">Divulgación Política y Objetivos</option>
                  <option value="Comité / Reunión Conductores">Comité / Reunión Conductores</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tema Divulgado / Mensaje Clave</label>
                <input
                  type="text"
                  required
                  value={formComm.tema}
                  onChange={(e) => setFormComm({ ...formComm, tema: e.target.value })}
                  placeholder="Ej. Socialización de límites de velocidad y puntos críticos..."
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Canal de Difusión</label>
                  <input
                    type="text"
                    value={formComm.canalDifusion}
                    onChange={(e) => setFormComm({ ...formComm, canalDifusion: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">N° Colaboradores Impactados</label>
                  <input
                    type="number"
                    min={1}
                    value={formComm.participantesCount}
                    onChange={(e) => setFormComm({ ...formComm, participantesCount: Number(e.target.value) || 1 })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Evidencia Documental</label>
                <input
                  type="text"
                  value={formComm.evidenciaSoporte}
                  onChange={(e) => setFormComm({ ...formComm, evidenciaSoporte: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Comunicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Reporte de Participación Paso 24 */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Registrar Participación o Reporte de Condición Vial (Paso 24)
              </h4>
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nombre del Colaborador / Conductor</label>
                  <input
                    type="text"
                    required
                    value={formPart.colaborador}
                    onChange={(e) => setFormPart({ ...formPart, colaborador: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cargo / Rol Vial</label>
                  <input
                    type="text"
                    required
                    value={formPart.cargoRol}
                    onChange={(e) => setFormPart({ ...formPart, cargoRol: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Participación / Reporte</label>
                <select
                  value={formPart.tipoAporte}
                  onChange={(e) =>
                    setFormPart({ ...formPart, tipoAporte: e.target.value as Step24ParticipationReport['tipoAporte'] })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="Reporte Condición Insegura en Ruta">Reporte Condición Insegura en Ruta</option>
                  <option value="Novedad de Vehículo / Equipo">Novedad de Vehículo / Equipo</option>
                  <option value="Sugerencia de Mejora Vial">Sugerencia de Mejora Vial</option>
                  <option value="Reporte de Incidente / Casi-Accidente">Reporte de Incidente / Casi-Accidente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción del Reporte o Propuesta</label>
                <textarea
                  rows={2}
                  required
                  value={formPart.descripcion}
                  onChange={(e) => setFormPart({ ...formPart, descripcion: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Respuesta y Acción Tomada por el Comité PESV</label>
                <textarea
                  rows={2}
                  required
                  value={formPart.respuestaComite}
                  onChange={(e) => setFormPart({ ...formPart, respuestaComite: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Participación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

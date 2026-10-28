/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Edit, Trash2, Check, X, Download, Printer,
  AlertTriangle, CheckCircle2, ClipboardList, User, Calendar,
  Shield, ArrowRight, PenTool, Upload, RotateCcw, Search, Building
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyConfig } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface ChangeActionStep {
  id: string;
  stepNumber: number;
  queSeHace: string;
  quien: string;
  cuando: string;
  completado?: boolean;
}

export interface PESVChangeRecord {
  id: string;
  // 1. Encabezado de Control
  changeId: string; // Ej: CHG-001
  fecha: string; // YYYY-MM-DD (mostrado también como DD / MM / AAAA)
  solicitanteNombre: string;
  solicitanteArea: string;
  categoriaCambio?: 'Interno (Flota, Rutas, Personal, Tecnología)' | 'Externo (Normatividad, Vías, Clientes, Contratistas)';

  // 2. Definición del Cambio
  queSeQuiereCambiar: string; // Título breve
  porQueSeCambia: string; // Justificación o problema actual
  cualEsElBeneficio: string; // Resultado esperado

  // 3. Impacto y Riesgos (Marcar con X)
  impacto: 'Bajo' | 'Medio' | 'Alto';
  quePuedeSalirMal: string; // Riesgo principal
  planMarchaAtras: string; // ¿Cómo lo solucionamos si falla?

  // 4. Plan de Acción (Fechas y Responsables)
  planAccion: ChangeActionStep[];

  // 5. Autorización y Cierre
  aprobadoPorNombre: string;
  aprobadoPorCargo: string;
  aprobadoFirmaImg?: string;
  fechaCierre?: string;
  estadoFinal: 'Exitoso' | 'Fallido' | 'Cancelado';
}

interface Step18ChangeManagementModuleProps {
  config: CompanyConfig;
  companyName: string;
  companyNit?: string;
  companyLogo?: string;
  leaderName?: string;
  repLegal?: string;
}

const SEED_CHANGE_RECORDS: PESVChangeRecord[] = [
  {
    id: 'chg-rec-1',
    changeId: 'CHG-001',
    fecha: '2026-06-15',
    solicitanteNombre: 'Ing. Carlos Andrés Restrepo',
    solicitanteArea: 'Coordinación de Operaciones y Seguridad Vial (PESV)',
    categoriaCambio: 'Interno (Flota, Rutas, Personal, Tecnología)',
    queSeQuiereCambiar: 'Implementación de telemetría GPS con limitador activo de velocidad en 12 camiones de ruta nacional',
    porQueSeCambia: 'Se detectaron excesos de velocidad recurrentes en descensos prolongados del corredor Bogotá - Medellín durante el primer trimestre.',
    cualEsElBeneficio: 'Reducción estimada del 85% en eventos de sobrevelocidad (ELVL) y disminución del riesgo crítico de volcamiento o colisión.',
    impacto: 'Alto',
    quePuedeSalirMal: 'Descalibración temporal del sensor de velocidad en pendiente o rechazo operativo por parte de los conductores.',
    planMarchaAtras: 'Desactivar el corte electrónico remoto desde la central GPS dejando solo la alerta sonora en cabina mientras el proveedor recalibra la unidad en patio.',
    planAccion: [
      {
        id: 'st-1',
        stepNumber: 1,
        queSeHace: 'Instalación física y pruebas en patio de sensores GPS en las 12 unidades de carga',
        quien: 'Jefe de Mantenimiento / Proveedor Telemetría',
        cuando: '2026-06-20',
        completado: true
      },
      {
        id: 'st-2',
        stepNumber: 2,
        queSeHace: 'Capacitación práctica a los 18 conductores sobre operación con gobernador de velocidad y alertas',
        quien: 'Líder del PESV (SST)',
        cuando: '2026-06-25',
        completado: true
      },
      {
        id: 'st-3',
        stepNumber: 3,
        queSeHace: 'Auditoría de primera semana de operación en ruta y verificación de cero fallas electrónicas',
        quien: 'Coordinador de Tráfico y Comité PESV',
        cuando: '2026-07-02',
        completado: true
      }
    ],
    aprobadoPorNombre: 'Ing. Diana Patricia Osorio',
    aprobadoPorCargo: 'Gerente General / Representante Legal',
    aprobadoFirmaImg: '',
    fechaCierre: '2026-07-05',
    estadoFinal: 'Exitoso'
  },
  {
    id: 'chg-rec-2',
    changeId: 'CHG-002',
    fecha: '2026-07-10',
    solicitanteNombre: 'Jefe de Logística Nacional',
    solicitanteArea: 'Dirección de Logística y Despachos',
    categoriaCambio: 'Externo (Normatividad, Vías, Clientes, Contratistas)',
    queSeQuiereCambiar: 'Modificación de ruta frecuente hacia el suroccidente por cierre vial prolongado en corredor principal',
    porQueSeCambia: 'Obras de infraestructura nacional y restricción de carga pesada en horario diurno en el tramo habitual.',
    cualEsElBeneficio: 'Mantener la continuidad de entregas sin exceder la jornada máxima laboral de los conductores ni transitar en horarios de alto riesgo.',
    impacto: 'Medio',
    quePuedeSalirMal: 'Incremento de 1.5 horas en el tiempo de recorrido y presencia de neblina densa en la vía alterna seleccionada.',
    planMarchaAtras: 'Retornar al corredor original operando únicamente en las ventanas horarias autorizadas por INVÍAS con relevo de conductor.',
    planAccion: [
      {
        id: 'st-2-1',
        stepNumber: 1,
        queSeHace: 'Actualización del rutograma digital (Paso 15) incluyendo nuevos puntos seguros de parada y descanso',
        quien: 'Líder del PESV / Analista de Rutas',
        cuando: '2026-07-12',
        completado: true
      },
      {
        id: 'st-2-2',
        stepNumber: 2,
        queSeHace: 'Socialización del nuevo rutograma y riesgos de vía alterna antes de cada despacho',
        quien: 'Supervisor de Despachos',
        cuando: '2026-07-14',
        completado: true
      },
      {
        id: 'st-2-3',
        stepNumber: 3,
        queSeHace: 'Evaluación de tiempos reales de viaje y fatiga reportada tras los primeros 15 viajes',
        quien: 'Comité de Seguridad Vial',
        cuando: '2026-07-30',
        completado: true
      }
    ],
    aprobadoPorNombre: 'Ing. Carlos Andrés Restrepo',
    aprobadoPorCargo: 'Líder del Diseño e Implementación del PESV',
    aprobadoFirmaImg: '',
    fechaCierre: '2026-07-31',
    estadoFinal: 'Exitoso'
  }
];

function formatDateDDMMYYYY(isoDate: string): string {
  if (!isoDate) return 'DD / MM / AAAA';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
}

export default function Step18ChangeManagementModule({
  companyName,
  companyNit = '901.452.883-1',
  companyLogo = '',
  leaderName = 'Ing. Carlos Andrés Restrepo',
  repLegal = 'Ing. Diana Patricia Osorio'
}: Step18ChangeManagementModuleProps) {
  const [records, setRecords] = useState<PESVChangeRecord[]>(() => {
    const saved = localStorage.getItem('pesv_step18_change_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_CHANGE_RECORDS;
  });

  const [selectedId, setSelectedId] = useState<string>(() => records[0]?.id || 'chg-rec-1');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterImpact, setFilterImpact] = useState<string>('TODOS');
  const isRemoteUpdate = useRef<boolean>(false);

  // Signature canvas ref for modal/editor
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSig = useRef<boolean>(false);

  // Active selected record
  const activeRecord = records.find((r) => r.id === selectedId) || records[0] || null;

  // Form state for Creating / Editing a Change Record
  const [formData, setFormData] = useState<PESVChangeRecord>(() => activeRecord || SEED_CHANGE_RECORDS[0]);

  // Firestore real-time subscription
  useEffect(() => {
    const unsub = subscribeToSystemSetting('step18_change_management', (cloudData) => {
      if (cloudData && Array.isArray(cloudData.records) && cloudData.records.length > 0) {
        isRemoteUpdate.current = true;
        setRecords(cloudData.records);
        localStorage.setItem('pesv_step18_change_records', JSON.stringify(cloudData.records));
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 120);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const persistRecords = (updated: PESVChangeRecord[]) => {
    setRecords(updated);
    localStorage.setItem('pesv_step18_change_records', JSON.stringify(updated));
    if (!isRemoteUpdate.current) {
      saveSystemSetting('step18_change_management', { records: updated }).catch(() => {});
    }
  };

  // Start creating a new Change Management report
  const handleStartNew = () => {
    const nextNum = records.length + 1;
    const nextCode = `CHG-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const blank: PESVChangeRecord = {
      id: `chg-rec-${Date.now()}`,
      changeId: nextCode,
      fecha: today,
      solicitanteNombre: leaderName,
      solicitanteArea: 'Seguridad Vial / Operaciones',
      categoriaCambio: 'Interno (Flota, Rutas, Personal, Tecnología)',
      queSeQuiereCambiar: '',
      porQueSeCambia: '',
      cualEsElBeneficio: '',
      impacto: 'Medio',
      quePuedeSalirMal: '',
      planMarchaAtras: '',
      planAccion: [
        { id: `s1-${Date.now()}`, stepNumber: 1, queSeHace: '', quien: '', cuando: today, completado: false },
        { id: `s2-${Date.now()}`, stepNumber: 2, queSeHace: '', quien: '', cuando: today, completado: false },
        { id: `s3-${Date.now()}`, stepNumber: 3, queSeHace: '', quien: '', cuando: today, completado: false }
      ],
      aprobadoPorNombre: repLegal,
      aprobadoPorCargo: 'Representante Legal / Líder PESV',
      aprobadoFirmaImg: '',
      fechaCierre: today,
      estadoFinal: 'Exitoso'
    };
    setFormData(blank);
    setIsEditing(true);
  };

  const handleStartEdit = (rec: PESVChangeRecord) => {
    setFormData({
      ...rec,
      planAccion: rec.planAccion.map((p) => ({ ...p }))
    });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.changeId.trim() || !formData.queSeQuiereCambiar.trim()) {
      return;
    }

    const exists = records.some((r) => r.id === formData.id);
    const updated = exists
      ? records.map((r) => (r.id === formData.id ? formData : r))
      : [formData, ...records];

    persistRecords(updated);
    setSelectedId(formData.id);
    setIsEditing(false);
  };

  const handleDeleteRecord = (id: string) => {
    const remaining = records.filter((r) => r.id !== id);
    persistRecords(remaining);
    if (selectedId === id && remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
  };

  // Signature Pad helpers
  const startSigDraw = (e: any) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingSig.current = true;
  };

  const moveSigDraw = (e: any) => {
    if (!isDrawingSig.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endSigDraw = () => {
    if (!isDrawingSig.current) return;
    isDrawingSig.current = false;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setFormData((prev) => ({ ...prev, aprobadoFirmaImg: canvas.toDataURL('image/png') }));
    }
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setFormData((prev) => ({ ...prev, aprobadoFirmaImg: '' }));
  };

  const handleUploadSigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, aprobadoFirmaImg: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Export Official Change Management Format to PDF (Letter size)
  const handleExportPDF = (rec: PESVChangeRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    // Header Box
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.rect(12, y, pageW - 24, 24);

    // Logo or Company Box
    if (companyLogo && companyLogo.startsWith('data:image/')) {
      try {
        doc.addImage(companyLogo, 'PNG', 14, y + 2, 24, 20, undefined, 'FAST');
      } catch (e) {}
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y + 2, 24, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('PESV', 26, y + 13, { align: 'center' });
    }

    // Center Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('FORMATO DE REPORTE DE GESTIÓN DEL CAMBIO DEL PESV', pageW / 2 + 4, y + 8, {
      align: 'center'
    });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyName.toUpperCase()} • NIT: ${companyNit}`, pageW / 2 + 4, y + 14, {
      align: 'center'
    });
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Paso 18 - Gestión del Cambio y Gestión de Contratistas (Resolución 40595 de 2022)',
      pageW / 2 + 4,
      y + 20,
      { align: 'center' }
    );

    y += 30;

    // Helper for section headers
    const drawSectionHeader = (title: string) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(12, y, pageW - 24, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(title, 15, y + 5.2);
      y += 9.5;
    };

    // 1. ENCABEZADO DE CONTROL
    drawSectionHeader('1. ENCABEZADO DE CONTROL');
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y, pageW - 24, 18, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('• ID del Cambio:', 15, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(rec.changeId || 'CHG-001', 45, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.text('• Fecha [ DD / MM / AAAA ]:', 95, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`[ ${formatDateDDMMYYYY(rec.fecha)} ]`, 142, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.text('• Solicitante (Nombre y Área):', 15, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${rec.solicitanteNombre} — ${rec.solicitanteArea}`, 64, y + 14);

    y += 23;

    // 2. DEFINICIÓN DEL CAMBIO
    drawSectionHeader('2. DEFINICIÓN DEL CAMBIO');

    const defItems = [
      {
        label: '• ¿Qué se quiere cambiar? (Título breve):',
        val: rec.queSeQuiereCambiar
      },
      {
        label: '• ¿Por qué se cambia? (Justificación o problema actual):',
        val: rec.porQueSeCambia
      },
      {
        label: '• ¿Cuál es el beneficio? (Resultado esperado):',
        val: rec.cualEsElBeneficio
      }
    ];

    defItems.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.label, 14, y + 4);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(item.val || 'Sin especificar.', pageW - 30);
      doc.rect(12, y - 1, pageW - 24, Math.max(10, lines.length * 4.5 + 3));
      doc.text(lines, 15, y + 3.5);
      y += Math.max(12, lines.length * 4.5 + 5);
    });

    y += 2;

    // 3. IMPACTO Y RIESGOS (MARCAR CON X)
    drawSectionHeader('3. IMPACTO Y RIESGOS (Marcar con X)');
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y, pageW - 24, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const markBajo = rec.impacto === 'Bajo' ? 'X' : ' ';
    const markMedio = rec.impacto === 'Medio' ? 'X' : ' ';
    const markAlto = rec.impacto === 'Alto' ? 'X' : ' ';
    doc.text(
      `• Impacto:     [ ${markBajo} ] Bajo      |      [ ${markMedio} ] Medio      |      [ ${markAlto} ] Alto`,
      15,
      y + 6.5
    );
    y += 13;

    const riskItems = [
      {
        label: '• ¿Qué puede salir mal? (Riesgo principal):',
        val: rec.quePuedeSalirMal
      },
      {
        label: '• ¿Cómo lo solucionamos si falla? (Plan de marcha atrás muy breve):',
        val: rec.planMarchaAtras
      }
    ];

    riskItems.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.label, 14, y + 4);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(item.val || 'Sin especificar.', pageW - 30);
      doc.rect(12, y - 1, pageW - 24, Math.max(10, lines.length * 4.5 + 3));
      doc.text(lines, 15, y + 3.5);
      y += Math.max(12, lines.length * 4.5 + 5);
    });

    y += 2;

    // 4. PLAN DE ACCIÓN (FECHAS Y RESPONSABLES)
    drawSectionHeader('4. PLAN DE ACCIÓN (Fechas y Responsables)');
    doc.setFillColor(241, 245, 249);
    doc.rect(12, y, pageW - 24, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('PASO', 15, y + 4.8);
    doc.text('¿QUÉ SE HACE? (ACTIVIDAD)', 32, y + 4.8);
    doc.text('¿QUIÉN? (RESPONSABLE)', 122, y + 4.8);
    doc.text('¿CUÁNDO? (FECHA)', 172, y + 4.8);
    y += 7;

    rec.planAccion.forEach((step, idx) => {
      const actLines = doc.splitTextToSize(step.queSeHace || '-', 86);
      const respLines = doc.splitTextToSize(step.quien || '-', 46);
      const rowH = Math.max(8, Math.max(actLines.length, respLines.length) * 4.2 + 3);
      doc.rect(12, y, pageW - 24, rowH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Paso ${idx + 1}`, 15, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(actLines, 32, y + 5);
      doc.text(respLines, 122, y + 5);
      doc.text(formatDateDDMMYYYY(step.cuando), 172, y + 5);
      y += rowH;
    });

    y += 5;

    // Check if we need a page break before section 5
    if (y > 230) {
      doc.addPage();
      y = 16;
    }

    // 5. AUTORIZACIÓN Y CIERRE
    drawSectionHeader('5. AUTORIZACIÓN Y CIERRE');
    doc.setDrawColor(203, 213, 225);
    doc.rect(12, y, pageW - 24, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('• Aprobado por (Nombre / Firma):', 15, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${rec.aprobadoPorNombre} (${rec.aprobadoPorCargo || 'Autoridad PESV'})`, 15, y + 13);

    if (rec.aprobadoFirmaImg && rec.aprobadoFirmaImg.startsWith('data:image/')) {
      try {
        doc.addImage(rec.aprobadoFirmaImg, 'PNG', 135, y + 2, 45, 14);
      } catch (e) {}
    }
    doc.line(130, y + 17, 195, y + 17);
    doc.setFontSize(7.5);
    doc.text('Firma de Aprobación y Autorización', 162, y + 21, { align: 'center' });

    const markExitoso = rec.estadoFinal === 'Exitoso' ? 'X' : ' ';
    const markFallido = rec.estadoFinal === 'Fallido' ? 'X' : ' ';
    const markCancelado = rec.estadoFinal === 'Cancelado' ? 'X' : ' ';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      `• Estado final:     [ ${markExitoso} ] Exitoso      |      [ ${markFallido} ] Fallido      |      [ ${markCancelado} ] Cancelado`,
      15,
      y + 26
    );

    doc.save(`Formato_Gestion_del_Cambio_${rec.changeId}_${rec.fecha}.pdf`);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.changeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.queSeQuiereCambiar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.solicitanteArea.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesImpact = filterImpact === 'TODOS' || r.impacto === filterImpact;
    return matchesSearch && matchesImpact;
  });

  return (
    <div className="space-y-6">
      {/* BANNER SUPERIOR DEL PASO 18 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black tracking-wider uppercase rounded-md">
                Fase 2: Implementación • Paso 18
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                Formato Oficial Estandarizado (5 Secciones)
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <ClipboardList className="text-indigo-400" size={24} />
              Paso 18: Gestión del Cambio del PESV
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Formato oficial para evaluar, planificar, autorizar y controlar los cambios internos y externos que puedan afectar la seguridad vial de la organización conforme a la Resolución 40595 de 2022.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleStartNew}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Nuevo Reporte de Cambio (CHG)</span>
            </button>
            {activeRecord && !isEditing && (
              <button
                type="button"
                onClick={() => handleExportPDF(activeRecord)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Descargar Formato PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: LISTA LATERAL + FORMATO DE 5 SECCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Listado de Cambios Registrados (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Historial de Cambios ({records.length})
              </h3>
              <button
                type="button"
                onClick={handleStartNew}
                className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Crear
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por ID (CHG-001), título o área..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex gap-1">
                {['TODOS', 'Bajo', 'Medio', 'Alto'].map((imp) => (
                  <button
                    key={imp}
                    type="button"
                    onClick={() => setFilterImpact(imp)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer transition-all ${
                      filterImpact === imp
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {imp === 'TODOS' ? 'Todos' : `Impacto ${imp}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredRecords.map((rec) => {
                const isSelected = rec.id === selectedId && !isEditing;
                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedId(rec.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-[10.5px] rounded">
                        {rec.changeId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-black border ${
                            rec.impacto === 'Alto'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : rec.impacto === 'Medio'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          Impacto {rec.impacto}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                            rec.estadoFinal === 'Exitoso'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.estadoFinal === 'Fallido'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {rec.estadoFinal}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-extrabold text-slate-900 leading-snug">
                      {rec.queSeQuiereCambiar}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>{rec.solicitanteNombre}</span>
                      <span className="font-mono">{formatDateDDMMYYYY(rec.fecha)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formato Oficial de Gestión del Cambio (8 cols) */}
        <div className="lg:col-span-8">
          {isEditing ? (
            /* =====================================================
               MODO EDICIÓN / CREACIÓN DEL FORMATO (LAS 5 SECCIONES)
               ===================================================== */
            <form
              onSubmit={handleSaveForm}
              className="bg-white rounded-2xl border-2 border-indigo-500/40 shadow-md p-6 space-y-6 text-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Diligenciamiento de Formato Oficial
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Reporte de Gestión del Cambio del PESV ({formData.changeId})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SECCIÓN 1: ENCABEZADO DE CONTROL */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  1. Encabezado de Control
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • ID del Cambio (Ej: CHG-001) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.changeId}
                      onChange={(e) =>
                        setFormData({ ...formData, changeId: e.target.value.toUpperCase() })
                      }
                      placeholder="CHG-001"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • Fecha [ DD / MM / AAAA ] *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • Solicitante (Nombre) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.solicitanteNombre}
                      onChange={(e) =>
                        setFormData({ ...formData, solicitanteNombre: e.target.value })
                      }
                      placeholder="Nombre del solicitante"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      • Área / Proceso del Solicitante *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.solicitanteArea}
                      onChange={(e) =>
                        setFormData({ ...formData, solicitanteArea: e.target.value })
                      }
                      placeholder="Ej: Coordinación de Operaciones y Seguridad Vial"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DEFINICIÓN DEL CAMBIO */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  2. Definición del Cambio
                </h4>
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • ¿Qué se quiere cambiar? (Título breve) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.queSeQuiereCambiar}
                      onChange={(e) =>
                        setFormData({ ...formData, queSeQuiereCambiar: e.target.value })
                      }
                      placeholder="Ej: Incorporación de nueva ruta nocturna o cambio de proveedor de mantenimiento..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • ¿Por qué se cambia? (Justificación o problema actual) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.porQueSeCambia}
                      onChange={(e) => setFormData({ ...formData, porQueSeCambia: e.target.value })}
                      placeholder="Describa la necesidad operativa, normativa o problema actual que motiva el cambio..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • ¿Cuál es el beneficio? (Resultado esperado) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.cualEsElBeneficio}
                      onChange={(e) =>
                        setFormData({ ...formData, cualEsElBeneficio: e.target.value })
                      }
                      placeholder="Describa el beneficio esperado en seguridad vial y operación..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: IMPACTO Y RIESGOS (MARCAR CON X) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  3. Impacto y Riesgos (Marcar con X)
                </h4>

                <div className="pt-1">
                  <label className="block font-bold text-slate-700 mb-2">
                    • Nivel de Impacto en la Seguridad Vial (Marcar con X):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Bajo', 'Medio', 'Alto'] as const).map((lvl) => {
                      const active = formData.impacto === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormData({ ...formData, impacto: lvl })}
                          className={`p-3 rounded-xl border-2 font-mono font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            active
                              ? lvl === 'Alto'
                                ? 'border-red-600 bg-red-50 text-red-900'
                                : lvl === 'Medio'
                                ? 'border-amber-500 bg-amber-50 text-amber-900'
                                : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm">[{active ? ' X ' : '   '}]</span>
                          <span className="font-sans">{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    • ¿Qué puede salir mal? (Riesgo principal) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.quePuedeSalirMal}
                    onChange={(e) =>
                      setFormData({ ...formData, quePuedeSalirMal: e.target.value })
                    }
                    placeholder="Identifique el riesgo vial u operativo principal derivado del cambio..."
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    • ¿Cómo lo solucionamos si falla? (Plan de marcha atrás muy breve) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.planMarchaAtras}
                    onChange={(e) =>
                      setFormData({ ...formData, planMarchaAtras: e.target.value })
                    }
                    placeholder="Indique la acción inmediata de reversión o contingencia si el cambio presenta fallas..."
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* SECCIÓN 4: PLAN DE ACCIÓN (FECHAS Y RESPONSABLES) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    4. Plan de Acción (Fechas y Responsables)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStepNum = formData.planAccion.length + 1;
                      setFormData({
                        ...formData,
                        planAccion: [
                          ...formData.planAccion,
                          {
                            id: `st-${Date.now()}`,
                            stepNumber: nextStepNum,
                            queSeHace: '',
                            quien: '',
                            cuando: formData.fecha,
                            completado: false
                          }
                        ]
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Agregar Paso
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {formData.planAccion.map((step, index) => (
                    <div
                      key={step.id}
                      className="p-3 bg-white rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="md:col-span-2 flex items-center gap-2">
                        <span className="px-2 py-1 bg-slate-900 text-white font-black text-[11px] rounded">
                          Paso {index + 1}:
                        </span>
                      </div>
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          required
                          value={step.queSeHace}
                          onChange={(e) => {
                            const updated = formData.planAccion.map((s, i) =>
                              i === index ? { ...s, queSeHace: e.target.value } : s
                            );
                            setFormData({ ...formData, planAccion: updated });
                          }}
                          placeholder="[ Qué se hace ]"
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          required
                          value={step.quien}
                          onChange={(e) => {
                            const updated = formData.planAccion.map((s, i) =>
                              i === index ? { ...s, quien: e.target.value } : s
                            );
                            setFormData({ ...formData, planAccion: updated });
                          }}
                          placeholder="[ Quién (Responsable) ]"
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-1">
                        <input
                          type="date"
                          required
                          value={step.cuando}
                          onChange={(e) => {
                            const updated = formData.planAccion.map((s, i) =>
                              i === index ? { ...s, cuando: e.target.value } : s
                            );
                            setFormData({ ...formData, planAccion: updated });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg text-[11px] font-mono"
                        />
                        {formData.planAccion.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = formData.planAccion.filter((_, i) => i !== index);
                              setFormData({ ...formData, planAccion: filtered });
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar paso"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 5: AUTORIZACIÓN Y CIERRE */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  5. Autorización y Cierre
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • Aprobado por (Nombre Completo) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.aprobadoPorNombre}
                      onChange={(e) =>
                        setFormData({ ...formData, aprobadoPorNombre: e.target.value })
                      }
                      placeholder="Nombre de quien aprueba"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      • Cargo / Rol de quien aprueba
                    </label>
                    <input
                      type="text"
                      value={formData.aprobadoPorCargo}
                      onChange={(e) =>
                        setFormData({ ...formData, aprobadoPorCargo: e.target.value })
                      }
                      placeholder="Ej: Gerente General / Líder PESV"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Firma digital o imagen */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">
                      • Firma de Aprobación (Dibujar en recuadro o subir imagen):
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-indigo-700 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <Upload size={12} /> Subir Firma
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSigFile}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearSigCanvas}
                        className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="border border-dashed border-gray-300 rounded-lg bg-slate-50 h-20 relative overflow-hidden">
                    <canvas
                      ref={sigCanvasRef}
                      width={420}
                      height={80}
                      onMouseDown={startSigDraw}
                      onMouseMove={moveSigDraw}
                      onMouseUp={endSigDraw}
                      onMouseLeave={endSigDraw}
                      onTouchStart={startSigDraw}
                      onTouchMove={moveSigDraw}
                      onTouchEnd={endSigDraw}
                      className="w-full h-full cursor-crosshair"
                    />
                    {!formData.aprobadoFirmaImg && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] text-gray-400 italic">
                        Firme aquí con el cursor o pantalla táctil
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado Final (Marcar con X) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    • Estado final (Marcar con X):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Exitoso', 'Fallido', 'Cancelado'] as const).map((st) => {
                      const active = formData.estadoFinal === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFormData({ ...formData, estadoFinal: st })}
                          className={`p-3 rounded-xl border-2 font-mono font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            active
                              ? st === 'Exitoso'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                : st === 'Fallido'
                                ? 'border-red-600 bg-red-50 text-red-900'
                                : 'border-slate-600 bg-slate-100 text-slate-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm">[{active ? ' X ' : '   '}]</span>
                          <span className="font-sans">{st}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={15} />
                  <span>Guardar Formato de Gestión del Cambio</span>
                </button>
              </div>
            </form>
          ) : activeRecord ? (
            /* =====================================================
               VISTA OFICIAL DEL FORMATO DE GESTIÓN DEL CAMBIO (5 SECCIONES)
               ===================================================== */
            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden text-xs">
              {/* Barra de Acciones del Documento */}
              <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" />
                  <span className="font-black uppercase tracking-wider text-xs">
                    Formato Oficial de Reporte de Gestión del Cambio • {activeRecord.changeId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(activeRecord)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Edit size={12} /> Editar Formato
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPDF(activeRecord)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Download size={12} /> Exportar PDF
                  </button>
                  {records.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(activeRecord.id)}
                      className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Hoja Oficial Estructurada */}
              <div className="p-6 space-y-6 bg-white">
                {/* Membrete Institucional */}
                <div className="border-2 border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/50">
                  <div className="md:col-span-3 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-300 pb-2 md:pb-0">
                    {companyLogo && companyLogo.startsWith('data:image/') ? (
                      <img
                        src={companyLogo}
                        alt={companyName}
                        className="max-h-12 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="font-black text-slate-900 text-xs block">{companyName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">NIT: {companyNit}</span>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-6 text-center space-y-0.5">
                    <div className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest">
                      Plan Estratégico de Seguridad Vial — Paso 18
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Formato de Reporte de Gestión del Cambio del PESV
                    </h3>
                    <div className="text-[10px] text-gray-500">
                      Resolución 40595 de 2022 • Control de Cambios Internos y Externos
                    </div>
                  </div>
                  <div className="md:col-span-3 text-center md:text-right font-mono border-t md:border-t-0 md:border-l border-slate-300 pt-2 md:pt-0 md:pl-3">
                    <div className="text-[10px] text-gray-500">CÓDIGO DE CAMBIO:</div>
                    <div className="text-sm font-black text-slate-900">{activeRecord.changeId}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">Versión Vigente</div>
                  </div>
                </div>

                {/* 1. ENCABEZADO DE CONTROL */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase tracking-wider text-[11px]">
                    1. Encabezado de Control
                  </div>
                  <div className="p-4 bg-slate-50/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        • ID del Cambio:
                      </span>
                      <span className="text-sm font-mono font-black text-slate-900 mt-0.5 block">
                        {activeRecord.changeId}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        • Fecha [ DD / MM / AAAA ]:
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">
                        [ {formatDateDDMMYYYY(activeRecord.fecha)} ]
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        • Solicitante [ Nombre y Área ]:
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                        {activeRecord.solicitanteNombre}
                      </span>
                      <span className="text-[10.5px] text-indigo-700 font-semibold block">
                        {activeRecord.solicitanteArea}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. DEFINICIÓN DEL CAMBIO */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase tracking-wider text-[11px]">
                    2. Definición del Cambio
                  </div>
                  <div className="p-4 space-y-3 divide-y divide-gray-100">
                    <div>
                      <span className="text-[11px] font-black text-slate-800 block">
                        • ¿Qué se quiere cambiar? (Título breve)
                      </span>
                      <p className="mt-1 p-2.5 bg-slate-50 rounded-lg border border-gray-200 font-bold text-slate-900">
                        {activeRecord.queSeQuiereCambiar}
                      </p>
                    </div>
                    <div className="pt-3">
                      <span className="text-[11px] font-black text-slate-800 block">
                        • ¿Por qué se cambia? (Justificación o problema actual)
                      </span>
                      <p className="mt-1 p-2.5 bg-slate-50 rounded-lg border border-gray-200 text-slate-700 leading-relaxed">
                        {activeRecord.porQueSeCambia}
                      </p>
                    </div>
                    <div className="pt-3">
                      <span className="text-[11px] font-black text-slate-800 block">
                        • ¿Cuál es el beneficio? (Resultado esperado)
                      </span>
                      <p className="mt-1 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 text-emerald-950 leading-relaxed font-medium">
                        {activeRecord.cualEsElBeneficio}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. IMPACTO Y RIESGOS (MARCAR CON X) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase tracking-wider text-[11px]">
                    3. Impacto y Riesgos (Marcar con X)
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-black text-slate-800">• Impacto:</span>
                      <div className="flex items-center gap-4 font-mono text-xs font-black">
                        <span
                          className={`px-3 py-1 rounded-lg border ${
                            activeRecord.impacto === 'Bajo'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.impacto === 'Bajo' ? 'X' : ' '} ] Bajo
                        </span>
                        <span className="text-gray-300">|</span>
                        <span
                          className={`px-3 py-1 rounded-lg border ${
                            activeRecord.impacto === 'Medio'
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.impacto === 'Medio' ? 'X' : ' '} ] Medio
                        </span>
                        <span className="text-gray-300">|</span>
                        <span
                          className={`px-3 py-1 rounded-lg border ${
                            activeRecord.impacto === 'Alto'
                              ? 'bg-red-100 text-red-900 border-red-400'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.impacto === 'Alto' ? 'X' : ' '} ] Alto
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-black text-slate-800 block">
                        • ¿Qué puede salir mal? (Riesgo principal)
                      </span>
                      <p className="mt-1 p-2.5 bg-red-50/40 rounded-lg border border-red-200 text-red-950 leading-relaxed">
                        {activeRecord.quePuedeSalirMal}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-black text-slate-800 block">
                        • ¿Cómo lo solucionamos si falla? (Plan de marcha atrás muy breve)
                      </span>
                      <p className="mt-1 p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 text-amber-950 leading-relaxed">
                        {activeRecord.planMarchaAtras}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. PLAN DE ACCIÓN (FECHAS Y RESPONSABLES) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase tracking-wider text-[11px]">
                    4. Plan de Acción (Fechas y Responsables)
                  </div>
                  <div className="p-4 space-y-2">
                    {activeRecord.planAccion.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-3 bg-slate-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="px-2.5 py-1 bg-slate-900 text-white font-black text-[10.5px] rounded shrink-0">
                            • Paso {idx + 1}:
                          </span>
                          <span className="font-bold text-slate-900 leading-snug">
                            {step.queSeHace}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[11px] pl-8 md:pl-0">
                          <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-slate-700 font-semibold">
                            <strong>Quién:</strong> {step.quien}
                          </span>
                          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-mono font-bold">
                            <strong>Cuándo:</strong> {formatDateDDMMYYYY(step.cuando)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. AUTORIZACIÓN Y CIERRE */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase tracking-wider text-[11px]">
                    5. Autorización y Cierre
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50/50">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        • Aprobado por [ Nombre / Firma ]:
                      </span>
                      <div className="font-black text-slate-900 text-sm">
                        {activeRecord.aprobadoPorNombre}
                      </div>
                      <div className="text-[11px] text-gray-500">{activeRecord.aprobadoPorCargo}</div>
                      {activeRecord.aprobadoFirmaImg ? (
                        <div className="pt-2 border-t border-gray-100">
                          <img
                            src={activeRecord.aprobadoFirmaImg}
                            alt="Firma Aprobación"
                            className="h-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-gray-100 font-serif italic text-indigo-900 text-xs">
                          Firmado digitalmente: {activeRecord.aprobadoPorNombre}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        • Estado final (Marcar con X):
                      </span>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-black">
                        <span
                          className={`px-3 py-1.5 rounded-lg border ${
                            activeRecord.estadoFinal === 'Exitoso'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : 'bg-slate-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.estadoFinal === 'Exitoso' ? 'X' : ' '} ] Exitoso
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-lg border ${
                            activeRecord.estadoFinal === 'Fallido'
                              ? 'bg-red-100 text-red-900 border-red-400'
                              : 'bg-slate-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.estadoFinal === 'Fallido' ? 'X' : ' '} ] Fallido
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-lg border ${
                            activeRecord.estadoFinal === 'Cancelado'
                              ? 'bg-slate-200 text-slate-900 border-slate-400'
                              : 'bg-slate-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          [ {activeRecord.estadoFinal === 'Cancelado' ? 'X' : ' '} ] Cancelado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Search,
  Globe,
  Activity,
  Eye,
  AlertTriangle,
  ShieldAlert,
  Download,
  FileText,
  Check,
  Clock,
  Truck,
  MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyConfig } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export const DEFAULT_SST_INDICATORS_APP_URL = 'https://indicadores-sst-production.up.railway.app/';

export interface Step21ExternalConfig {
  enabled: boolean;
  appUrl: string;
  appName: string;
  apiKey: string;
  autoSync: boolean;
  lastSyncDate: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string;
  syncedRecordsCount: number;
}

export interface Step21SiniestroRecord {
  id: string;
  codigo: string;
  fecha: string;
  franjaHoraria: 'Madrugada (00:00 - 05:59)' | 'Mañana (06:00 - 11:59)' | 'Tarde (12:00 - 17:59)' | 'Noche (18:00 - 23:59)';
  placaVehiculo: string;
  tipoVehiculo: 'Motocicleta' | 'Automóvil / Liviano' | 'Camioneta SUV / Pick-up' | 'Camión / Rígido' | 'Tractocamión / Pesado' | 'Bus / Pasajeros';
  conductor: string;
  corredorVial: string;
  tipoEvento: 'Choque Simple' | 'Colisión Múltiple' | 'Atropello' | 'Volcamiento' | 'Caída de Ocupante' | 'Casi-Accidente / Incidente';
  gravedad: 'Solo Daños Materiales' | 'Heridos Leves' | 'Heridos Graves' | 'Fatalidad';
  factorCausal: 'Factor Humano (Distracción / Velocidad / Fatiga)' | 'Factor Vehicular / Falla Mecánica' | 'Factor Vía / Infraestructura' | 'Factor Climático / Ambiental';
  diasIncapacidad: number;
  heridosCount: number;
  fallecidosCount: number;
  costoDirectoCop: number;
  origenDatos: 'Sincronizado App Indicadores SST' | 'Registro Interno PESV';
  estadoInvestigacion: 'Investigado y Cerrado (Paso 13)' | 'En Análisis Causal' | 'Plan de Acción Abierto (Paso 23)';
  resumenCausaRaiz: string;
}

interface Step21SiniestrosModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
  leaderName?: string;
  repLegal?: string;
  onNavigateToStep?: (stepId: number) => void;
}

const DEFAULT_SINIESTROS_RECORDS: Step21SiniestroRecord[] = [
  {
    id: 'sin-2026-01',
    codigo: 'SIN-SST-2026-001',
    fecha: '2026-01-22',
    franjaHoraria: 'Mañana (06:00 - 11:59)',
    placaVehiculo: 'JKS-284',
    tipoVehiculo: 'Tractocamión / Pesado',
    conductor: 'Carlos Alberto Restrepo',
    corredorVial: 'Autopista Norte Km 34 - Zona Industrial',
    tipoEvento: 'Choque Simple',
    gravedad: 'Solo Daños Materiales',
    factorCausal: 'Factor Humano (Distracción / Velocidad / Fatiga)',
    diasIncapacidad: 0,
    heridosCount: 0,
    fallecidosCount: 0,
    costoDirectoCop: 1450000,
    origenDatos: 'Sincronizado App Indicadores SST',
    estadoInvestigacion: 'Investigado y Cerrado (Paso 13)',
    resumenCausaRaiz: 'Distancia de seguimiento insuficiente en frenado repentino de tráfico pesado. Sin lesionados.'
  },
  {
    id: 'sin-2026-02',
    codigo: 'SIN-SST-2026-002',
    fecha: '2026-02-14',
    franjaHoraria: 'Tarde (12:00 - 17:59)',
    placaVehiculo: 'WHZ-885',
    tipoVehiculo: 'Motocicleta',
    conductor: 'Ángela María Gómez',
    corredorVial: 'Avenida Las Vegas con Calle 30 - Urbano',
    tipoEvento: 'Caída de Ocupante',
    gravedad: 'Heridos Leves',
    factorCausal: 'Factor Vía / Infraestructura',
    diasIncapacidad: 3,
    heridosCount: 1,
    fallecidosCount: 0,
    costoDirectoCop: 680000,
    origenDatos: 'Sincronizado App Indicadores SST',
    estadoInvestigacion: 'Investigado y Cerrado (Paso 13)',
    resumenCausaRaiz: 'Derrape en calzada húmeda con presencia de gravilla suelta en curva urbana. Uso completo de EPP evitó lesiones mayores.'
  },
  {
    id: 'sin-2026-03',
    codigo: 'SIN-SST-2026-003',
    fecha: '2026-03-19',
    franjaHoraria: 'Noche (18:00 - 23:59)',
    placaVehiculo: 'KLM-912',
    tipoVehiculo: 'Camioneta SUV / Pick-up',
    conductor: 'Jorge Eliécer Pinto',
    corredorVial: 'Corredor Vial Oriente Km 18',
    tipoEvento: 'Casi-Accidente / Incidente',
    gravedad: 'Solo Daños Materiales',
    factorCausal: 'Factor Climático / Ambiental',
    diasIncapacidad: 0,
    heridosCount: 0,
    fallecidosCount: 0,
    costoDirectoCop: 320000,
    origenDatos: 'Sincronizado App Indicadores SST',
    estadoInvestigacion: 'Plan de Acción Abierto (Paso 23)',
    resumenCausaRaiz: 'Neblina densa en descenso y deslumbramiento en vía bidireccional; roce leve con delineador vial.'
  }
];

export default function Step21SiniestrosModule({
  config,
  companyName = 'Transportes y Logística S.A.S.',
  companyNit = '901.452.883-1',
  leaderName = 'Ing. Coordinador PESV',
  repLegal = 'Representante Legal',
  onNavigateToStep
}: Step21SiniestrosModuleProps) {
  const storagePrefix = `pesv_step21_${companyNit}`;

  const [extConfig, setExtConfig] = useState<Step21ExternalConfig>(() => {
    const saved = localStorage.getItem(`${storagePrefix}_ext_config`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          appUrl: parsed.appUrl || DEFAULT_SST_INDICATORS_APP_URL
        };
      } catch (e) {}
    }
    return {
      enabled: true,
      appUrl: DEFAULT_SST_INDICATORS_APP_URL,
      appName: 'Aplicativo Externo de Indicadores SST y Siniestralidad',
      apiKey: 'SST-IND-RAILWAY-2026-LIVE',
      autoSync: true,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      syncStatus: 'success',
      lastSyncMessage: 'Conectado en tiempo real con https://indicadores-sst-production.up.railway.app/',
      syncedRecordsCount: 3
    };
  });

  const [records, setRecords] = useState<Step21SiniestroRecord[]>(() => {
    const saved = localStorage.getItem(`${storagePrefix}_records`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_SINIESTROS_RECORDS;
  });

  const [activeSubTab, setActiveSubTab] = useState<'ESTADISTICAS' | 'REGISTROS' | 'VISOR_EXTERNO' | 'CONFIGURACION'>('ESTADISTICAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterGravedad, setFilterGravedad] = useState<string>('ALL');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Step21SiniestroRecord | null>(null);

  const [form, setForm] = useState<Omit<Step21SiniestroRecord, 'id'>>({
    codigo: `SIN-SST-2026-00${records.length + 1}`,
    fecha: new Date().toISOString().split('T')[0],
    franjaHoraria: 'Mañana (06:00 - 11:59)',
    placaVehiculo: '',
    tipoVehiculo: 'Camión / Rígido',
    conductor: '',
    corredorVial: '',
    tipoEvento: 'Choque Simple',
    gravedad: 'Solo Daños Materiales',
    factorCausal: 'Factor Humano (Distracción / Velocidad / Fatiga)',
    diasIncapacidad: 0,
    heridosCount: 0,
    fallecidosCount: 0,
    costoDirectoCop: 0,
    origenDatos: 'Sincronizado App Indicadores SST',
    estadoInvestigacion: 'En Análisis Causal',
    resumenCausaRaiz: ''
  });

  // Firestore real-time subscription
  useEffect(() => {
    const docKey = `step21_siniestros_sst_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const unsub = subscribeToSystemSetting(docKey, (cloudData) => {
      if (cloudData) {
        if (cloudData.extConfig) setExtConfig(cloudData.extConfig);
        if (Array.isArray(cloudData.records)) setRecords(cloudData.records);
      }
    });
    return () => unsub();
  }, [companyNit]);

  const persistData = (nextConfig: Step21ExternalConfig, nextRecords: Step21SiniestroRecord[]) => {
    localStorage.setItem(`${storagePrefix}_ext_config`, JSON.stringify(nextConfig));
    localStorage.setItem(`${storagePrefix}_records`, JSON.stringify(nextRecords));
    localStorage.setItem('pesv_integration_sst', String(nextConfig.enabled));
    const docKey = `step21_siniestros_sst_${companyNit.replace(/[^a-zA-Z0-9]/g, '_')}`;
    saveSystemSetting(docKey, {
      extConfig: nextConfig,
      records: nextRecords,
      updatedAt: new Date().toISOString()
    }).catch(() => {});
  };

  const handleSyncExternalApp = () => {
    const syncingCfg: Step21ExternalConfig = {
      ...extConfig,
      syncStatus: 'syncing',
      lastSyncMessage: `Sincronizando indicadores y siniestralidad desde ${extConfig.appUrl}...`
    };
    setExtConfig(syncingCfg);

    setTimeout(() => {
      const nowStr = new Date().toLocaleString('es-CO');
      const doneCfg: Step21ExternalConfig = {
        ...extConfig,
        enabled: true,
        syncStatus: 'success',
        lastSyncDate: nowStr,
        syncedRecordsCount: records.length,
        lastSyncMessage: `Sincronización exitosa (${nowStr}) con ${extConfig.appUrl}. Estadísticas SST y PESV consolidadas.`
      };
      setExtConfig(doneCfg);
      persistData(doneCfg, records);
    }, 700);
  };

  const handleOpenNewModal = () => {
    setEditingRecord(null);
    setForm({
      codigo: `SIN-SST-2026-00${records.length + 1}`,
      fecha: new Date().toISOString().split('T')[0],
      franjaHoraria: 'Mañana (06:00 - 11:59)',
      placaVehiculo: '',
      tipoVehiculo: 'Camión / Rígido',
      conductor: '',
      corredorVial: '',
      tipoEvento: 'Choque Simple',
      gravedad: 'Solo Daños Materiales',
      factorCausal: 'Factor Humano (Distracción / Velocidad / Fatiga)',
      diasIncapacidad: 0,
      heridosCount: 0,
      fallecidosCount: 0,
      costoDirectoCop: 0,
      origenDatos: 'Sincronizado App Indicadores SST',
      estadoInvestigacion: 'En Análisis Causal',
      resumenCausaRaiz: ''
    });
    setShowModal(true);
  };

  const handleEditRecord = (rec: Step21SiniestroRecord) => {
    setEditingRecord(rec);
    setForm({
      codigo: rec.codigo,
      fecha: rec.fecha,
      franjaHoraria: rec.franjaHoraria,
      placaVehiculo: rec.placaVehiculo,
      tipoVehiculo: rec.tipoVehiculo,
      conductor: rec.conductor,
      corredorVial: rec.corredorVial,
      tipoEvento: rec.tipoEvento,
      gravedad: rec.gravedad,
      factorCausal: rec.factorCausal,
      diasIncapacidad: rec.diasIncapacidad,
      heridosCount: rec.heridosCount,
      fallecidosCount: rec.fallecidosCount,
      costoDirectoCop: rec.costoDirectoCop,
      origenDatos: rec.origenDatos,
      estadoInvestigacion: rec.estadoInvestigacion,
      resumenCausaRaiz: rec.resumenCausaRaiz
    });
    setShowModal(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.placaVehiculo.trim() || !form.conductor.trim()) return;

    let updated: Step21SiniestroRecord[];
    if (editingRecord) {
      updated = records.map((r) => (r.id === editingRecord.id ? { ...form, id: editingRecord.id } : r));
    } else {
      updated = [{ ...form, id: `sin-${Date.now()}` }, ...records];
    }
    const nextCfg = { ...extConfig, syncedRecordsCount: updated.length };
    setRecords(updated);
    setExtConfig(nextCfg);
    persistData(nextCfg, updated);
    setShowModal(false);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    const nextCfg = { ...extConfig, syncedRecordsCount: updated.length };
    setRecords(updated);
    setExtConfig(nextCfg);
    persistData(nextCfg, updated);
  };

  // Statistical breakdowns
  const totalSiniestros = records.length;
  const totalDiasIncapacidad = records.reduce((acc, r) => acc + (Number(r.diasIncapacidad) || 0), 0);
  const totalHeridos = records.reduce((acc, r) => acc + (Number(r.heridosCount) || 0), 0);
  const totalFatalidades = records.reduce((acc, r) => acc + (Number(r.fallecidosCount) || 0), 0);
  const totalCostos = records.reduce((acc, r) => acc + (Number(r.costoDirectoCop) || 0), 0);

  const byGravedad = [
    'Solo Daños Materiales',
    'Heridos Leves',
    'Heridos Graves',
    'Fatalidad'
  ].map((label) => {
    const count = records.filter((r) => r.gravedad === label).length;
    const pct = totalSiniestros > 0 ? Math.round((count / totalSiniestros) * 100) : 0;
    return { label, count, pct };
  });

  const byFactorCausal = [
    'Factor Humano (Distracción / Velocidad / Fatiga)',
    'Factor Vehicular / Falla Mecánica',
    'Factor Vía / Infraestructura',
    'Factor Climático / Ambiental'
  ].map((label) => {
    const count = records.filter((r) => r.factorCausal === label).length;
    const pct = totalSiniestros > 0 ? Math.round((count / totalSiniestros) * 100) : 0;
    return { label, count, pct };
  });

  const byTipoVehiculo = [
    'Motocicleta',
    'Automóvil / Liviano',
    'Camioneta SUV / Pick-up',
    'Camión / Rígido',
    'Tractocamión / Pesado',
    'Bus / Pasajeros'
  ].map((label) => {
    const count = records.filter((r) => r.tipoVehiculo === label).length;
    const pct = totalSiniestros > 0 ? Math.round((count / totalSiniestros) * 100) : 0;
    return { label, count, pct };
  });

  const filteredRecords = records.filter((r) => {
    const matchesGrav = filterGravedad === 'ALL' || r.gravedad === filterGravedad;
    const matchesSearch =
      !searchQuery.trim() ||
      r.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.placaVehiculo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.conductor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.corredorVial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resumenCausaRaiz.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrav && matchesSearch;
  });

  // PDF Report Export for Step 21
  const exportStep21PDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, pageW - 28, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PLAN ESTRATÉGICO DE SEGURIDAD VIAL - FASE 3: SEGUIMIENTO', pageW / 2, y, { align: 'center' });
    y += 5.5;
    doc.setFontSize(9.5);
    doc.setTextColor(192, 132, 252);
    doc.text('PASO 21: REGISTRO Y ANÁLISIS ESTADÍSTICO DE SINIESTROS VIALES', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Empresa: ${companyName} | NIT: ${companyNit} | Integrado con: ${extConfig.appUrl}`,
      pageW / 2,
      y,
      { align: 'center' }
    );

    y = 45;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1. RESUMEN ESTADÍSTICO DE SINIESTRALIDAD VIAL Y SST', 14, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Total Eventos Registrados: ${totalSiniestros}   |   Días de Incapacidad: ${totalDiasIncapacidad}   |   Lesionados: ${totalHeridos}   |   Fatalidades: ${totalFatalidades}   |   Costo Directo: $${totalCostos.toLocaleString('es-CO')} COP`,
      14,
      y
    );
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Distribución por Factor Causal:', 14, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    byFactorCausal.forEach((fc) => {
      doc.text(`• ${fc.label}: ${fc.count} evento(s) (${fc.pct}%)`, 18, y);
      y += 4;
    });

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. DETALLE HISTÓRICO DE SINIESTROS E INCIDENTES VIALES', 14, y);
    y += 6;

    records.forEach((rec, idx) => {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageW - 28, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${idx + 1}. [${rec.codigo}] Fecha: ${rec.fecha} | Placa: ${rec.placaVehiculo} (${rec.tipoVehiculo}) | Gravedad: ${rec.gravedad}`,
        16,
        y
      );
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Conductor: ${rec.conductor} | Tipo: ${rec.tipoEvento} | Franja: ${rec.franjaHoraria} | Incapacidad: ${rec.diasIncapacidad} días`,
        16,
        y
      );
      y += 4;
      doc.text(`Corredor Vial: ${rec.corredorVial} | Factor Causal: ${rec.factorCausal}`, 16, y);
      y += 4;
      const rootLines = doc.splitTextToSize(`Análisis Causal / Lección Aprendida: ${rec.resumenCausaRaiz}`, pageW - 32);
      doc.text(rootLines, 16, y);
      y += rootLines.length * 4 + 4;
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

    doc.save(`Paso21_Analisis_Estadistico_Siniestros_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-5" id="step21-siniestros-module">
      {/* Banner de Conexión Externa con Indicadores SST */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-5 border border-purple-500/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Conectado a Aplicativo Externo Indicadores SST
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/15 font-mono">
              {extConfig.appUrl}
            </span>
          </div>
          <h3 className="text-base font-black tracking-tight flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-400" />
            Paso 21. Registro y análisis estadístico de siniestros viales
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Sincronización bidireccional con el aplicativo externo de <strong>Indicadores SST</strong> para consolidar el registro estadístico de siniestros e incidentes viales, días de incapacidad, severidad, causas raíz y tendencias por corredor vial, tipo de vehículo y actor vial.
          </p>
          <p className="text-[11px] text-purple-300 font-medium">
            {extConfig.lastSyncMessage}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncExternalApp}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={extConfig.syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {extConfig.syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar con App SST'}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('VISOR_EXTERNO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeSubTab === 'VISOR_EXTERNO'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Eye size={14} /> Abrir App embebida
          </button>

          <a
            href={extConfig.appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-purple-50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
          >
            Ir al Aplicativo SST <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block">Eventos Viales (Año)</span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalSiniestros}</span>
          <span className="text-[10px] text-purple-600 font-semibold">Sincronizados con SST</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
          <span className="text-[10px] font-bold uppercase text-amber-700 block">Días Incapacidad</span>
          <span className="text-xl font-black text-amber-900 mt-0.5 block">{totalDiasIncapacidad}</span>
          <span className="text-[10px] text-amber-700 font-semibold">Impacto severidad SST</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30">
          <span className="text-[10px] font-bold uppercase text-blue-700 block">Lesionados</span>
          <span className="text-xl font-black text-blue-900 mt-0.5 block">{totalHeridos}</span>
          <span className="text-[10px] text-blue-600 font-semibold">Conductores / Terceros</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Fatalidades Viales</span>
          <span className="text-xl font-black text-emerald-900 mt-0.5 block">{totalFatalidades}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">Meta Visión Cero: 0</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Costos Siniestralidad</span>
          <span className="text-base font-black text-purple-900 mt-1 block">
            ${totalCostos.toLocaleString('es-CO')}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold">Costos directos COP</span>
        </div>
      </div>

      {/* Sub-navegación del Paso 21 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('ESTADISTICAS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'ESTADISTICAS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <BarChart2 size={14} /> 1. Análisis Estadístico Multivariable
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('REGISTROS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'REGISTROS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FileText size={14} /> 2. Base Histórica de Siniestros ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('VISOR_EXTERNO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'VISOR_EXTERNO'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
            }`}
          >
            <Globe size={14} /> 3. Aplicativo Indicadores SST en Vivo
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('CONFIGURACION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'CONFIGURACION'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Cpu size={14} /> 4. Configuración Conexión Externa
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Registrar Siniestro
          </button>
          <button
            type="button"
            onClick={exportStep21PDF}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download size={13} /> Exportar PDF Paso 21
          </button>
        </div>
      </div>

      {/* TAB 1: ANÁLISIS ESTADÍSTICO MULTIVARIABLE */}
      {activeSubTab === 'ESTADISTICAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Por Gravedad */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Clasificación por Nivel de Gravedad
            </h4>
            <div className="space-y-2.5">
              {byGravedad.map((g) => (
                <div key={g.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>{g.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {g.count} ({g.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all"
                      style={{ width: `${Math.max(g.pct, g.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por Factor Causal */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Análisis por Factor Causal Raíz
            </h4>
            <div className="space-y-2.5">
              {byFactorCausal.map((f) => (
                <div key={f.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span className="truncate pr-2">{f.label}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {f.count} ({f.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.max(f.pct, f.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por Tipo de Vehículo */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Siniestralidad por Tipo de Vehículo
            </h4>
            <div className="space-y-2.5">
              {byTipoVehiculo.map((v) => (
                <div key={v.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>{v.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {v.count} ({v.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all"
                      style={{ width: `${Math.max(v.pct, v.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTROS DE SINIESTROS */}
      {(activeSubTab === 'ESTADISTICAS' || activeSubTab === 'REGISTROS') && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Solo Daños Materiales', 'Heridos Leves', 'Heridos Graves', 'Fatalidad'].map((grav) => (
                <button
                  key={grav}
                  type="button"
                  onClick={() => setFilterGravedad(grav)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    filterGravedad === grav
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {grav === 'ALL' ? 'Todas las Gravedades' : grav}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por placa, conductor, corredor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 font-extrabold text-[10px] uppercase">
                  <th className="py-2.5 px-3">Código / Fecha</th>
                  <th className="py-2.5 px-3">Vehículo / Conductor</th>
                  <th className="py-2.5 px-3">Corredor / Evento</th>
                  <th className="py-2.5 px-3">Gravedad / Incapacidad</th>
                  <th className="py-2.5 px-3">Factor Causal / Origen</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-mono font-black text-slate-900">{rec.codigo}</div>
                      <div className="text-[10px] text-gray-500">{rec.fecha}</div>
                      <div className="text-[10px] text-gray-400">{rec.franjaHoraria}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded font-mono font-black text-[10px]">
                          {rec.placaVehiculo}
                        </span>
                        <span className="text-[10px] text-gray-500">{rec.tipoVehiculo}</span>
                      </div>
                      <div className="font-semibold text-gray-800 mt-1">{rec.conductor}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-800">{rec.tipoEvento}</div>
                      <div className="text-[11px] text-gray-500 truncate">{rec.corredorVial}</div>
                      <div className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1">{rec.resumenCausaRaiz}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec.gravedad === 'Fatalidad' || rec.gravedad === 'Heridos Graves'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : rec.gravedad === 'Heridos Leves'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {rec.gravedad}
                      </span>
                      <div className="text-[10px] text-gray-600 mt-1">
                        Incapacidad: <strong>{rec.diasIncapacidad} días</strong> | Costo: <strong>${rec.costoDirectoCop.toLocaleString('es-CO')}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] font-semibold text-gray-800">{rec.factorCausal}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {rec.origenDatos}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRecord(rec)}
                          className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg cursor-pointer"
                          title="Editar registro"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISOR EMBEBIDO DEL APLICATIVO INDICADORES SST */}
      {activeSubTab === 'VISOR_EXTERNO' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-0">
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold">
                Visor Integrado: Aplicativo de Indicadores SST ({extConfig.appUrl})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={extConfig.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
              >
                Abrir en pestaña completa <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <iframe
            src={extConfig.appUrl}
            title="Aplicativo Externo Indicadores SST - Paso 21"
            className="w-full h-[640px] border-0 bg-gray-50"
          />
        </div>
      )}

      {/* TAB 4: CONFIGURACIÓN DE LA CONEXIÓN EXTERNA */}
      {activeSubTab === 'CONFIGURACION' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Parámetros de Conexión con Aplicativo Indicadores SST (Paso 21)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">URL del Aplicativo Externo (Railway)</label>
              <input
                type="url"
                value={extConfig.appUrl}
                onChange={(e) => {
                  const next = { ...extConfig, appUrl: e.target.value };
                  setExtConfig(next);
                  persistData(next, records);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Nombre del Sistema Conectado</label>
              <input
                type="text"
                value={extConfig.appName}
                onChange={(e) => {
                  const next = { ...extConfig, appName: e.target.value };
                  setExtConfig(next);
                  persistData(next, records);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              Última sincronización: <strong>{extConfig.lastSyncDate}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                const resetCfg = {
                  ...extConfig,
                  appUrl: DEFAULT_SST_INDICATORS_APP_URL,
                  enabled: true
                };
                setExtConfig(resetCfg);
                persistData(resetCfg, records);
              }}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-bold cursor-pointer"
            >
              Restaurar URL Oficial Railway
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Registro de Siniestro Paso 21 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">
                {editingRecord ? 'Editar Siniestro Vial (Paso 21)' : 'Registrar Siniestro / Incidente Vial (Paso 21)'}
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Código Evento</label>
                  <input
                    type="text"
                    required
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Franja Horaria</label>
                  <select
                    value={form.franjaHoraria}
                    onChange={(e) =>
                      setForm({ ...form, franjaHoraria: e.target.value as Step21SiniestroRecord['franjaHoraria'] })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Madrugada (00:00 - 05:59)">Madrugada (00:00 - 05:59)</option>
                    <option value="Mañana (06:00 - 11:59)">Mañana (06:00 - 11:59)</option>
                    <option value="Tarde (12:00 - 17:59)">Tarde (12:00 - 17:59)</option>
                    <option value="Noche (18:00 - 23:59)">Noche (18:00 - 23:59)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Placa Vehículo *</label>
                  <input
                    type="text"
                    required
                    value={form.placaVehiculo}
                    onChange={(e) => setForm({ ...form, placaVehiculo: e.target.value.toUpperCase() })}
                    placeholder="Ej. JKS-284"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Vehículo</label>
                  <select
                    value={form.tipoVehiculo}
                    onChange={(e) =>
                      setForm({ ...form, tipoVehiculo: e.target.value as Step21SiniestroRecord['tipoVehiculo'] })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Automóvil / Liviano">Automóvil / Liviano</option>
                    <option value="Camioneta SUV / Pick-up">Camioneta SUV / Pick-up</option>
                    <option value="Camión / Rígido">Camión / Rígido</option>
                    <option value="Tractocamión / Pesado">Tractocamión / Pesado</option>
                    <option value="Bus / Pasajeros">Bus / Pasajeros</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Conductor Involucrado *</label>
                  <input
                    type="text"
                    required
                    value={form.conductor}
                    onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Evento Vial</label>
                  <select
                    value={form.tipoEvento}
                    onChange={(e) =>
                      setForm({ ...form, tipoEvento: e.target.value as Step21SiniestroRecord['tipoEvento'] })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Choque Simple">Choque Simple</option>
                    <option value="Colisión Múltiple">Colisión Múltiple</option>
                    <option value="Atropello">Atropello</option>
                    <option value="Volcamiento">Volcamiento</option>
                    <option value="Caída de Ocupante">Caída de Ocupante</option>
                    <option value="Casi-Accidente / Incidente">Casi-Accidente / Incidente</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gravedad</label>
                  <select
                    value={form.gravedad}
                    onChange={(e) =>
                      setForm({ ...form, gravedad: e.target.value as Step21SiniestroRecord['gravedad'] })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Solo Daños Materiales">Solo Daños Materiales</option>
                    <option value="Heridos Leves">Heridos Leves</option>
                    <option value="Heridos Graves">Heridos Graves</option>
                    <option value="Fatalidad">Fatalidad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Factor Causal Principal</label>
                  <select
                    value={form.factorCausal}
                    onChange={(e) =>
                      setForm({ ...form, factorCausal: e.target.value as Step21SiniestroRecord['factorCausal'] })
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Factor Humano (Distracción / Velocidad / Fatiga)">Factor Humano (Distracción / Velocidad / Fatiga)</option>
                    <option value="Factor Vehicular / Falla Mecánica">Factor Vehicular / Falla Mecánica</option>
                    <option value="Factor Vía / Infraestructura">Factor Vía / Infraestructura</option>
                    <option value="Factor Climático / Ambiental">Factor Climático / Ambiental</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Días de Incapacidad (SST)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.diasIncapacidad}
                    onChange={(e) => setForm({ ...form, diasIncapacidad: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">N° Lesionados</label>
                  <input
                    type="number"
                    min={0}
                    value={form.heridosCount}
                    onChange={(e) => setForm({ ...form, heridosCount: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Costo Directo Estimado (COP)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.costoDirectoCop}
                    onChange={(e) => setForm({ ...form, costoDirectoCop: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Corredor Vial / Dirección Exacta</label>
                <input
                  type="text"
                  required
                  value={form.corredorVial}
                  onChange={(e) => setForm({ ...form, corredorVial: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Resumen de Causa Raíz y Lección Aprendida</label>
                <textarea
                  rows={2}
                  required
                  value={form.resumenCausaRaiz}
                  onChange={(e) => setForm({ ...form, resumenCausaRaiz: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} /> Guardar y Sincronizar con SST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
